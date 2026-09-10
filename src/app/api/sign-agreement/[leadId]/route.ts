import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFDocument } = require("pdf-lib");
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = "force-dynamic";

// ─── GET: Return lead info for auto-fill ───────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        phone: true,
        signedAgreements: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            formType: true,
            status: true,
            signedPdfUrl: true,
            createdAt: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: lead.id,
      name: lead.fullName || `${lead.firstName || ""} ${lead.lastName || ""}`.trim(),
      firstName: lead.firstName || "",
      lastName: lead.lastName || "",
      email: lead.email,
      phone: lead.phone || "",
      signedAgreements: lead.signedAgreements,
    });
  } catch (error: any) {
    console.error("Error fetching lead for agreement:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST: Sign agreement, generate PDF, email both user + admin ───────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    const body = await req.json();
    const { signatureData, uploadedFileUrl } = body;

    if (!signatureData) {
      return NextResponse.json({ error: "Signature is required" }, { status: 400 });
    }

    // Fetch lead from DB
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const name = lead.fullName || `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Unknown";
    const email = lead.email;
    const phone = lead.phone || "N/A";

    // 1. Load the blank PDF
    const pdfPath = path.join(process.cwd(), "public", "forms", "bb-ex.pdf");
    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // 2. Embed buyer signature
    const signatureBytes = Buffer.from(signatureData.split(",")[1], "base64");
    const signatureImage = await pdfDoc.embedPng(signatureBytes);
    const signatureDims = signatureImage.scale(0.25);

    // 3. Get pages
    const pages = pdfDoc.getPages();
    const page1 = pages[0];
    const page3 = pages[2] || pages[pages.length - 1];

    const todayDate = new Date();
    const todayStr = todayDate.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    const sixMonthsDate = new Date(todayDate);
    sixMonthsDate.setMonth(sixMonthsDate.getMonth() + 6);
    const sixMonthsStr = sixMonthsDate.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    // ─── PAGE 1 STAMPING ───
    page1.drawText(name, { x: 120, y: 712, size: 10 });
    page1.drawText("GulfShore Group with London Foster Realty", { x: 120, y: 694, size: 10 });
    page1.drawText("X", { x: 122, y: 628, size: 11 });
    page1.drawText(todayStr, { x: 160, y: 498, size: 10 });
    page1.drawText(sixMonthsStr, { x: 480, y: 498, size: 10 });
    page1.drawText("X", { x: 122, y: 398, size: 11 });
    page1.drawText("3", { x: 145, y: 398, size: 10 });

    // ─── PAGE 3 — BUYER SECTION ───
    page3.drawImage(signatureImage, {
      x: 90,
      y: 220,
      width: Math.min(signatureDims.width, 160),
      height: Math.min(signatureDims.height, 45),
    });
    page3.drawText(todayStr, { x: 410, y: 220, size: 10 });
    page3.drawText(name, { x: 90, y: 195, size: 10 });
    page3.drawText("On File", { x: 90, y: 175, size: 10 });
    page3.drawText(phone, { x: 180, y: 155, size: 10 });
    page3.drawText(email, { x: 130, y: 135, size: 10 });

    // ─── PAGE 3 — BROKER SECTION ───
    const brokerSigPath = path.join(process.cwd(), "public", "imgs", "broker-signature.png");
    if (fs.existsSync(brokerSigPath)) {
      const brokerSigBytes = fs.readFileSync(brokerSigPath);
      const brokerSigImage = await pdfDoc.embedPng(brokerSigBytes);
      const brokerSigDims = brokerSigImage.scale(0.25);
      page3.drawImage(brokerSigImage, {
        x: 90,
        y: 105,
        width: Math.min(brokerSigDims.width, 160),
        height: Math.min(brokerSigDims.height, 45),
      });
    } else {
      page3.drawText("Dimitri Schwarz", { x: 90, y: 105, size: 12 });
    }
    page3.drawText(todayStr, { x: 300, y: 105, size: 10 });
    page3.drawText("DIMITRI SCHWARZ", { x: 400, y: 105, size: 10 });
    page3.drawText("London Foster Realty", { x: 230, y: 85, size: 10 });
    page3.drawText("2367 Vanderbilt Beach Rd Suite 812, Naples, FL 34109", { x: 230, y: 65, size: 9 });

    const pdfBytes = await pdfDoc.save();

    // 4. Upload to Cloudinary
    const base64Pdf = Buffer.from(pdfBytes).toString("base64");
    let signedPdfUrl: string | null = uploadedFileUrl || null;
    try {
      const cloudRes = await cloudinary.uploader.upload(
        `data:application/pdf;base64,${base64Pdf}`,
        { resource_type: "raw", folder: "signed-agreements" }
      );
      signedPdfUrl = cloudRes.secure_url;
    } catch (err) {
      console.warn("Cloudinary upload failed:", err);
    }

    // 5. Save to DB
    const signedAgreement = await prisma.signedAgreement.create({
      data: {
        leadId: lead.id,
        formType: "General",
        signedPdfUrl,
        status: "Completed",
      },
    });

    // 6. Send emails via Resend (user + admin)
    const pdfFilename = `Signed_Buyer_Broker_Agreement_${name.replace(/\s+/g, "_")}.pdf`;
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL || "mailbox@gulfshoregroup.com";
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Gulfshore Group <noreply@updates.gulfshoregroup.com>";
    const viewUrl = signedPdfUrl ? `<p><a href="${signedPdfUrl}" target="_blank" style="color:#c0002a;">📄 View Signed Agreement Online</a></p>` : "";

    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Email to LEAD
        await resend.emails.send({
          from: fromEmail,
          to: [email],
          subject: `Your Signed Buyer Broker Agreement — GulfShore Group`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#c0002a;">Thank You for Signing, ${name}!</h2>
              <p>Your <strong>Buyer Broker Agreement</strong> with GulfShore Group has been successfully signed and recorded.</p>
              <p><strong>Broker:</strong> GulfShore Group with London Foster Realty — Transaction Broker</p>
              <p><strong>Date:</strong> ${todayStr}</p>
              <p><strong>Commission:</strong> 3%</p>
              ${viewUrl}
              <p>Your signed copy is also attached to this email as a PDF.</p>
              <hr/>
              <p style="color:#888;font-size:12px;">GulfShore Group | 2367 Vanderbilt Beach Rd Suite 812, Naples, FL 34109</p>
            </div>
          `,
          attachments: [{ filename: pdfFilename, content: Buffer.from(pdfBytes) }],
        });

        // Email to ADMIN
        await resend.emails.send({
          from: fromEmail,
          to: [adminEmail],
          subject: `✅ Agreement Signed — ${name} (${email})`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#c0002a;">New Agreement Signed!</h2>
              <p>A lead has signed their Buyer Broker Agreement.</p>
              <table style="border-collapse:collapse;width:100%">
                <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Name</td><td style="padding:8px;border:1px solid #eee">${name}</td></tr>
                <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #eee">${email}</td></tr>
                <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Phone</td><td style="padding:8px;border:1px solid #eee">${phone}</td></tr>
                <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Signed On</td><td style="padding:8px;border:1px solid #eee">${todayStr}</td></tr>
              </table>
              ${viewUrl}
              <p>The signed PDF is attached to this email.</p>
            </div>
          `,
          attachments: [{ filename: pdfFilename, content: Buffer.from(pdfBytes) }],
        });
      } catch (emailErr) {
        console.error("Resend email error:", emailErr);
      }
    }

    return NextResponse.json({ success: true, signedAgreement });
  } catch (error: any) {
    console.error("Sign Agreement Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
