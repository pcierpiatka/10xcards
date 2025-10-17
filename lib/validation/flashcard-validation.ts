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
