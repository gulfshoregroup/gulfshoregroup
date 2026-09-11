import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PDFDocument } from "pdf-lib";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { signatureData, name, email, phone, formType, propertyId } = body;

    if (!signatureData || !name || !email || !formType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Load the blank PDF
    const pdfFileName = formType === "Property-Specific" ? "bb-spec.pdf" : "bb-ex.pdf";
    const pdfPath = path.join(process.cwd(), "public", "forms", pdfFileName);
    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // 2. Embed the signature image
    const signatureBytes = Buffer.from(signatureData.split(",")[1], "base64");
    const signatureImage = await pdfDoc.embedPng(signatureBytes);
    const signatureDims = signatureImage.scale(0.25);

    // 3. Draw required fields on Page 1 and Page 3
    const pages = pdfDoc.getPages();
    const page1 = pages[0]; // Page 1
    const page3 = pages[2] || pages[pages.length - 1]; // Page 3

    const todayDate = new Date();
    const todayStr = todayDate.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
    
    // Calculate 6 months termination date
    const sixMonthsDate = new Date(todayDate);
    sixMonthsDate.setMonth(sixMonthsDate.getMonth() + 6);
    const sixMonthsStr = sixMonthsDate.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });

    // --- PAGE 1 STAMPING ---
    // Buyer Name
    page1.drawText(name, { x: 140, y: 675, size: 10 });
    // Broker Name
    page1.drawText("GulfShore Group with London Foster Realty", { x: 140, y: 655, size: 10 });
    // Transaction Broker Checkbox [X]
    page1.drawText("X", { x: 140, y: 470, size: 11 });
    // Commencement Date
    page1.drawText(todayStr, { x: 150, y: 372, size: 10 });
    // Termination Date (6 months later)
    page1.drawText(sixMonthsStr, { x: 420, y: 372, size: 10 });
    // Broker Compensation Checkbox [X] and 3%
    page1.drawText("X", { x: 140, y: 180, size: 11 });
    page1.drawText("3", { x: 165, y: 180, size: 10 });

    // --- PAGE 3 STAMPING ---
    // Buyer Signature Image
    const sigX = 90;
    const sigY = 395;
    page3.drawImage(signatureImage, {
      x: sigX,
      y: sigY,
      width: Math.min(signatureDims.width, 160),
      height: Math.min(signatureDims.height, 45),
    });
    
    // Buyer Signature Date
    page3.drawText(todayStr, { x: 410, y: 395, size: 10 });
    // Buyer Printed Name
    page3.drawText(name, { x: 220, y: 370, size: 10 });
    // Buyer Address
    page3.drawText("Provided on Tour Request", { x: 220, y: 350, size: 10 });
    // Buyer Telephone
    page3.drawText(phone || "N/A", { x: 240, y: 330, size: 10 });
    // Buyer Email Address
    page3.drawText(email, { x: 220, y: 295, size: 10 });

    // Broker Authorized Signature & Licensee Info
    const brokerSigPath = path.join(process.cwd(), "public", "imgs", "broker-signature.png");
    if (fs.existsSync(brokerSigPath)) {
        const brokerSigBytes = fs.readFileSync(brokerSigPath);
        const brokerSigImage = await pdfDoc.embedPng(brokerSigBytes);
        const brokerSigDims = brokerSigImage.scale(0.25);
        page3.drawImage(brokerSigImage, {
            x: 90,
            y: 230,
            width: Math.min(brokerSigDims.width, 160),
            height: Math.min(brokerSigDims.height, 45),
        });
    } else {
        page3.drawText("Dimitri Schwarz", { x: 90, y: 230, size: 12 });
    }
    page3.drawText(todayStr, { x: 420, y: 230, size: 10 });
    page3.drawText("DIMITRI SCHWARZ", { x: 460, y: 230, size: 10 });
    page3.drawText("London Foster Realty", { x: 230, y: 190, size: 10 });
    page3.drawText("2367 Vanderbilt Beach Rd Suite 812, Naples, FL 34109", { x: 230, y: 170, size: 9 });

    const pdfBytes = await pdfDoc.save();

    // 4. Upload to Cloudinary
    const base64Pdf = Buffer.from(pdfBytes).toString('base64');
    let signedPdfUrl = null;
    try {
        const cloudinaryResponse = await cloudinary.uploader.upload(`data:application/pdf;base64,${base64Pdf}`, {
            resource_type: "raw",
            folder: "signed-agreements"
        });
        signedPdfUrl = cloudinaryResponse.secure_url;
    } catch (uploadErr) {
        console.warn("Cloudinary upload failed, skipping URL generation.");
    }

    // 5. Create or find Lead, then SignedAgreement
    let lead = await prisma.lead.findUnique({ where: { email } });
    if (!lead) {
      lead = await prisma.lead.create({
        data: { email, firstName: name.split(" ")[0], lastName: name.split(" ").slice(1).join(" "), phone, source: "Tour_Request" }
      });
    }

    const signedAgreement = await prisma.signedAgreement.create({
      data: {
        leadId: lead.id,
        formType,
        propertyId,
        signedPdfUrl,
        status: "Completed",
      }
    });

    // 6. Send Email Notifications with PDF Attachment via Resend & Nodemailer
    const pdfFilename = `Signed_Buyer_Broker_Agreement_${name.replace(/\s+/g, '_')}.pdf`;
    
    // 6a. Try Resend if configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resendClient = new Resend(process.env.RESEND_API_KEY);
        const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL || "mailbox@gulfshoregroup.com";
        const fromEmail = process.env.RESEND_FROM_EMAIL || "Gulfshore Group <noreply@updates.gulfshoregroup.com>";

        await resendClient.emails.send({
          from: fromEmail,
          to: [email, adminEmail],
          subject: `Executed Buyer Broker Agreement - ${name}`,
          html: `<p>Hello ${name},</p><p>Thank you for scheduling your property tour with Gulfshore Group. Attached is your executed Buyer Broker Agreement for your records.</p><p>Best regards,<br/>Gulfshore Group Team</p>`,
          attachments: [
            {
              filename: pdfFilename,
              content: Buffer.from(pdfBytes),
            }
          ]
        });
      } catch (resendErr) {
        console.error("Resend attachment email error:", resendErr);
      }
    }

    // 6b. Try Nodemailer fallback if configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
          port: parseInt(process.env.EMAIL_SERVER_PORT || "465"),
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        const mailOptions = {
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: [email, process.env.ADMIN_EMAIL || process.env.EMAIL_USER].filter(Boolean) as string[],
          subject: `Signed Buyer Broker Agreement - ${name}`,
          text: `Hello,\n\nPlease find the attached signed Buyer Broker Agreement for ${name}.\n\nThank you.`,
          attachments: [
            {
              filename: pdfFilename,
              content: Buffer.from(pdfBytes),
            }
          ]
        };

        try {
          await transporter.sendMail(mailOptions);
        } catch (emailErr) {
          console.warn("Nodemailer email error:", emailErr);
        }
    }

    return NextResponse.json({ success: true, signedAgreement });
  } catch (error: any) {
    console.error("Signature Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
