import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const name = searchParams.get('name') || '';
    const email = searchParams.get('email') || '';
    const phone = searchParams.get('phone') || '';
    const formType = searchParams.get('formType') || 'General';

    // Load the blank PDF
    const pdfFileName = formType === "Property-Specific" ? "bb-spec.pdf" : "bb-ex.pdf";
    const pdfPath = path.join(process.cwd(), "public", "forms", pdfFileName);
    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Draw required fields on Page 1 and Page 3 (excluding the signatures)
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
    if (name) page1.drawText(name, { x: 140, y: 665, size: 10 });
    page1.drawText("GulfShore Group with London Foster Realty", { x: 140, y: 645, size: 10 });
    page1.drawText("X", { x: 140, y: 470, size: 11 }); // Transaction Broker
    page1.drawText(todayStr, { x: 150, y: 372, size: 10 }); // Commencement
    page1.drawText(sixMonthsStr, { x: 420, y: 372, size: 10 }); // Termination
    page1.drawText("X", { x: 140, y: 180, size: 11 }); // 3% Checkbox
    page1.drawText("3", { x: 165, y: 180, size: 10 }); // 3% Text

    // --- PAGE 3 STAMPING ---
    page3.drawText(todayStr, { x: 410, y: 395, size: 10 }); // Buyer Date
    if (name) page3.drawText(name, { x: 220, y: 370, size: 10 });
    page3.drawText("Provided on Tour Request", { x: 220, y: 350, size: 10 });
    page3.drawText(phone || "N/A", { x: 240, y: 330, size: 10 });
    if (email) page3.drawText(email, { x: 220, y: 295, size: 10 });

    // Broker Authorized Signature & Licensee Info (we can pre-stamp the broker signature)
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

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="preview.pdf"',
      },
    });
  } catch (error) {
    console.error("PDF Preview generation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
