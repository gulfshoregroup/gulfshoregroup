/**
 * Luxury Property Alert Email
 * Stack: React Email + Resend
 *
 * Usage:
 *   RESEND_API_KEY=re_xxxx \
 *   NEXT_PUBLIC_SERVER_URL=https://gulfshoregroup.com \
 *   npx tsx propertyAlertEmail.tsx
 */

import UrlMaker from "@/hooks/url-maker";
import {
    Body,
    Button,
    Column,
    Container,
    Font,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Row,
    Section,
    Tailwind,
    Text,
  } from "@react-email/components";
  import { render } from "@react-email/render";
  import * as React from "react";
  import { Resend } from "resend";
  import prisma from "@/lib/prisma";
  
  // ─── Types ───────────────────────────────────────────────────────────────────
  
  interface PropertyImage {
    MediaURL?: string;
    Order?: number;
  }

  interface Property {
    id: string;
    ListingKey?: string;
    MLSNumber?: string;
    FullAddress: string;
    City: string;
    StateOrProvince?: string;
    PostalCode?: string;
    ListPrice?: number;
    BedroomsTotal?: number;
    BathroomsFull?: number;
    BathroomsHalf?: number;
    LivingArea?: number;
    PropertyType?: string;
    PropertySubType?: string;
    YearBuilt?: number;
    GarageSpaces?: number;
    PoolPrivateYN?: boolean;
    WaterfrontYN?: boolean;
    HOAFee?: number;
    HOAFeeFreq?: string;
    MandatoryHOAYN?: boolean;
    ListOfficeName?: string;
    ListAgentFullName?: string;
    StandardStatus?: string;
    DaysOnMarket?: number;
    images?: Array<string | PropertyImage> | null;
    VirtualTourURLUnbranded?: string;
    Community?: string;
    Description?: string;
  }
  
  interface PropertiesApiResponse {
    success?: boolean;
    total?: number;
    page?: number;
    totalPages?: number;
    data?: Property | null;
  }
  
  // ─── Helpers ─────────────────────────────────────────────────────────────────
  
  const PRIMARY = "#8B2020";          // oklch(0.5591 0.2248 23.97) → deep crimson
  const PRIMARY_LIGHT = "#B84040";
  const GOLD = "#C9A96E";
  const CREAM = "#FAF7F2";
  const DARK = "#1A0A0A";
  const MID = "#d90429";
  const BORDER = "#E8DDD8";
  
  function formatPrice(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)}M`;
    return `$${n.toLocaleString()}`;
  }
  
  function capitalize(s: string): string {
    const directions = ['ne', 'nw', 'se', 'sw', 'n', 's', 'e', 'w'];
    return s
      .split(" ")
      .map((w) => {
        if (directions.includes(w.toLowerCase())) return w.toUpperCase();
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      })
      .join(" ");
  }


  function getImage(property: Property): string {
    if (Array.isArray(property.images) && property.images.length > 0) {
      const first = property.images[0];
      if (typeof first === "string") return first;
      if (first?.MediaURL) return first.MediaURL;
    }
    // Deterministic placeholder so the template always renders
    return `https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80`;
  }

  function getPropertiesApiBaseUrl(): string {
    return (
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.SITE_URL ||
      "https://gulfshore-fullcode-next-production.up.railway.app"
    );
  }
  
  function statusColor(status?: string): { bg: string; text: string } {
    switch (status?.toLowerCase()) {
      case "active":       return { bg: "#166534", text: "#DCFCE7" };
      case "pending":      return { bg: "#92400E", text: "#FEF3C7" };
      case "closed":       return { bg: "#4B5563", text: "#F3F4F6" };
      default:             return { bg: PRIMARY,    text: "#FFE4E1" };
    }
  }
  
  // ─── Fetch Properties ─────────────────────────────────────────────────────────
  
  async function fetchProperties(): Promise<Property | null> {
    const url = `${getPropertiesApiBaseUrl()}/api/v2/properties/226019967`;

    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Properties API error ${res.status}: ${await res.text()}`);

    const json: PropertiesApiResponse = await res.json();
    if (!json.success) {
      throw new Error("Properties API returned an unsuccessful response");
    }

    return json.data ?? {} as Property | null;
  }
  
  // ─── Sub-components ───────────────────────────────────────────────────────────
  
  function StatPill({ label }: { label: string }) {
    return (
      <Column style={{ padding: "0 6px" }}>
        <Text
          style={{
            margin: 0,
            fontSize: "12px",
            color: "#000000",
            whiteSpace: "nowrap",
            fontFamily: "'Poppins', Arial, sans-serif",
          }}
        >
          {label}
        </Text>
      </Column>
    );
  }
  
  function PropertyCard({ property, leadId, recipientName }: { property: Property; leadId?: string; recipientName?: string }) {
    const imgSrc = getImage(property);
    const { bg: statusBg, text: statusText } = statusColor(property.StandardStatus);
    const baths =
      (property.BathroomsFull ?? 0) + (property.BathroomsHalf ?? 0) * 0.5;
  
    return (
      <Section
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "0",
          overflow: "hidden",
          border: `1px solid ${BORDER}`,
          marginBottom: "32px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        }}
      >
        {/* Hero Image */}
        <Section style={{ margin: 0, padding: 0 }}>
          <Link href={
            leadId 
              ? `${getPropertiesApiBaseUrl()}/api/v2/magic-login?leadId=${encodeURIComponent(leadId)}&redirect_url=${encodeURIComponent(`${getPropertiesApiBaseUrl()}${UrlMaker(property.City,property.Community ||"",property.FullAddress,property.MLSNumber ||"")}?utm_source=email_alert&n=${encodeURIComponent(recipientName || "")}`)}`
              : `${getPropertiesApiBaseUrl()}${UrlMaker(property.City,property.Community ||"",property.FullAddress,property.MLSNumber ||"")}?utm_source=email_alert&n=${encodeURIComponent(recipientName || "")}`
          }>
            <Img
              src={imgSrc}
              alt={property.FullAddress}
              width="600"
              height="320"
              style={{
                width: "100%",
                height: "320px",
                objectFit: "cover",
                display: "block",
              }}
            />
          </Link>
        </Section>
  
        {/* Card Body */}
        <Section style={{ padding: "20px 24px 16px" }}>
          {/* Status & DOM Badges */}
          <Text style={{ margin: "0 0 12px 0", lineHeight: "1" }}>
            {property.StandardStatus && (
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: statusBg,
                  color: statusText,
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  marginRight: "8px",
                  fontFamily: "'Poppins', Arial, sans-serif",
                }}
              >
                {property.StandardStatus}
              </span>
            )}
            {property.DaysOnMarket != null && (
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: "#F3F4F6",
                  color: "#374151",
                  fontSize: "10px",
                  fontWeight: "600",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontFamily: "'Poppins', Arial, sans-serif",
                }}
              >
                {property.DaysOnMarket}d on market
              </span>
            )}
          </Text>

          {/* Price */}
          <Text
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: DARK,
              margin: "0 0 4px",
              fontFamily: "'Poppins', Arial, sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            {formatPrice(property.ListPrice ?? 0)}
          </Text>
  
          {/* Address */}
          <Text
            style={{
              fontSize: "14px",
              color: "#1A0A0A",
              margin: "0 0 4px",
              fontFamily: "'Poppins', Arial, sans-serif",
            }}
          >
            {capitalize(`${property.FullAddress}, ${property.City}, ${property.StateOrProvince || 'FL'} ${property.PostalCode || ''}`.trim()).replace(" Fl", " FL").replace(" Fl,", " FL,")}
          </Text>
  
          {/* City + subtype */}
          <Text
            style={{
              fontSize: "12px",
              color: GOLD,
              margin: "0 0 16px",
              fontWeight: "600",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "'Poppins', Arial, sans-serif",
            }}
          >
            {property.Community || property.City}
            {property.PropertySubType ? `  ·  ${property.PropertySubType}` : ""}
          </Text>
  
          {/* Divider */}
          <Hr style={{ borderColor: BORDER, margin: "0 0 14px" }} />
  
          {/* Stats */}
          <Row>
            {property.BedroomsTotal != null && (
              <StatPill label={`${property.BedroomsTotal} Beds`} />
            )}
            {baths > 0 && (
              <StatPill label={`${baths} Baths`} />
            )}
            {property.LivingArea != null && (
              <StatPill label={`${property.LivingArea.toLocaleString()} sqft`} />
            )}
            {property.GarageSpaces != null && property.GarageSpaces > 0 && (
              <StatPill label={`${property.GarageSpaces}-Car Garage`} />
            )}
          </Row>
  
          {/* Feature tags */}
          {(property.PoolPrivateYN || property.WaterfrontYN) && (
            <Row style={{ marginTop: "10px" }}>
              {property.PoolPrivateYN && (
                <Column style={{ paddingRight: "8px" }}>
                  <Text
                    style={{
                      display: "inline-block",
                      backgroundColor: "#EFF6FF",
                      color: "#1D4ED8",
                      fontSize: "11px",
                      padding: "3px 10px",
                      borderRadius: "20px",
                      margin: 0,
                      fontFamily: "'Poppins', Arial, sans-serif",
                    }}
                  >
                    Private Pool
                  </Text>
                </Column>
              )}
              {property.WaterfrontYN && (
                <Column>
                  <Text
                    style={{
                      display: "inline-block",
                      backgroundColor: "#ECFDF5",
                      color: "#065F46",
                      fontSize: "11px",
                      padding: "3px 10px",
                      borderRadius: "20px",
                      margin: 0,
                      fontFamily: "'Poppins', Arial, sans-serif",
                    }}
                  >
                    Waterfront
                  </Text>
                </Column>
              )}
            </Row>
          )}
  
          {/* HOA */}
          {property.MandatoryHOAYN && property.HOAFee != null && property.HOAFee > 0 && (
            <Text
              style={{
                fontSize: "11px",
                color: "#1A0A0A",
                margin: "10px 0 0",
                fontFamily: "'Poppins', Arial, sans-serif",
              }}
            >
              HOA: <strong>${property.HOAFee.toLocaleString()}</strong> / {property.HOAFeeFreq}
            </Text>
          )}
        </Section>
  
        <Section
          style={{
            backgroundColor: CREAM,
            borderTop: `1px solid ${BORDER}`,
            padding: "16px 24px",
          }}
        >
          <Row style={{ marginBottom: "16px" }}>
            <Column>
              <Text style={{ fontSize: "11px", color: "#666", margin: "0 0 4px", fontFamily: "'Poppins', Arial, sans-serif" }}>
                <strong>Source:</strong> NAPLESMLS#{property.MLSNumber || "N/A"}
              </Text>
              <Text style={{ fontSize: "11px", color: "#666", margin: "0 0 4px", fontFamily: "'Poppins', Arial, sans-serif" }}>
                <strong>Listing Office:</strong> {property.ListOfficeName || "N/A"}
              </Text>
              <Text style={{ fontSize: "11px", color: "#666", margin: 0, fontFamily: "'Poppins', Arial, sans-serif" }}>
                <strong>Showing Office:</strong> GULFSHORE GROUP
              </Text>
            </Column>
          </Row>
          <Row>
            <Column align="center">
                <Button
                  href={
                    leadId 
                      ? `${getPropertiesApiBaseUrl()}/api/v2/magic-login?leadId=${encodeURIComponent(leadId)}&redirect_url=${encodeURIComponent(`${getPropertiesApiBaseUrl()}${UrlMaker(property.City,property.Community ||"",property.FullAddress,property.MLSNumber ||"")}?utm_source=email_alert&n=${encodeURIComponent(recipientName || "")}`)}`
                      : `${getPropertiesApiBaseUrl()}${UrlMaker(property.City,property.Community ||"",property.FullAddress,property.MLSNumber ||"")}?utm_source=email_alert&n=${encodeURIComponent(recipientName || "")}`
                  }
                  style={{
                    backgroundColor: MID,
                    color: "#FFFFFF",
                    padding: "14px 40px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                    display: "inline-block",
                    textAlign: "center",
                    fontFamily: "'Poppins', Arial, sans-serif",
                  }}
                >
                  VIEW DETAILS
                </Button>
            </Column>
          </Row>
        </Section>
      </Section>
    );
  }
  
  // ─── Email Template ───────────────────────────────────────────────────────────
  
  interface PropertyAlertEmailProps {
    recipientName?: string;
    alertTitle?: string;
    alertSubtitle?: string;
    properties: Property[] | Property | null;
    unsubscribeUrl?: string;
    leadId?: string;
  }
  
  export function PropertyAlertEmail({
    recipientName = "Dimitri Schwarz",
    alertTitle = "Latest Property Matches",
    alertSubtitle = "Latest listings selected for your lifestyle",
    properties,
    unsubscribeUrl = "#",
    leadId,
  }: PropertyAlertEmailProps) {
    const previewText =
      "New property listing curated for you";
  
    return (
      <Html lang="en">
    
  <Head>
    <Font
      fontFamily="Poppins"
      fallbackFontFamily="Arial"
      webFont={{
        url: "https://fonts.gstatic.com/s/poppins/v23/pxiEyp8kv8JHgFVrJJfecg.woff2",
        format: "woff2",
      }}
      fontWeight={400}
      fontStyle="normal"
    />
  </Head>
  
        <Preview>{previewText}</Preview>
  
        <Tailwind>
        <Body
          style={{
            backgroundColor: "#F4F4F5",
            margin: 0,
            padding: "40px 0",
            fontFamily: "'Poppins', Arial, sans-serif",
          }}
        >
          <Container
            style={{
              maxWidth: "640px",
              margin: "0 auto",
              padding: "0",
              backgroundColor: "#FFFFFF",
              borderRadius: "4px",
              overflow: "hidden",
              boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
            }}
          >
              {/* ── Premium Header ── */}
              <Section
                style={{
                  background: "#FFFFFF",
                  padding: "40px 40px",
                }}
              >
                <table align="center" border={0} cellPadding="0" cellSpacing="0" role="presentation">
                  <tbody>
                    <tr>
                      <td style={{ paddingRight: "16px", verticalAlign: "middle" }}>
                        <Img
                          src={`${getPropertiesApiBaseUrl()}/logored.svg`}
                          width="56"
                          height="56"
                          alt="Gulfshore Group Logo"
                          style={{ display: "block" }}
                        />
                      </td>
                      <td style={{ verticalAlign: "middle", textAlign: "left" }}>
                        <Text
                          style={{
                            fontSize: "26px",
                            fontWeight: "700",
                            color: "#D90429",
                            margin: "0 0 4px 0",
                            fontFamily: "'Poppins', Arial, sans-serif",
                            letterSpacing: "0.02em",
                            lineHeight: "1",
                          }}
                        >
                          GULFSHORE GROUP
                        </Text>
                        <Text
                          style={{
                            fontSize: "18px",
                            color: "#4B5563",
                            margin: "0",
                            fontFamily: "'Poppins', Arial, sans-serif",
                            fontWeight: "500",
                            lineHeight: "1",
                          }}
                        >
                          London Forster Realty
                        </Text>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Section>
  
              {/* ── Title Area ── */}
              <Section
                style={{
                  backgroundColor: "#FFFFFF",
                  padding: "48px 40px 0",
                  textAlign: "center" as const,
                }}
              >
                <Heading
                  as="h1"
                  style={{
                    fontSize: "22px",
                    fontWeight: "400",
                    color: DARK,
                    margin: "0 0 12px",     
                    fontFamily: "'Poppins', Arial, sans-serif",
                    lineHeight: "1.4",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {alertTitle}
                </Heading>
  
                <Text
                  style={{
                    fontSize: "14px",
                    color: "#666666",
                    margin: "0 0 24px",
                    fontFamily: "'Poppins', Arial, sans-serif",
                  }}
                >
                  {alertSubtitle}
                </Text>
  
                {/* Gold rule */}
                <Section style={{ margin: "0 auto", maxWidth: "60px" }}>
                  <Hr
                    style={{
                      borderColor: GOLD,
                      borderWidth: "1px",
                      margin: "0",
                    }}
                  />
                </Section>
              </Section>
  
              {/* ── Greeting banner ── */}
              <Section
                style={{
                  backgroundColor: "#FFF",
                  padding: "32px 40px 16px",
                }}
              >
                <Text
                  style={{
                    fontSize: "16px",
                    color: DARK,
                    margin: 0,
                    fontFamily: "'Poppins', Arial, sans-serif",
                  }}
                >
                  Dear <strong>{recipientName}</strong>,
                </Text>
                <Text
                  style={{
                    fontSize: "14px",
                    color: "#444444",
                    margin: "12px 0 0",
                    lineHeight: "1.6",
                    fontFamily: "'Poppins', Arial, sans-serif",
                  }}
                >
                  We've curated{" "}
                  <strong style={{ color: PRIMARY }}>
                  {Array.isArray(properties) ? `${properties.length} exceptional properties` : `1 exceptional property`}
                  </strong>{" "}
                  that align with your refined preferences. Each listing has been
                  personally reviewed for quality and value.
                </Text>
              </Section>
  
              {/* ── Property Cards ── */}
              <Section style={{ padding: "28px 24px" }}>
                {!properties || (Array.isArray(properties) && properties.length === 0) ? (
                  <Section
                    style={{
                      backgroundColor: "#FFF",
                      borderRadius: "12px",
                      padding: "48px 32px",
                      textAlign: "center" as const,
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "16px",
                        color: DARK,
                        margin: "0 0 8px",
                        fontFamily: "'Poppins', Arial, sans-serif",
                      }}
                    >
                      No new listings at the moment
                    </Text>
                    <Text
                      style={{
                        fontSize: "13px",
                        color: MID,
                        margin: 0,
                        fontFamily: "'Poppins', Arial, sans-serif",
                      }}
                    >
                      We'll notify you the moment something exceptional hits the market.
                    </Text>
                  </Section>
                ) : (
                  Array.isArray(properties) ? (
                    properties.map((prop) => (
                      <PropertyCard
                        key={prop.id || prop.MLSNumber || prop.FullAddress}
                        property={prop}
                        leadId={leadId}
                        recipientName={recipientName}
                      />
                    ))
                  ) : (
                    <PropertyCard
                      key={properties.id || properties.MLSNumber || properties.FullAddress}
                      property={properties}
                      leadId={leadId}
                      recipientName={recipientName}
                    />
                  )
                )}
              </Section>
  
              {/* ── CTA Section ── */}
              <Section
                style={{
                  backgroundColor: "#FFF",
                  padding: "32px 40px",
                  textAlign: "center" as const,
                  borderTop: `3px solid ${PRIMARY}`,
                }}
              >
                <Text
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: DARK,
                    margin: "0 0 8px",
                    fontFamily: "'Poppins', Arial, sans-serif",
                  }}
                >
                  Ready to schedule a private showing?
                </Text>
                <Text
                  style={{
                    fontSize: "13px",
                    color: "#000000",
                    margin: "0 0 24px",
                    fontFamily: "'Poppins', Arial, sans-serif",
                  }}
                >
                  Our concierge team is available 7 days a week for exclusive tours.
                </Text>
                <Button
                  href={`${getPropertiesApiBaseUrl()}/contact`}
                  style={{
                    backgroundColor: MID,
                    color: "#FFFFFF",
                    padding: "14px 36px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "700",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                    display: "inline-block",
                    fontFamily: "'Poppins', Arial, sans-serif",
                  }}
                >
                  Contact Our Team
                </Button>
  
                <Text
                  style={{
                    fontSize: "12px",
                    color: GOLD,
                    margin: "20px 0 0",
                    letterSpacing: "0.06em",
                    fontFamily: "'Poppins', Arial, sans-serif",
                  }}
                >
                  Your trusted real estate advisors
                </Text>
              </Section>
  
              {/* ── Footer ── */}
              <Section
                style={{
                  backgroundColor: DARK,
                  padding: "28px 40px",
                  textAlign: "center" as const,
                }}
              >
                <Text
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.4)",
                    margin: "0 0 12px",
                    lineHeight: "1.6",
                    fontFamily: "'Poppins', Arial, sans-serif",
                  }}
                >
                  You're receiving this alert because you subscribed to property notifications.
                  <br />
                  All listings courtesy of respective brokerages. Equal Housing Opportunity.
                </Text>
  
                <Row style={{ textAlign: "center" as const }}>
                  <Column>
                    <Link
                      href={unsubscribeUrl}
                      style={{
                        color: GOLD,
                        fontSize: "11px",
                        textDecoration: "underline",
                        fontFamily: "'Poppins', Arial, sans-serif",
                      }}
                    >
                      Manage Preferences
                    </Link>
                    <Text
                      style={{
                        display: "inline",
                        color: "rgba(255,255,255,0.2)",
                        margin: "0 8px",
                      }}
                    >
                      |
                    </Text>
                    <Link
                      href={unsubscribeUrl}
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: "11px",
                        textDecoration: "underline",
                        fontFamily: "'Poppins', Arial, sans-serif",
                      }}
                    >
                      Unsubscribe
                    </Link>
                  </Column>
                </Row>
  
                <Hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: "20px 0 16px" }} />
  
                <Text
                  style={{
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.25)",
                    margin: 0,
                    letterSpacing: "0.05em",
                    fontFamily: "'Poppins', Arial, sans-serif",
                  }}
                >
                  © {new Date().getFullYear()} {getPropertiesApiBaseUrl().replace('https://', '')} · ALL RIGHTS RESERVED
                </Text>
              </Section>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  }
  
  // ─── Send Function ────────────────────────────────────────────────────────────
  
  interface SendPropertyAlertOptions {
    /** Resend API key — defaults to RESEND_API_KEY env var */
    resendApiKey?: string;
    /** Recipient email address */
    to: string | string[];
    /** Recipient display name */
    recipientName?: string;
    /** From address (must be verified in Resend) */
    from?: string;
    /** Optional reply-to */
    replyTo?: string;
    /** Email subject */
    subject?: string;
    /** Alert headline shown in the email */
    alertTitle?: string;
    /** Alert subtitle */
    alertSubtitle?: string;
    /** Pass properties directly — otherwise fetched from /api/v2/properties */
    properties?: Property[] | Property | null;
    /** Unsubscribe / preferences URL */
    unsubscribeUrl?: string;
  }
  
  export async function sendPropertyAlert(
    options: SendPropertyAlertOptions
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const apiKey = options.resendApiKey ?? process.env.RESEND_API_KEY;
    if (!apiKey) return { success: false, error: "No Resend API key provided" };
  
    // Resolve properties
    let properties: Property[] | Property | null = options.properties ?? null;
    if (!properties || (Array.isArray(properties) && properties.length === 0)) {
      console.log("Fetching properties from API…");
      properties = await fetchProperties();
      console.log(`Fetched ${properties ? "1" : "0"} properties`);
    }
  
    const html = await render(
      <PropertyAlertEmail
        recipientName={options.recipientName}
        alertTitle={options.alertTitle}
        alertSubtitle={options.alertSubtitle}
        properties={properties}
        unsubscribeUrl={options.unsubscribeUrl}
      />
    );
  
    const resend = new Resend(apiKey);
  
    const subject = options.subject ?? `1 New Property Matches Your Search`;
    const { data, error } = await resend.emails.send({
      from: options.from ?? process.env.RESEND_FROM_EMAIL!,
      to: Array.isArray(options.to) ? options.to : [options.to],
      replyTo: options.replyTo,
      subject: subject,
      html,
    });
  
    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }
  
    console.log(`Email sent. ID: ${data?.id}`);
    
    if (data?.id) {
      const emailTo = Array.isArray(options.to) ? options.to.join(", ") : options.to;
      try {
        await prisma.communicationLog.create({
          data: {
            type: "Email",
            to: emailTo,
            subject: subject,
            status: "sent",
            providerId: data.id,
          },
        });
      } catch (logErr) {
        console.error("Failed to log property alert email:", logErr);
      }
    }
    
    return { success: true, id: data?.id };
  }
  
  // ─── CLI entrypoint ───────────────────────────────────────────────────────────
  // Run: npx tsx propertyAlertEmail.tsx
  
  // In Next.js (ESM), `require` may not exist; guard for CLI-only usage.
  if (typeof require !== "undefined" && require.main === module) {
    (async () => {
      const result = await sendPropertyAlert({
        to: "dhruvlalwani004@gmail.com",
        recipientName: "Dimitri Schwarz",
        alertTitle: "Your Curated Property Matches",
        alertSubtitle: "Latest listings selected for your lifestyle",
      });
  
      if (!result.success) {
        console.error("Failed to send:", result.error);
        process.exit(1);
      }
    })();
  }