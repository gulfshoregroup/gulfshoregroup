"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MapPin, Waves, ShieldAlert, ShieldCheck, Shield } from "lucide-react";

interface FloodZoneResult {
  address: {
    input: string;
    matched: string;
    lat: number;
    lng: number;
  };
  zone: string;
  zoneLabel: string;
  riskLevel: string;
  description: string;
  panelNumber: string | null;
  panelDate: string | null;
  disclaimer: string;
}

interface FloodZoneLookupProps {
  defaultAddress?: string;
  defaultCity?: string;
  defaultZip?: string;
}

export default function FloodZoneLookup({
  defaultAddress = "",
  defaultCity = "",
  defaultZip = "",
}: FloodZoneLookupProps) {
  const [address, setAddress] = useState(defaultAddress);
  const [city, setCity] = useState(defaultCity);
  const [zip, setZip] = useState(defaultZip);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FloodZoneResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !city || !zip) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams({ address, city, zip });
      const res = await fetch(`/api/fema/lookup?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to lookup flood zone");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "high risk":
        return "text-red-600 bg-red-50 border-red-200";
      case "moderate risk":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "low risk":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "high risk":
        return <ShieldAlert className="w-5 h-5" />;
      case "moderate risk":
        return <Shield className="w-5 h-5" />;
      case "low risk":
        return <ShieldCheck className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <Card className="w-full shadow-none border border-gray-200 rounded-xl bg-white overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg lg:text-xl font-medium text-gray-900 flex items-center gap-2">
          <Waves className="w-5 h-5 text-[#B89A6A]" />
          FEMA Flood Zone Lookup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="flood-address" className="text-sm font-medium text-gray-700">
              Street address
            </Label>
            <Input
              id="flood-address"
              placeholder="e.g. 212 s 1st st"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-11"
            />
            <p className="text-xs text-gray-500">
              Use the building&apos;s street address. Skip apartment or unit numbers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flood-city" className="text-sm font-medium text-gray-700">
                City
              </Label>
              <Input
                id="flood-city"
                placeholder="e.g. Immokalee"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flood-zip" className="text-sm font-medium text-gray-700">
                ZIP code
              </Label>
              <Input
                id="flood-zip"
                placeholder="e.g. 34142"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !address || !city || !zip}
            className="w-full h-11 bg-[#1e3a5f] hover:bg-[#152a45] text-white font-medium">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking flood zone...
              </>
            ) : (
              "Check flood zone"
            )}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Address matched */}
            <div className="pb-4 border-b border-gray-100">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#B89A6A] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Address Matched
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {result.address.matched}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {result.address.lat.toFixed(5)}, {result.address.lng.toFixed(5)} (approximate)
                  </p>
                </div>
              </div>
            </div>

            {/* Zone result */}
            <div className="pb-4 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                FEMA Flood Result
              </p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-[#1e3a5f]">{result.zoneLabel}</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getRiskColor(
                    result.riskLevel
                  )}`}>
                  {getRiskIcon(result.riskLevel)}
                  {result.riskLevel}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                {result.description}
              </p>
            </div>

            {/* Panel info */}
            {result.panelNumber && (
              <div className="pb-4 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  FEMA Flood Map Panel
                </p>
                <p className="text-base font-semibold text-gray-900">
                  {result.panelNumber}
                </p>
                {result.panelDate && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    In effect since {result.panelDate}
                  </p>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-[11px] text-gray-500 leading-relaxed">
              {result.disclaimer}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
