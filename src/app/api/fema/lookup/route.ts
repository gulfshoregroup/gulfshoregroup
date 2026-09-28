import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// FEMA flood zone risk descriptions based on zone codes
const ZONE_DESCRIPTIONS: Record<string, string> = {
  X: "Outside the high-risk flood area (FEMA's Special Flood Hazard Area). Lower-risk area.",
  "X SHADED": "Moderate flood risk (0.2% annual chance).",
  "0.2 PCT": "Moderate flood risk (0.2% annual chance).",
  A: "High-risk flood area. No base flood elevations determined.",
  AE: "High-risk flood area. Base flood elevations determined.",
  AH: "High-risk flood area with shallow flooding.",
  AO: "High-risk flood area with sheet flow on sloping terrain.",
  AR: "High-risk flood area due to decertification.",
  V: "High-risk coastal flood area. No base flood elevations determined.",
  VE: "High-risk coastal flood area. Base flood elevations determined.",
  D: "Undetermined flood hazard area.",
  OPEN_WATER: "Open water.",
  AREA_NOT_INCLUDED: "Area not included in FEMA mapping.",
};

function getRiskLevel(zone: string): string {
  const z = zone.toUpperCase().trim();
  if (["V", "VE", "A", "AE", "AH", "AO", "AR"].includes(z)) {
    return "High Risk";
  }
  if (["X SHADED", "0.2 PCT"].includes(z) || z.includes("0.2")) {
    return "Moderate Risk";
  }
  if (z === "X" || z === "AREA NOT INCLUDED") {
    return "Low Risk";
  }
  if (z === "D") {
    return "Undetermined";
  }
  return "Unknown";
}

function normalizeZone(fldZone: string): string {
  if (!fldZone) return "D";
  const z = fldZone.toUpperCase().trim();
  if (z.startsWith("X") && z.includes("SHADED")) return "X SHADED";
  if (z.startsWith("X")) return "X";
  if (z.startsWith("AE")) return "AE";
  if (z.startsWith("VE")) return "VE";
  if (z.startsWith("AH")) return "AH";
  if (z.startsWith("AO")) return "AO";
  if (z.startsWith("AR")) return "AR";
  if (z.startsWith("V")) return "V";
  if (z.startsWith("A")) return "A";
  if (z.includes("0.2")) return "X SHADED";
  if (z.includes("NOT INCLUDED")) return "AREA_NOT_INCLUDED";
  return z;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const address = searchParams.get("address");
    const city = searchParams.get("city");
    const zip = searchParams.get("zip");

    if (!address || !city || !zip) {
      return NextResponse.json(
        { error: "Missing address, city, or zip" },
        { status: 400 }
      );
    }

    const fullAddress = `${address}, ${city}, FL ${zip}`;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key is not configured" },
        { status: 500 }
      );
    }

    // 1. Geocode the address
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      fullAddress
    )}&key=${apiKey}`;

    const geocodeRes = await fetch(geocodeUrl, {
      signal: AbortSignal.timeout(10000),
    });
    const geocodeData = await geocodeRes.json();

    if (geocodeData.status !== "OK" || !geocodeData.results?.length) {
      return NextResponse.json(
        { error: `Could not geocode address: ${geocodeData.status || "UNKNOWN_ERROR"}` },
        { status: 404 }
      );
    }

    const location = geocodeData.results[0].geometry.location;
    const formattedAddress = geocodeData.results[0].formatted_address;
    const lat = location.lat;
    const lng = location.lng;

    // 2. Query FEMA NFHL identify API
    // Try layer-specific identify endpoint first (more reliable for ArcGIS)
    const mapExtent = `${lng - 0.1},${lat - 0.1},${lng + 0.1},${lat + 0.1}`;
    const buildFemaUrl = (endpoint: string) => {
      const url = new URL(endpoint);
      url.searchParams.set("geometry", `${lng},${lat}`);
      url.searchParams.set("geometryType", "esriGeometryPoint");
      url.searchParams.set("sr", "4326");
      url.searchParams.set("tolerance", "0");
      url.searchParams.set("mapExtent", mapExtent);
      url.searchParams.set("imageDisplay", "600,400,96");
      url.searchParams.set("returnGeometry", "false");
      url.searchParams.set("f", "json");
      return url;
    };

    // Layer 28 is the Flood Hazard Zones layer in FEMA NFHL
    const femaEndpoints = [
      "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/identify",
      "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/0/identify",
      "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/identify",
    ];

    let femaRes: Response | null = null;
    let lastError = "";

    for (const endpoint of femaEndpoints) {
      try {
        const url = buildFemaUrl(endpoint);
        if (endpoint.includes("/MapServer/identify")) {
          url.searchParams.set("layers", "all:28");
        }

        const res = await fetch(url.toString(), {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(15000),
        });

        if (res.ok) {
          femaRes = res;
          break;
        } else {
          const text = await res.text().catch(() => "");
          lastError = `${endpoint} -> ${res.status}: ${text.slice(0, 100)}`;
          console.log(`[FEMA Lookup] Endpoint failed: ${lastError}`);
        }
      } catch (e: any) {
        lastError = `${endpoint} -> ${e.message}`;
        console.log(`[FEMA Lookup] Endpoint error: ${lastError}`);
      }
    }

    if (!femaRes) {
      throw new Error(`FEMA API failed on all endpoints. Last error: ${lastError}`);
    }

    const femaData = await femaRes.json();
    const results = femaData.results || [];

    if (!results.length) {
      return NextResponse.json({
        address: {
          input: fullAddress,
          matched: formattedAddress,
          lat,
          lng,
        },
        zone: "D",
        zoneLabel: "Zone D",
        riskLevel: "Undetermined",
        description:
          "FEMA flood zone data is not available for this exact location. This may be outside mapped areas.",
        panelNumber: null,
        panelDate: null,
        disclaimer:
          "This is a starting point, not an official flood determination. For official determinations, consult a surveyor or FEMA.",
      });
    }

    // Pick the most specific flood zone result
    const topResult = results[0];
    const attrs = topResult.attributes || {};

    const rawZone = attrs.FLD_ZONE || attrs.FLD_ZONE_CODE || "";
    const zone = normalizeZone(rawZone);
    const zoneLabel = `Zone ${zone.replace(/_/g, " ")}`;
    const riskLevel = getRiskLevel(zone);
    const description =
      ZONE_DESCRIPTIONS[zone] ||
      attrs.SFHA ||
      "Flood zone information available. Consult FEMA for official determination.";
    const panelNumber = attrs.FIRM_PAN || attrs.PANEL || attrs.FEMA_PAN || null;
    const panelDate = attrs.EFF_DATE || attrs.PANEL_DATE || null;

    return NextResponse.json({
      address: {
        input: fullAddress,
        matched: formattedAddress,
        lat,
        lng,
      },
      zone,
      zoneLabel,
      riskLevel,
      description,
      panelNumber,
      panelDate,
      rawAttributes: attrs,
      disclaimer:
        "This is a starting point, not an official flood determination. For official determinations, consult a surveyor or FEMA.",
    });
  } catch (error: any) {
    console.error("[FEMA Lookup] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to lookup flood zone" },
      { status: 500 }
    );
  }
}
