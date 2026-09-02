import { render } from "@react-email/render";
import { PropertyAlertEmail } from "@/lib/leads/services/property-alerts";
import { buildAdminLeadAlertHtml } from "@/lib/email/admin-lead-alert";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") || "property-alert";

  let html = "";

  if (type === "property-alert") {
    const dummyProperty = {
      id: "123",
      FullAddress: "8001 Via Monte Carlo Way 1105",
      City: "Estero",
      StateOrProvince: "FL",
      PostalCode: "33928",
      ListPrice: 399000,
      BedroomsTotal: 2,
      BathroomsFull: 2,
      LivingArea: 1480,
      GarageSpaces: 2,
      PropertySubType: "Low Rise (1-3)",
      Community: "Coconut Point",
      images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80"],
      ListOfficeName: "Coldwell Banker Realty",
      ListAgentFullName: "Holly Fagan",
    };

    html = await render(
      PropertyAlertEmail({
        recipientName: "anmol22222",
        alertTitle: "New Homes Matching Your Search",
        alertSubtitle: "We found 1 new property that match your saved preferences.",
        properties: [dummyProperty as any]
      })
    );
  } else if (type === "admin-alert") {
    html = buildAdminLeadAlertHtml({
      action: "inquiry",
      timestamp: new Date(),
      leadId: "lead_123",
      leadName: "John Doe",
      leadEmail: "johndoe@example.com",
      message: "I am interested in seeing some properties this weekend.",
      property: {
        FullAddress: "8001 Via Monte Carlo Way 1105",
        MLSNumber: "226027366",
        ListPrice: 399000
      } as any,
      data: { source: "Property Page", device: "Desktop" }
    });
  } else if (type === "otp") {
    const otp = "847291";
    html = `<div style="background-color: #F4F4F5; margin: 0; padding: 40px 0; font-family: 'Poppins', Arial, sans-serif;">
	<div style="max-width: 640px; margin: 0 auto; background-color: #FFFFFF; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08);">
		<div style="background: #1A0A0A; padding: 40px 40px; text-align: center; border-bottom: 3px solid #C9A96E;">
			<p style="font-size: 24px; letter-spacing: 0.2em; text-transform: uppercase; color: #FFFFFF; margin: 0 0 4px; font-weight: 400; margin-top:0;">GULFSHORE</p>
			<p style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #C9A96E; margin: 0; font-weight: 600;">Real Estate Group</p>
		</div>
		<div style="padding: 48px 40px; text-align: center;">
			<h1 style="font-size: 22px; font-weight: 400; color: #1A0A0A; margin: 0 0 12px; line-height: 1.4; text-transform: uppercase; letter-spacing: 0.05em;">Password Reset</h1>
			<p style="font-size: 14px; color: #666666; margin: 0 0 24px;">Verify your identity to reset your password.</p>
			<div style="margin: 0 auto 24px; max-width: 60px; border-top: 1px solid #C9A96E;"></div>
			
			<div style="text-align: center;">
				<p style="font-size: 14px; color: #666666; margin-bottom: 24px;">Your verification code is:</p>
				<div style="background-color: #FAF7F2; padding: 24px; border: 1px solid #E8DDD8; border-radius: 4px; margin: 0 auto 24px; max-width: 300px;">
					<span style="font-size: 32px; font-weight: bold; letter-spacing: 12px; color: #d90429; margin-left: 12px;">\${otp}</span>
				</div>
				<p style="font-size: 12px; color: #999999;">This code expires in 15 minutes. If you did not request this, please ignore this email.</p>
			</div>
		</div>
	</div>
</div>`;
  } else if (type === "contact") {
    const { InquiryEmail } = await import("@/lib/email/inquiry-email");
    html = await render(
      InquiryEmail({
        recipientName: "Jane",
        message: "I want to know more about the property."
      })
    );
  } else if (type === "drip") {
    const { DripCampaignEmail } = await import("@/lib/email/drip-campaign-email");
    html = await render(
      DripCampaignEmail({
        recipientName: "VIP Client",
        subjectTitle: "Financing Follow-Up",
        messageContent: "Thank you for exploring our luxury listings.<br/><br/>If you have any questions about financing or mortgage options in Southwest Florida, I am here to help. We work with the best lenders in the area to secure optimal rates for our clients.<br/><br/>Let's schedule a quick call to discuss your goals."
      })
    );
  }

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
