/**
 * Zod validation schemas for AI generation endpoints
 */

import { z } from "zod";

/**
 * Schema for POST /api/ai/generations request body
 *
 * Validates CreateAiGenerationCommand DTO
 * Requirements:
 * - input_text: 1-10000 characters (max per US-004)
 * - Must be a non-empty string with content
 */
export const createAiGenerationSchema = z.object({
  input_text: z
    .string()
    .min(1, "Tekst nie może być pusty")
    .max(10000, "Tekst może mieć maksymalnie 10000 znaków")
    .trim(),
});

/**
 * Schema for individual AI proposal
 * Used for validating OpenRouter responses
 */
export const aiProposalSchema = z.object({
  front: z
    .string()
    .min(1, "Przód fiszki nie może być pusty")
    .max(300, "Przód fiszki może mieć maksymalnie 300 znaków")
    .trim(),
  back: z
    .string()
    .min(1, "Tył fiszki nie może być pusty")
    .max(600, "Tył fiszki może mieć maksymalnie 600 znaków")
    .trim(),
});

/**
 * Schema for validating AI generation response
 * Ensures:
 * - Proposals array has 1-10 items (DB constraint)
 * - Each proposal meets character limits
 */
export const aiGenerationResponseSchema = z.object({
  proposals: z
    .array(aiProposalSchema)
    .min(1, "Musi być co najmniej jedna propozycja")
    .max(10, "Może być maksymalnie 10 propozycji"),
});
