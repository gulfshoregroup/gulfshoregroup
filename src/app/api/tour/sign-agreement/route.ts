import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PDFDocument } from "pdf-lib";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

const prisma = new PrismaClient();

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    // 3. Draw signature and text on page 3
    const pages = pdfDoc.getPages();
    const page = pages[2]; // Page 3 (0-indexed)

    // Hardcoded positions based on standard forms (these may need fine-tuning)
    const sigX = 50;
    const sigY = 150;

    page.drawImage(signatureImage, {
      x: sigX,
      y: sigY,
      width: signatureDims.width,
      height: signatureDims.height,
    });
    
    // Draw Name and Date
    page.drawText(name, { x: 50, y: 130, size: 12 });
    page.drawText(new Date().toLocaleDateString(), { x: 250, y: 130, size: 12 });

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

    // 6. Send Email using Nodemailer
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
              filename: `Signed_Agreement_${name.replace(/\s+/g, '_')}.pdf`,
              content: Buffer.from(pdfBytes),
            }
          ]
        };

        try {
          await transporter.sendMail(mailOptions);
        } catch (emailErr) {
          console.warn("Failed to send email, continuing without it.", emailErr);
        }
    }

    return NextResponse.json({ success: true, signedAgreement });
  } catch (error: any) {
    console.error("Signature Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
