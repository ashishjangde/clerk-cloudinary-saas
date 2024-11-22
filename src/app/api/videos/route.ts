import prisma from "@/lib/db";
import asyncHandler from "../_utils/asyncHandler";
import { ApiResponse } from "../_utils/ApiResponse";
import { NextResponse } from "next/server";


export const GET = asyncHandler(async () => {
    const videos = await prisma.video.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });

    return NextResponse.json(new ApiResponse(videos));
});