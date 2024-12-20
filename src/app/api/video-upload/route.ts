import asyncHandler from "../_utils/asyncHandler";
import { ApiError } from "../_utils/ApiError";
import { ApiResponse } from "../_utils/ApiResponse";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import prisma from "@/lib/db";
import { NextResponse } from "next/server";

interface CloudinaryUploadResult {
    public_id: string;
    bytes: number;
    duration: number;
    [key: string]: string | number;

}
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const POST = asyncHandler(async (req) => {
    
    const userId = auth().then((user) => user.userId);
    if(!userId) throw new ApiError(401, "Unauthorized");
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const originalSize = formData.get("originalSize") as string;
    if(!file) throw new ApiError(400, "File not found");

    const bytes = file.arrayBuffer();   
    const buffer = Buffer.from(await bytes);

    const result = await new Promise<CloudinaryUploadResult>(    
        (resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "video-uploads",
                    resource_type: "video",
                    transformations: [
                        {
                            quality : "auto:best", fetch_format: "mp.4" 
                        }
                    ]

                },
                (error, result) => {
                    if(error) reject(error);
                    else resolve(result as unknown as CloudinaryUploadResult);
                }
            )
            uploadStream.end(buffer)
        }
    )

    const video = await prisma.video.create({
        data: {
            title: title,
            description: description,
            publicId: result.public_id,
            orignalSize : originalSize,
            compressSize:  String(result.bytes),
            duration: result.duration || 0,
        }
    }) 
    if(!video) throw new ApiError(500, "Video not created");
    return NextResponse.json(new ApiResponse(video) , { status: 200 });

});