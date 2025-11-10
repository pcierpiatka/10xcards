/**
 * DELETE /api/flashcards/{flashcard_id}
 *
 * Deletes a single flashcard by ID
 * User can only delete their own flashcards (enforced by RLS + service layer)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { FlashcardService } from "@/lib/services/flashcard-service.server";
import {
  deleteFlashcardParamsSchema,
  updateFlashcardParamsSchema,
  updateFlashcardBodySchema,
} from "@/lib/validation/flashcard-validation";
import { AppError, ValidationError } from "@/lib/errors/index";
import type { ErrorResponseDto } from "@/lib/dto/types";
import { requireAuth } from "@/lib/api/auth-utils";
import { ApiError } from "@/lib/api/error-responses";
import { requireFeature } from "@/lib/features";

/**
 * DELETE /api/flashcards/{flashcard_id}
 *
 * Request:
 * - Path params: flashcard_id (UUID)
 * - Headers: Authorization: Bearer <Supabase JWT>
 *
 * Response:
 * - 204: No Content (success)
 * - 400: Validation error (invalid UUID format)
 * - 401: Authentication error
 * - 404: Flashcard not found or doesn't belong to user
 * - 500: Server error
 *
 * Note: Returns 404 (not 403) to avoid leaking resource existence
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ flashcard_id: string }> }
): Promise<NextResponse> {
  try {
    // 1. Feature flag check - verify flashcards.delete is enabled
    const featureError = requireFeature("flashcards.delete");
    if (featureError) return featureError;

    // 2. Authentication - require valid user session
    const user = await requireAuth();

    // 3. Initialize Supabase client
    const supabase = await createClient();

    // 4. Await and validate path parameter
    const resolvedParams = await params;
    const validationResult =
      deleteFlashcardParamsSchema.safeParse(resolvedParams);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      throw new ValidationError(firstError.message, {
        field: firstError.path.join("."),
        errors: validationResult.error.issues,
      });
    }

    // 5. Initialize service with dependencies
    const flashcardService = new FlashcardService(supabase);

    // 6. Execute delete
    await flashcardService.delete(validationResult.data.flashcard_id, user.id);

    // 7. Return 204 No Content (success, no response body)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/flashcards/{flashcard_id}
 *
 * Updates a single flashcard (front and back)
 * Automatically changes source_type from 'ai' to 'ai-edited' when editing AI flashcard
 *
 * Request:
 * - Path params: flashcard_id (UUID)
 * - Body: { front: string, back: string }
 * - Headers: Authorization: Bearer <Supabase JWT>
 *
 * Response:
 * - 200: { flashcard: UpdateFlashcardResponseDto }
 * - 400: Validation error (invalid UUID, missing fields, length)
 * - 401: Authentication error
 * - 404: Flashcard not found or doesn't belong to user
 * - 500: Server error
 *
 * Note: Returns 200 (not 204) because server may mutate source_type
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ flashcard_id: string }> }
): Promise<NextResponse> {
  try {
    // 1. Feature flag check - verify flashcards.edit is enabled
    const featureError = requireFeature("flashcards.edit");
    if (featureError) return featureError;

    // 2. Authentication - require valid user session
    const user = await requireAuth();

    // 3. Initialize Supabase client
    const supabase = await createClient();

    // 4. Await and validate path parameter
    const resolvedParams = await params;
    const paramsResult = updateFlashcardParamsSchema.safeParse(resolvedParams);

    if (!paramsResult.success) {
      const firstError = paramsResult.error.issues[0];
      throw new ValidationError(firstError.message, {
        field: firstError.path.join("."),
        errors: paramsResult.error.issues,
      });
    }

    // 5. Parse and validate request body
    const body = await request.json();
    const bodyResult = updateFlashcardBodySchema.safeParse(body);

    if (!bodyResult.success) {
      const firstError = bodyResult.error.issues[0];
      throw new ValidationError(firstError.message, {
        field: firstError.path.join("."),
        errors: bodyResult.error.issues,
      });
    }

    // 6. Initialize service with dependencies
    const flashcardService = new FlashcardService(supabase);

    // 7. Execute update
    const result = await flashcardService.update(
      paramsResult.data.flashcard_id,
      user.id,
      bodyResult.data
    );

    // 8. Return 200 OK with updated flashcard
    return NextResponse.json({ flashcard: result }, { status: 200 });
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
