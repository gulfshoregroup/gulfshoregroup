import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
	req: Request,
	{ params }: { params: Promise<{ id: string; criteriaId: string }> }
) {
	try {
		const { criteriaId } = await params;
		await prisma.savedSearch.deleteMany({
			where: { id: criteriaId },
		});
		return NextResponse.json({ success: true, message: "Criteria deleted" });
	} catch (err: any) {
		return NextResponse.json({ success: false, error: err.message }, { status: 500 });
	}
}

export async function PUT(
	req: Request,
	{ params }: { params: Promise<{ id: string; criteriaId: string }> }
) {
	try {
		const { criteriaId } = await params;
		const { name } = await req.json();
		
		const updated = await prisma.savedSearch.update({
			where: { id: criteriaId },
			data: { name },
		});
		
		return NextResponse.json({ success: true, data: updated });
	} catch (err: any) {
		return NextResponse.json({ success: false, error: err.message }, { status: 500 });
	}
}
