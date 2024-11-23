import { auth } from "@clerk/nextjs/server";
import asyncHandler from "../_utils/asyncHandler";
import { ApiError } from "../_utils/ApiError";
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { ApiResponse } from "../_utils/ApiResponse";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadResult {
    public_id: string;
    [key: string]: string;
}

export const POST = asyncHandler(async (req) => {
    const user = await auth();
    if (!user?.userId) throw new ApiError(401, "Unauthorized");

    const body = await req.formData();
    const file = body.get("file") as File | null;

    if (!file) throw new ApiError(400, "File not found");
    if (!file.type.startsWith("image/")) throw new ApiError(400, "Invalid file type");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "next-cloudinary-uploads" },
            (error, result) => {
                if (error) reject(error);
                else resolve(result as unknown as CloudinaryUploadResult);
            }
        );
        uploadStream.end(buffer); 
    });

    return NextResponse.json(new ApiResponse(result.public_id), { status: 200 });
});
