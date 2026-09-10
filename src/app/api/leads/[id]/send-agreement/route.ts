import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch lead phone from DB
    const { default: prisma } = await import("@/lib/prisma");
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { phone: true, firstName: true, fullName: true },
    });

    if (!lead || !lead.phone) {
      return NextResponse.json(
        { error: "Lead not found or phone number missing" },
        { status: 400 }
      );
    }

    const name = lead.fullName || lead.firstName || "there";
    const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") || "https://gulfshoregroup.com";
    const signingLink = `${siteUrl}/sign-agreement/${id}`;

    const message = `Hi ${name}! GulfShore Group is requesting you to sign your Buyer Broker Agreement. Please click the link below to review and sign:\n\n${signingLink}\n\n- GulfShore Group Team`;

    // Send via Twilio
    const accountSid = process.env.TWILIO_SID;
    const authToken = process.env.TWILIO_TOKEN;
    const fromNumber = process.env.TWILIO_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json({ error: "Twilio not configured" }, { status: 500 });
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const formBody = new URLSearchParams({
      To: lead.phone,
      From: fromNumber,
      Body: message,
    });

    const twilioRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody.toString(),
    });

    if (!twilioRes.ok) {
      const errData = await twilioRes.json();
      throw new Error(errData.message || "Twilio SMS failed");
    }

    return NextResponse.json({ success: true, sentTo: lead.phone, link: signingLink });
  } catch (error: any) {
    console.error("Send Agreement SMS error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
