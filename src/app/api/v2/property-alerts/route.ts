import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendPropertyAlert } from "@/lib/leads/services/property-alerts";
import { sendSMS } from "@/lib/twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const secret = process.env.PROPERTY_ALERTS_API_SECRET;
  if (!secret) return true;

  const headerSecret = req.headers.get("x-property-alerts-secret");
  if (headerSecret === secret) return true;

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ") && auth.slice("Bearer ".length) === secret) {
    return true;
  }

  return false;
}

function defaultRecipients(): string[] {
  const raw =
    process.env.PROPERTY_ALERT_TO ||
    process.env.TEST_EMAIL ||
    process.env.ADMIN_ALERT_EMAIL;
  if (!raw) return [];
  return raw.split(",").map((e) => e.trim()).filter(Boolean);
}

const AlertOverridesSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email()).min(1)]).optional(),
  recipientName: z.string().min(1).optional(),
  from: z.string().min(1).optional(),
  replyTo: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  alertSubtitle: z.string().min(1).optional(),
  unsubscribeUrl: z.string().url().optional(),
  leadId: z.string().optional(),
});

type AlertOverrides = z.infer<typeof AlertOverridesSchema>;

function overridesFromSearchParams(searchParams: URLSearchParams): AlertOverrides {
  const to = searchParams.get("to");
  return {
    to: to ? to.split(",").map((e) => e.trim()).filter(Boolean) : undefined,
    recipientName: searchParams.get("recipientName") || undefined,
    alertTitle: searchParams.get("alertTitle") || undefined,
    alertSubtitle: searchParams.get("alertSubtitle") || undefined,
    leadId: searchParams.get("leadId") || undefined,
  };
}

async function runPropertyAlertSend(overrides: AlertOverrides = {}) {
  const to = overrides.to ?? defaultRecipients();
  if (!to || (Array.isArray(to) && to.length === 0)) {
    return {
      ok: false as const,
      status: 500,
      body: {
        ok: false,
        error:
          "No recipient configured. Set PROPERTY_ALERT_TO (or pass ?to= / body.to).",
      },
    };
  }

  const result = await sendPropertyAlert({
    to,
    recipientName:
      overrides.recipientName ??
      process.env.PROPERTY_ALERT_RECIPIENT_NAME ??
      "Valued Client",
    from:
      overrides.from ??
      process.env.PROPERTY_ALERT_FROM ??
      process.env.RESEND_FROM_EMAIL,
    replyTo: overrides.replyTo ?? process.env.PROPERTY_ALERT_REPLY_TO,
    subject: overrides.subject,
    alertTitle:
      overrides.alertTitle ??
      process.env.PROPERTY_ALERT_TITLE ??
      "Your Curated Property Matches",
    alertSubtitle:
      overrides.alertSubtitle ??
      process.env.PROPERTY_ALERT_SUBTITLE ??
      "Exclusive listings selected for your lifestyle",
    unsubscribeUrl: overrides.unsubscribeUrl,
    leadId: overrides.leadId,
  });

  if (!result.success) {
    return {
      ok: false as const,
      status: 500,
      body: { ok: false, error: result.error },
    };
  }

  // Optionally send SMS notification if phone number is configured
  const alertPhone = process.env.PROPERTY_ALERT_PHONE;
  if (alertPhone) {
    try {
      const searchTitle = overrides.alertTitle || overrides.subject || "Property Matches";
      await sendSMS(
        alertPhone,
        `${searchTitle} - New Listing on GulfShoreGroup.com - Dimitri Schwarz, Your SW Florida Realtor 239.992.9119`
      );
    } catch (err) {
      console.error("Failed to send property alert SMS:", err);
    }
  }

  return {
    ok: true as const,
    status: 200,
    body: { ok: true, id: result.id, sentTo: to, smsSent: Boolean(alertPhone) },
  };
}

async function handleRequest(req: NextRequest, overrides: AlertOverrides = {}) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await runPropertyAlertSend(overrides);
  return NextResponse.json(result.body, { status: result.status });
}

/** Hit this endpoint to fetch latest properties and send the alert email. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  return handleRequest(req, overridesFromSearchParams(searchParams));
}

/** Optional JSON body overrides env defaults; empty body is fine. */
export async function POST(req: NextRequest) {
  let overrides: AlertOverrides = {};

  try {
    const text = await req.text();
    if (text.trim()) {
      const json = JSON.parse(text);
      const parsed = AlertOverridesSchema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, error: "Invalid request body", issues: parsed.error.issues },
          { status: 400 }
        );
      }
      overrides = parsed.data;
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  return handleRequest(req, { ...overridesFromSearchParams(searchParams), ...overrides });
}
