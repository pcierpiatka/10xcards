/**
 * POST /api/ai/generations/accept
 *
 * Accepts AI-generated flashcard proposals and creates flashcards atomically
 * Uses PostgreSQL RPC function for transactional consistency
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { AiGenerationService } from "@/lib/services/ai-generation-service.server";
import { OpenRouterClient } from "@/lib/integrations/openrouter-client";
import { acceptAiGenerationSchema } from "@/lib/validation/ai-generations";
import { AppError, ValidationError } from "@/lib/errors/index";
import type { ErrorResponseDto } from "@/lib/dto/types";
import { requireAuth } from "@/lib/api/auth-utils";
import { ApiError } from "@/lib/api/error-responses";

/**
 * POST /api/ai/generations/accept
 *
 * Request:
 * - Body: { generation_id: string (uuid), proposals: Array<{front, back}> }
 * - Headers: Authorization: Bearer <Supabase JWT>
 *
 * Response:
 * - 204: No Content (success)
 * - 400: Validation error
 * - 404: Generation not found or access denied
 * - 409: Generation already accepted
 * - 500: Server error
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authentication - require valid user session
    const user = await requireAuth();

    // 2. Initialize Supabase client
    const supabase = await createClient();

    // 3. Parse and validate request body
    const body = await request.json();
    const validationResult = acceptAiGenerationSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      throw new ValidationError(firstError.message, {
        field: firstError.path.join("."),
        errors: validationResult.error.issues,
      });
    }

    // 4. Initialize service with dependencies
    const openRouterClient = new OpenRouterClient();
    const aiGenerationService = new AiGenerationService(
      supabase,
      openRouterClient
    );

    // 4. Execute acceptance (atomic transaction via RPC)
    await aiGenerationService.acceptGeneration(user.id, validationResult.data);

    // 5. Return 204 No Content (success, no response body)
    return new NextResponse(null, { status: 204 });
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
