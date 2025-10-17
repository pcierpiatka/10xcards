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
import { DEV } from "@/lib/constants";

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
    // 1. Authentication - verify Supabase JWT
    const supabase = await createClient();
    // const {
    //   data: { user },
    //   error: authError,
    // } = await supabase.auth.getUser();

    // if (authError || !user) {
    //   throw new AuthenticationError();
    // }

    // TODO: Remove hardcoded user ID after auth is working
    const user = { id: DEV.USER_ID };

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = createAiGenerationSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      throw new ValidationError(firstError.message, {
        field: firstError.path.join("."),
        errors: validationResult.error.errors,
      });
    }

    // 3. Initialize service with dependencies
    const openRouterClient = new OpenRouterClient();
    const aiGenerationService = new AiGenerationService(
      supabase,
      openRouterClient
    );

    // 4. Execute generation
    const result = await aiGenerationService.createGeneration(
      user.id,
      validationResult.data
    );

    // 5. Return 201 Created with generation result
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
