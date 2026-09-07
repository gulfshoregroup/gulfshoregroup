import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const campaigns = await prisma.dripCampaign.findMany();
    let updatedCount = 0;

    for (const campaign of campaigns) {
      let newName = campaign.name;
      let newMessageTemplate = campaign.messageTemplate;

      // Regular expression to match "Day X: " or "Day X - " or "Day X – " at the beginning of a string or line
      const dayRegex = /^Day \d+[:\-\u2013\u2014]\s*/gm;

      if (dayRegex.test(newName) || dayRegex.test(newMessageTemplate)) {
        newName = newName.replace(dayRegex, "").trim();
        newMessageTemplate = newMessageTemplate.replace(dayRegex, "").trim();

        await prisma.dripCampaign.update({
          where: { id: campaign.id },
          data: {
            name: newName,
            messageTemplate: newMessageTemplate
          }
        });
        updatedCount++;
      }
    }

    // Ensure the welcome email is still set to Day 0
    const welcomeCampaign = await prisma.dripCampaign.findFirst({
      where: { daysAfterSignup: 1 }
    });
    
    if (welcomeCampaign) {
      await prisma.dripCampaign.update({
        where: { id: welcomeCampaign.id },
        data: { daysAfterSignup: 0 }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully removed 'Day X' prefix from ${updatedCount} drip campaigns! The welcome email is also set to trigger immediately (Day 0).`
    });
  } catch (error: any) {
    console.error("Error updating drip campaigns:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
