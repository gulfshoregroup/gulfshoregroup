const fs = require('fs');
const PDFParser = require('pdf2json');
const path = require('path');

const pdfParser = new PDFParser();

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    const page1 = pdfData.Pages ? pdfData.Pages[0] : pdfData.formImage.Pages[0];
    const page3 = pdfData.Pages ? pdfData.Pages[2] : pdfData.formImage.Pages[2];

    console.log("=== PAGE 1 ===");
    page1.Texts.forEach(t => {
        const text = decodeURIComponent(t.R[0].T);
        if (text.includes("BUYER") || text.includes("BROKER") || text.includes("Date") || text.includes("RELATIONSHIP") || text.includes("ROLE") || text.includes("TERM") || text.includes("COMPENSATION") || text.includes("Transaction")) {
            console.log(`y: ${(t.y).toFixed(3)}, x: ${(t.x).toFixed(3)}, text: ${text}`);
        }
    });

    console.log("\n=== PAGE 3 ===");
    page3.Texts.forEach(t => {
        const text = decodeURIComponent(t.R[0].T);
        if (text.includes("Signature") || text.includes("Name") || text.includes("Address") || text.includes("Email") || text.includes("Date") || text.includes("Telephone") || text.includes("Firm")) {
            console.log(`y: ${(t.y).toFixed(3)}, x: ${(t.x).toFixed(3)}, text: ${text}`);
        }
    });
});

pdfParser.loadPDF(path.join(process.cwd(), "public", "forms", "bb-ex.pdf"));
