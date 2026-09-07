import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Find the first email campaign (which is currently set to Day 1)
    const welcomeCampaign = await prisma.dripCampaign.findFirst({
      where: {
        OR: [
          { name: { contains: "Day 1" } },
          { daysAfterSignup: 1 }
        ]
      }
    });

    if (!welcomeCampaign) {
      return NextResponse.json({ success: false, message: "Welcome campaign not found." });
    }

    // 2. Update only its name and daysAfterSignup
    await prisma.dripCampaign.update({
      where: { id: welcomeCampaign.id },
      data: {
        name: "Welcome to GULFSHORE Group",
        daysAfterSignup: 0
      }
    });

    return NextResponse.json({
      success: true,
      message: "Welcome campaign successfully updated to Day 0 (Immediate) and title fixed. The rest are unchanged."
    });
  } catch (error: any) {
    console.error("Error updating welcome campaign:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
