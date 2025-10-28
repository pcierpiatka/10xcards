/**
 * Service for AI flashcard generation
 *
 * Handles business logic for:
 * - Generating flashcard proposals via OpenRouter
 * - Validating and normalizing AI responses
 * - Persisting generation records to database
 */

import type {
  CreateAiGenerationCommand,
  AiGenerationResponseDto,
  AiProposalDto,
  AcceptAiGenerationCommand,
} from "@/lib/dto/types";
import type { ServerSupabaseClient } from "@/lib/db/supabase.server";
import type { Json } from "@/lib/db/database.types";
import { OpenRouterClient } from "@/lib/integrations/openrouter-client";
import { aiGenerationResponseSchema } from "@/lib/validation/ai-generations";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  DatabaseError,
} from "@/lib/errors";

const MODEL_NAME = "gpt-4o-mini";
const MAX_PROPOSALS = 10;

/**
 * AI Generation Service
 *
 * Architecture:
 * - Constructor injection for testability (Supabase + OpenRouter clients)
 * - Single responsibility: AI generation flow only
 * - RLS enforcement via Supabase (user_id isolation)
 */
export class AiGenerationService {
  constructor(
    private readonly supabase: ServerSupabaseClient,
    private readonly openRouterClient: OpenRouterClient
  ) {}

  /**
   * Creates AI flashcard generation
   *
   * Flow:
   * 1. Call OpenRouter API to generate proposals
   * 2. Validate and normalize response (max 10 proposals, character limits)
   * 3. Persist generation record with metadata
   * 4. Return generation ID and proposals
   *
   * @param userId - Authenticated user ID
   * @param command - Generation input (text)
   * @returns Generation ID and validated proposals
   * @throws Error if OpenRouter fails or validation fails
   */
  async createGeneration(
    userId: string,
    command: CreateAiGenerationCommand
  ): Promise<AiGenerationResponseDto> {
    // Measure OpenRouter request duration
    const startTime = performance.now();

    // Call OpenRouter to generate proposals
    const rawProposals = await this.openRouterClient.generateFlashcards(
      command.input_text
    );

    const durationMs = Math.round(performance.now() - startTime);

    // Validate and normalize proposals
    const normalizedProposals = this.normalizeProposals(rawProposals);

    // Persist generation record
    const generationId = await this.persistGeneration({
      userId,
      inputText: command.input_text,
      proposals: normalizedProposals,
      durationMs,
    });

    return {
      generation_id: generationId,
      proposals: normalizedProposals,
    };
  }

  /**
   * Normalizes AI proposals: validates format, limits count, enforces character limits
   *
   * @param proposals - Raw proposals from OpenRouter
   * @returns Validated and normalized proposals (max 10)
   * @throws Error if proposals don't meet validation requirements
   */
  private normalizeProposals(proposals: AiProposalDto[]): AiProposalDto[] {
    // Validate response structure
    const validationResult = aiGenerationResponseSchema.safeParse({
      proposals,
    });

    if (!validationResult.success) {
      console.error("[AiGenerationService] Invalid AI response", {
        errors: validationResult.error.errors,
        proposalsCount: proposals.length,
      });
      throw new Error(
        "Odpowiedź AI nie spełnia wymagań (sprawdź limity znaków i liczbę propozycji)"
      );
    }

    // Limit to MAX_PROPOSALS (defense in depth, schema already validates this)
    return validationResult.data.proposals.slice(0, MAX_PROPOSALS);
  }

  /**
   * Persists generation record to database
   *
   * @param data - Generation metadata
   * @returns Generated record ID
   * @throws Error if database insert fails
   */
  private async persistGeneration(data: {
    userId: string;
    inputText: string;
    proposals: AiProposalDto[];
    durationMs: number;
  }): Promise<string> {
    const { data: result, error } = await this.supabase
      .from("ai_generations")
      .insert({
        user_id: data.userId,
        input_text: data.inputText,
        model_name: MODEL_NAME,
        generated_proposals: data.proposals,
        generated_count: data.proposals.length,
        duration_ms: data.durationMs,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[AiGenerationService] Failed to persist generation", {
        userId: data.userId,
        error: error,
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        fullError: JSON.stringify(error),
      });
      throw new Error("Nie udało się zapisać generacji");
    }

    return result.id;
  }

  /**
   * Accepts AI-generated flashcard proposals atomically
   *
   * Flow:
   * 1. Calls PostgreSQL RPC function accept_ai_generation
   * 2. RPC creates flashcard_sources, flashcards, and ai_generations_acceptance records
   * 3. All operations executed in single transaction (atomic)
   * 4. Maps PostgreSQL error codes to domain errors
   *
   * @param userId - Authenticated user ID
   * @param command - Acceptance command (generation_id, proposals)
   * @returns Promise that resolves when acceptance completes
   * @throws NotFoundError (404) if generation doesn't exist or doesn't belong to user
   * @throws ConflictError (409) if generation was already accepted
   * @throws ValidationError (400) if proposal validation fails
   * @throws DatabaseError (500) for other database errors
   */
  async acceptGeneration(
    userId: string,
    command: AcceptAiGenerationCommand
  ): Promise<void> {
    // Call PostgreSQL RPC function for atomic acceptance
    const { error } = await this.supabase.rpc("accept_ai_generation", {
      p_user_id: userId,
      p_generation_id: command.generation_id,
      p_proposals: command.proposals as unknown as Json,
    });

    // Handle errors with appropriate domain error types
    if (error) {
      console.error("[AiGenerationService] Failed to accept generation", {
        userId,
        generationId: command.generation_id,
        proposalsCount: command.proposals.length,
        errorCode: error.code,
        errorMessage: error.message,
      });

      // Map PostgreSQL error codes to domain errors
      switch (error.code) {
        case "P0001": // Custom NOT FOUND error from RPC
          throw new NotFoundError(
            "Nie znaleziono generacji AI lub brak dostępu"
          );

        case "23505": // Unique violation (duplicate acceptance)
          throw new ConflictError("Ta generacja AI została już zaakceptowana");

        case "22000": // Data exception (validation error)
          throw new ValidationError(
            error.message || "Nieprawidłowe dane propozycji"
          );

        default:
          throw new DatabaseError("Nie udało się zaakceptować generacji", {
            code: error.code,
            message: error.message,
          });
      }
    }

    // Success - no return value needed (void)
  }
}
