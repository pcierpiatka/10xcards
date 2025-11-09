/**
 * GET /api/flashcards
 *
 * Returns paginated list of flashcards for authenticated user
 * Supports pagination (always sorted by created_at DESC)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { FlashcardService } from "@/lib/services/flashcard-service.server";
import { flashcardListQuerySchema } from "@/lib/validation/flashcard-validation";
import { AppError, ValidationError } from "@/lib/errors/index";
import type { ErrorResponseDto } from "@/lib/dto/types";
import { requireAuth } from "@/lib/api/auth-utils";
import { ApiError } from "@/lib/api/error-responses";
import { requireFeature } from "@/lib/features";

/**
 * GET /api/flashcards
 *
 * Request:
 * - Query params: ?page=1&page_size=20
 * - Headers: Authorization: Bearer <Supabase JWT> (TODO: not implemented yet)
 *
 * Response:
 * - 200: { data: FlashcardListItemDto[], pagination: PaginationDto }
 * - 400: Validation error
 * - 401: Authentication error
 * - 500: Server error
 *
 * Note: Results always sorted by created_at DESC (newest first)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Feature flag guard - check BEFORE any business logic
    const guardError = requireFeature("flashcards.list");
    if (guardError) return guardError;

    // 2. Authentication - require valid user session
    const user = await requireAuth();

    // 3. Initialize Supabase client
    const supabase = await createClient();

    // 4. Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get("page"),
      page_size: searchParams.get("page_size"),
    };

    const validationResult = flashcardListQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      throw new ValidationError(firstError.message, {
        field: firstError.path.join("."),
        errors: validationResult.error.issues,
      });
    }

    // 5. Initialize service with dependencies
    const flashcardService = new FlashcardService(supabase);

    // 6. Execute query
    const result = await flashcardService.getFlashcards(
      user.id,
      validationResult.data
    );

    // 7. Return 200 OK with flashcard list
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Handles errors and maps them to appropriate HTTP responses
 *
 * @param error - Caught error (AppError or unknown)
 * @returns NextResponse with error details
 */
function handleError(error: unknown): NextResponse<ErrorResponseDto> {
  // Handle ApiError (from auth-utils)
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        status: error.statusCode,
        message: error.message,
      },
      { status: error.statusCode }
    );
  }

  // Handle known application errors
  if (error instanceof AppError) {
    console.error(`[API] ${error.name}`, {
      message: error.message,
      code: error.code,
      details: error.details,
    });

    return NextResponse.json(
      {
        status: error.statusCode,
        message: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // Handle unknown errors (never expose internal details)
  console.error("[API] Unexpected error", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  return NextResponse.json(
    {
      status: 500,
      message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
    },
    { status: 500 }
  );
}
