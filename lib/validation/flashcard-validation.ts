/**
 * Zod validation schemas for flashcard endpoints
 */

import { z } from "zod";

/**
 * Schema for GET /api/flashcards query parameters
 *
 * Validates FlashcardListQuery DTO
 * Requirements:
 * - page: positive integer, default 1 (validated only if provided)
 * - page_size: 1-100, default 20 (validated only if provided)
 *
 * Note: Uses .nullish() - validation runs only for explicitly provided params
 * Note: Sort is always created_at DESC (hardcoded in service)
 */
export const flashcardListQuerySchema = z.object({
  page: z
    .string()
    .nullish()
    .transform((val) => {
      if (!val) return 1; // Default without validation
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
        throw new Error("Numer strony musi być dodatnią liczbą całkowitą");
      }
      return parsed;
    }),
  page_size: z
    .string()
    .nullish()
    .transform((val) => {
      if (!val) return 20; // Default without validation
      const parsed = parseInt(val, 10);
      if (
        isNaN(parsed) ||
        !Number.isInteger(parsed) ||
        parsed < 1 ||
        parsed > 100
      ) {
        throw new Error("Rozmiar strony musi być liczbą całkowitą od 1 do 100");
      }
      return parsed;
    }),
});

/**
 * Schema for DELETE /api/flashcards/{flashcard_id} path parameter
 *
 * Validates flashcard_id from URL path
 * Requirements:
 * - Must be a valid UUID format
 *
 * Note: Uses .uuid() for strict UUID validation
 */
export const deleteFlashcardParamsSchema = z.object({
  flashcard_id: z.string().uuid("ID fiszki musi być w formacie UUID"),
});

/**
 * Schema for DELETE /api/flashcards request body (bulk delete)
 *
 * Validates BulkDeleteFlashcardsCommand DTO
 * Requirements:
 * - ids: non-empty array of valid UUIDs
 *
 * Note: .min(1) prevents empty array submissions
 */
export const bulkDeleteFlashcardsSchema = z.object({
  ids: z
    .array(z.string().uuid("Każde ID musi być w formacie UUID"))
    .min(1, "Tablica 'ids' nie może być pusta"),
});

/**
 * Schema for PUT /api/flashcards/{flashcard_id} path parameter
 *
 * Validates flashcard_id from URL path
 * Requirements:
 * - Must be a valid UUID format
 */
export const updateFlashcardParamsSchema = z.object({
  flashcard_id: z.string().uuid("ID fiszki musi być w formacie UUID"),
});

/**
 * Schema for PUT /api/flashcards/{flashcard_id} request body
 *
 * Validates UpdateFlashcardCommand DTO
 * Requirements:
 * - front: 1-300 chars (required)
 * - back: 1-600 chars (required)
 * - Both fields must be present
 *
 * Note: Unlike PATCH, PUT requires both fields (full update)
 */
export const updateFlashcardBodySchema = z.object({
  front: z
    .string()
    .min(1, "Przód fiszki nie może być pusty")
    .max(300, "Przód fiszki może mieć maksymalnie 300 znaków"),
  back: z
    .string()
    .min(1, "Tył fiszki nie może być pusty")
    .max(600, "Tył fiszki może mieć maksymalnie 600 znaków"),
});
