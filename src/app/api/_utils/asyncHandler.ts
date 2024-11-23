import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "./ApiResponse";
import { ApiError } from "./ApiError";


type RouteParams = Record<string, string | string[]>;



type AsyncHandler = (
  req: NextRequest,
  context: { params: Promise<RouteParams> }
) => Promise<NextResponse>;

const asyncHandler = (
  fn: AsyncHandler
): ((req: NextRequest, context: { params: Promise<RouteParams> }) => Promise<NextResponse>) => {
  return async (req, context) => {
    try {
      const response = await fn(req, context);
      return response;
    } catch (error) {
      console.error(error);
      if (error instanceof ApiError) {
        return NextResponse.json(
          new ApiResponse<null>(null, error),
          { status: error.statusCode }
        );
      }
      return NextResponse.json(
        new ApiResponse<null>(null, new ApiError(500, "Internal server error")),
        { status: 500 }
      );
    }
  };
};

export default asyncHandler;