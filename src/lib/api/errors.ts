import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { errorResponse } from "@/lib/api/responses";

export class ApiError extends Error {
	constructor(
		public statusCode: number,
		message: string,
		public code?: string,
		public details?: unknown
	) {
		super(message);
		this.name = "ApiError";
	}
}

export function handleApiError(error: unknown): NextResponse {
	if (error instanceof ApiError) {
		return errorResponse(error.message, error.statusCode, {
			code: error.code,
			details: error.details,
		});
	}

	if (error instanceof ZodError) {
		return errorResponse("Validation failed", 400, {
			code: "VALIDATION_ERROR",
			details: error.flatten(),
		});
	}

	console.error("[API Error]", error);
	return errorResponse("Internal server error", 500, {
		code: "INTERNAL_ERROR",
	});
}
