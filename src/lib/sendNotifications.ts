// import { sendEmail } from "./sendEmail";
import { sendSMS } from "./twilio";
import { Lead } from "@/app/generated/prisma/client";

export async function sendMessageToLead(
	lead: Lead,
	type: string,
	message: string
) {
	const text = message
		.replace(/{{name}}/g, (lead.fullName ?? "").toString())
		.replace(/{{phone}}/g, (lead.phone ?? "").toString())
		.replace(/{{email}}/g, (lead.email ?? "").toString());

	if (type === "sms" && lead.phone) {
		const sanitized = "+" + lead.phone.replace(/[^0-9]/g, "");
		sendSMS(sanitized, text);
		return { ok: true, meta: { provider: "twilio-stub" } };
	}

	// if (type === "email" && lead.email) {
	// 	sendEmail(lead.id, lead.email, "", text);
	// 	return { ok: true, meta: { provider: "email-stub" } };
	// }

	// fallback
	return { ok: false, error: "unsupported type" };
}
