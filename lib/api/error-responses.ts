import { NextResponse } from "next/server";

/**
 * Custom API Error class with status code
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Standardized error response handler
 * Converts any error to a JSON response with appropriate status code
 */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  // Log unexpected errors for debugging
  console.error("Unexpected API error:", error);

  // Generic error message for security (don't expose internal errors)
  return NextResponse.json({ error: "Wystąpił błąd serwera" }, { status: 500 });
}

/**
 * Common API errors for reuse
 */
export const ApiErrors = {
  Unauthorized: new ApiError(401, "Musisz być zalogowany"),
  Forbidden: new ApiError(403, "Brak dostępu do tego zasobu"),
  NotFound: new ApiError(404, "Zasób nie został znaleziony"),
  BadRequest: (message: string) => new ApiError(400, message),
  InternalServerError: new ApiError(500, "Wystąpił błąd serwera"),
};
