/**
 * POST /api/ai/generations
 *
 * Generates flashcard proposals using AI (OpenRouter gpt-4o-mini)
 * Persists generation record and returns proposals for user acceptance
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { AiGenerationService } from "@/lib/services/ai-generation-service.server";
import { OpenRouterClient } from "@/lib/integrations/openrouter-client";
import { createAiGenerationSchema } from "@/lib/validation/ai-generations";
import { AppError, ValidationError } from "@/lib/errors/index";
import type { ErrorResponseDto } from "@/lib/dto/types";
import { requireAuth } from "@/lib/api/auth-utils";
import { ApiError } from "@/lib/api/error-responses";
import { requireFeature } from "@/lib/features";

/**
 * POST /api/ai/generations
 *
 * Request:
 * - Body: { input_text: string (1000-10000 chars) }
 * - Headers: Authorization: Bearer <Supabase JWT>
 *
 * Response:
 * - 201: { generation_id: string, proposals: Array<{front, back}> }
 * - 400: Validation error
 * - 401: Authentication error
 * - 500: Server error
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Feature flag guard - check BEFORE any business logic
    const guardError = requireFeature("flashcards.create.ai");
    if (guardError) return guardError;

    // 2. Authentication - require valid user session
    const user = await requireAuth();

    // 3. Initialize Supabase client
    const supabase = await createClient();

    // 4. Parse and validate request body
    const body = await request.json();
    const validationResult = createAiGenerationSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      throw new ValidationError(firstError.message, {
        field: firstError.path.join("."),
        errors: validationResult.error.issues,
      });
    }

    // 5. Initialize service with dependencies
    const openRouterClient = new OpenRouterClient();
    const aiGenerationService = new AiGenerationService(
      supabase,
      openRouterClient
    );

    // 6. Execute generation
    const result = await aiGenerationService.createGeneration(
      user.id,
      validationResult.data
    );

    // 7. Return 201 Created with generation result
    return NextResponse.json(result, { status: 201 });
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
