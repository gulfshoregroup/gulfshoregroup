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
