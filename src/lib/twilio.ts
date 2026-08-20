import Twilio from "twilio";

const client = Twilio(
	process.env.TWILIO_SID,
	process.env.TWILIO_TOKEN
);

export const sendSMS = async (to: string, body: string) => {
	try {
		const from = process.env.TWILIO_NUMBER ? "+" + process.env.TWILIO_NUMBER.replace(/[^0-9]/g, "") : "";
		if (!process.env.TWILIO_SID || !process.env.TWILIO_TOKEN || !from) {
			console.log("Twilio credentials missing, skipping SMS dispatch.");
			return;
		}
		await client.messages.create({
			body,
			from,
			to,
		});
	} catch (error) {
		console.error("Twilio SMS send failed gracefully:", error);
	}
};


export const sendWhatsAppMessage = async (to: string) => {
	try {
		const from = process.env.TWILIO_NUMBER ? "+" + process.env.TWILIO_NUMBER.replace(/[^0-9]/g, "") : "";
		const res = await client.messages.create({
			from: `whatsapp:${from}`,
			to: `whatsapp:${to}`,
			contentSid: "HX27c542817f11499df2301c22fb7998a0",
			messagingServiceSid: "MGb9a7f084e43f105cece9b308e2d8113b",
			contentVariables: JSON.stringify({
				1: "Dimitri",
				2: "https://gulfshoregroup.com/Florida-Real-Estate-Search/Homes/Naples/sort=Newest-First",
			}),
		});
		console.log("WhatsApp message sent successfully", res);
	} catch (error) {
		console.log("WhatsApp message sent failed", error);
	}
};
