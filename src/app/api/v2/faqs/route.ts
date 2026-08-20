import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const queryParams = req.nextUrl.searchParams;
        const cityId = queryParams.get("cityId");
        const category = queryParams.get("category");
        const limit = Number(queryParams.get("limit")) || 20;
        
        let whereClause: any = {};
        
        if (cityId) {
            whereClause.cityId = parseInt(cityId);
        }
        
        if (category) {
            whereClause.category = category;
        }

        const faqs = await prisma.faq.findMany({
            where: whereClause,
            orderBy: [ { order: 'asc' }, { updatedAt: 'desc' } ],
            take: limit,
            include: { city: true }
        });
        
        return NextResponse.json({ success: true, data: faqs });
    } catch (error: any) {
        console.error("Error in GET /api/v2/faqs:", error);
        return NextResponse.json(
            { error: "Internal Server Error", message: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { question, answer, cityId, category, isActive, order } = body;
        
        if (!question || !answer) {
            return NextResponse.json({ success: false, error: "Question and answer are required" }, { status: 400 });
        }
        
        const newFaq = await prisma.faq.create({
            data: {
                question,
                answer,
                cityId: cityId ? parseInt(cityId) : null,
                category: category || "General",
                isActive: isActive !== undefined ? isActive : true,
                order: order ? parseInt(order) : 0
            }
        });
        
        return NextResponse.json({ success: true, data: newFaq });
    } catch (error: any) {
        console.error("Error in POST /api/v2/faqs:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
