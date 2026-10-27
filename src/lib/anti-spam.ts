/**
 * Anti-Spam protection helper to detect and reject bot submissions
 * targeting public forms and registration endpoints.
 */

// Common spam / gambling / phishing trigger words commonly found in bot payloads
const SPAM_KEYWORDS = [
	"bonusu",
	"tıkla",
	"kapip",
	"kac!",
	"bahis",
	"casino",
	"slot",
	"betting",
	"poker",
	"roulette",
	"crypto",
	"telegram",
	"whatsapp.me",
	"wa.me",
];

// URL and Link patterns that should NEVER appear in person's first/last name
const URL_PATTERN = /(https?:\/\/|www\.|bit\.ly|tinyurl|t\.co|goo\.gl|is\.gd|buff\.ly|ow\.ly|\.xyz\/|\.ru\/|\.top\/|\.online\/)/i;

interface AntiSpamInput {
	name?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
	phone?: string | null;
	message?: string | null;
	honeypot?: string | null;
}

export function isSpamSubmission(input: AntiSpamInput): { isSpam: boolean; reason?: string } {
	// 1. Check honeypot (bots often fill hidden fields)
	if (input.honeypot && String(input.honeypot).trim().length > 0) {
		return { isSpam: true, reason: "Honeypot triggered" };
	}

	const nameFields = [input.name, input.firstName, input.lastName]
		.filter(Boolean)
		.join(" ");

	// 2. Reject if any URL appears in name fields
	if (nameFields && URL_PATTERN.test(nameFields)) {
		return { isSpam: true, reason: "Name cannot contain links or URLs" };
	}

	// 3. Reject if known casino/gambling bot keywords appear in name fields
	const lowerNames = nameFields.toLowerCase();
	for (const keyword of SPAM_KEYWORDS) {
		if (lowerNames.includes(keyword)) {
			return { isSpam: true, reason: "Suspicious submission detected" };
		}
	}

	// 4. Check if phone contains non-numeric URL spam
	if (input.phone && URL_PATTERN.test(input.phone)) {
		return { isSpam: true, reason: "Phone number cannot contain links" };
	}

	return { isSpam: false };
}

