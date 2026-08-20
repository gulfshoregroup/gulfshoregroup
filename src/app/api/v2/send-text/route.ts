import { sendSMS, sendWhatsAppMessage } from "@/lib/twilio";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		await sendSMS(
			"+919351148507",
			`New Lead!
Name: kanta kumar
Email: kantakumar0011@gmail.com
Timestamp: 5:32 pm
Monday, 18 May 2026`
		);
		// sendWhatsAppMessage("+12399929119");
		return NextResponse.json({ success: true });
	} catch (error) {
console.log(error);
		return NextResponse.json(

			{ error: "Internal Server Error" },

			{ status: 500 }
		);
	}
}
