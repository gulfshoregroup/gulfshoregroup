import { openai } from "@ai-sdk/openai";
import { streamText, tool, convertToModelMessages } from "ai";
import { z } from "zod";
import prisma from "@/lib/prisma";
import UrlMaker from "@/hooks/url-maker";
import { sendAdminLeadAlertEmail } from "@/lib/email/admin-lead-alert";
import { aiTools } from "@/lib/ai/tools";
import { requireLead } from "@/lib/api/auth";
import { recalculateLeadScore } from "@/lib/leads/services/scoring.service";
import { getContextInjectedPrompt } from "@/lib/ai/prompts";

export const maxDuration = 60; // Allow up to 60 seconds

export async function POST(req: Request) {
	try {
		const bodyData = await req.json();
		
		const reqUrl = new URL(req.url);
		const queryUrl = reqUrl.searchParams.get("url");
		
		const currentUrl = bodyData.currentUrl || queryUrl || "";
		console.log("AI Chat API hit. Received URL:", currentUrl);
		console.log("Body keys:", Object.keys(bodyData));
		
		let { messages, propertyContext } = bodyData;
		const lead = await requireLead();

		// If frontend didn't pass propertyContext, try to fetch it from the URL
		if (!propertyContext && currentUrl) {
			try {
				let pathStr = currentUrl;
				try {
					const urlObj = new URL(currentUrl.startsWith("http") ? currentUrl : `http://localhost${currentUrl}`);
					pathStr = urlObj.pathname;
				} catch(e) {}
				
				const pathSegments = pathStr.split("/").filter(Boolean);
				
				// Ensure it's a property page: /Florida-Real-Estate-Listings/[City]/[Community]/[Address]/[MLS]
				if (pathSegments.length >= 4 && pathSegments[0] === "Florida-Real-Estate-Listings") {
					const mlsNumber = pathSegments[pathSegments.length - 1];
					if (mlsNumber) {
						propertyContext = await prisma.property.findUnique({
							where: { MLSNumber: mlsNumber },
							select: {
								FullAddress: true,
								City: true,
								ListPrice: true,
								BedroomsTotal: true,
								BathroomsTotalInteger: true,
								LivingArea: true,
								PoolPrivateYN: true,
								WaterfrontYN: true,
								HOAFee: true,
								TaxAnnualAmount: true,
								YearBuilt: true
							}
						});
					}
				}
			} catch (e) {
				console.error("Failed to fetch property context from URL MLS:", e);
			}
		}

		// Save the user's incoming message to DB
		const lastUserMessage = messages[messages.length - 1];
		if (lastUserMessage && lastUserMessage.role === "user") {
			let messageText = "";

			if (typeof lastUserMessage.content === "string") {
				messageText = lastUserMessage.content;
			} else if (Array.isArray(lastUserMessage.content)) {
				// Sometimes content is an array of parts
				messageText = lastUserMessage.content.map((p: any) => p.text || "").join("");
			}

			if (!messageText && lastUserMessage.parts && Array.isArray(lastUserMessage.parts)) {
				messageText = lastUserMessage.parts.map((p: any) => p.text || "").join("");
			}

			await prisma.aIChatHistory.create({
				data: {
					leadId: lead.id,
					channel: "website",
					role: "user",
					message: messageText,
				}
			});
		}

		// If guest user, bypass history memory to avoid context/Naples pollution from other guest users
		let activeMessages = messages;
		if (lead.email === "guest@gulfshoregroup.com") {
			// Find the last few user messages to preserve the immediate context of the current search
			// We take the last 10 messages to keep the user's choices (intent, beds, city, budget) active
			activeMessages = messages.slice(-10);
		}

		// @ts-ignore
		const result = streamText({
			model: openai("gpt-4o-mini"),
			// @ts-ignore
			maxSteps: 5,
			system: getContextInjectedPrompt(propertyContext, currentUrl),
			messages: await convertToModelMessages(activeMessages),
			tools: aiTools,
			
			onFinish: async ({ text, toolCalls, toolResults }: any) => {
				// Save the AI's response to the DB
				let finalMessage = text;

				if (toolResults && toolResults.length > 0) {
					const resultObj = toolResults[0] as any;
					// Fallback to resultObj.args if toolCalls is not populated in onFinish
					const rawArgs = (toolCalls && toolCalls.length > 0) ? toolCalls[0].args : resultObj.args;
					const toolArgs = rawArgs ? JSON.stringify(rawArgs) : "{}";
					
					// AI SDK sometimes returns the array directly in resultObj.result, or it might be serialized.
					const toolRet = resultObj.result;
					const count = Array.isArray(toolRet) ? toolRet.length : (toolRet && typeof toolRet === 'object' && toolRet.properties ? toolRet.properties.length : 0);

					if (count > 0) {
						finalMessage += `\n\n[Displayed ${count} properties] [Args: ${toolArgs}]`;
					} else if (toolRet && toolRet.found === true) {
						// For seller check
						finalMessage += `\n\n[Found Seller Properties] [Args: ${toolArgs}]`;
					} else if (toolRet && toolRet.success === true) {
						// For schedule tour
						finalMessage += `\n\n[Scheduled Tour/Valuation] [Args: ${toolArgs}]`;
					} else {
						finalMessage += `\n\n[Searched but found none or returned empty] [Args: ${toolArgs}]`;
					}
				}

				if (finalMessage) {
					await prisma.aIChatHistory.create({
						data: {
							leadId: lead.id,
							channel: "website",
							role: "ai",
							message: finalMessage,
						}
					});
				}

				// Recalculate score after the chat interaction
				try {
					recalculateLeadScore(lead.id);
				} catch (err) {
					console.error("Scoring recalculation error:", err);
				}
			},
		});

		return result.toUIMessageStreamResponse();
	} catch (error: any) {
		console.error("AI Chat Error:", error);
		return Response.json({ error: "Failed to generate AI response" }, { status: 500 });
	}
}
