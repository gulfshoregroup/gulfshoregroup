import { NextResponse } from "next/server";
import type { PaginatedResult } from "@/lib/api/pagination";

export type ApiSuccess<T> = {
	success: true;
	data: T;
	meta?: Record<string, unknown>;
};

export type ApiFailure = {
	success: false;
	error: string;
	code?: string;
	details?: unknown;
};

export function successResponse<T>(
	data: T,
	status = 200,
	meta?: Record<string, unknown>
): NextResponse<ApiSuccess<T>> {
	return NextResponse.json(
		{ success: true, data, ...(meta ? { meta } : {}) },
		{ status }
	);
}

export function paginatedResponse<T>(
	result: PaginatedResult<T>,
	meta?: Record<string, unknown>
): NextResponse {
	return NextResponse.json({
		success: true,
		data: result.items,
		meta: {
			pagination: result.pagination,
			...meta,
		},
	});
}

export function errorResponse(
	message: string,
	status = 400,
	options?: { code?: string; details?: unknown }
): NextResponse<ApiFailure> {
	return NextResponse.json(
		{
			success: false,
			error: message,
			...(options?.code ? { code: options.code } : {}),
			...(options?.details !== undefined
				? { details: options.details }
				: {}),
		},
		{ status }
	);
}
