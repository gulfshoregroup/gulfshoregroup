import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const id = (await params).id;

		const search = await prisma.savedSearch.findUnique({
			where: { id },
		});

		if (!search) {
			return NextResponse.json(
				{ error: "Saved search not found" },
				{ status: 404 }
			);
		}

		const sFilters = (search.filters as any) || {};
		return NextResponse.json({
			...search,
			_id: search.id,
			user: search.userId,
			link: sFilters.link || "",
			filters: sFilters,
			subscriptionEnabled: search.notify,
			subscriptionFrequency: search.frequency,
		});
	} catch (error) {
		console.error("Error fetching saved search:", error);
		return NextResponse.json(
			{ error: "Failed to fetch saved search" },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const id = (await params).id;

		const body = await request.json();
		const {
			name,
			link,
			filters,
			subscriptionFrequency,
			subscriptionEnabled,
		} = body;

		const existing = await prisma.savedSearch.findUnique({
			where: { id },
		});

		if (!existing) {
			return NextResponse.json(
				{ error: "Saved search not found" },
				{ status: 404 }
			);
		}

		const existingFilters = (existing.filters as any) || {};
		const updatedFilters = {
			...existingFilters,
			...(filters || {}),
			...(link !== undefined ? { link } : {}),
		};

		const updatedSearch = await prisma.savedSearch.update({
			where: { id },
			data: {
				name: name !== undefined ? name : existing.name,
				filters: updatedFilters,
				notify: subscriptionEnabled !== undefined ? subscriptionEnabled : existing.notify,
				frequency: subscriptionFrequency !== undefined ? subscriptionFrequency : existing.frequency,
			},
		});

		const sFilters = (updatedSearch.filters as any) || {};
		return NextResponse.json({
			...updatedSearch,
			_id: updatedSearch.id,
			user: updatedSearch.userId,
			link: sFilters.link || "",
			filters: sFilters,
			subscriptionEnabled: updatedSearch.notify,
			subscriptionFrequency: updatedSearch.frequency,
		});
	} catch (error) {
		console.error("Error updating saved search:", error);
		return NextResponse.json(
			{ error: "Failed to update saved search" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const id = (await params).id;

		const existing = await prisma.savedSearch.findUnique({
			where: { id },
		});

		if (!existing) {
			return NextResponse.json(
				{ error: "Saved search not found" },
				{ status: 404 }
			);
		}

		await prisma.savedSearch.delete({
			where: { id },
		});

		return NextResponse.json({
			message: "Search deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting saved search:", error);
		return NextResponse.json(
			{ error: "Failed to delete saved search" },
			{ status: 500 }
		);
	}
}
