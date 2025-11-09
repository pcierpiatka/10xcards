/**
 * Service for flashcard management
 *
 * Handles business logic for:
 * - Fetching flashcard lists with pagination and filtering
 * - CRUD operations on flashcards
 */

import type {
  FlashcardListQuery,
  FlashcardListResponseDto,
  FlashcardListItemDto,
  FlashcardId,
} from "@/lib/dto/types";
import type { ServerSupabaseClient } from "@/lib/db/supabase.server";
import { NotFoundError } from "@/lib/errors";

/**
 * Flashcard Service
 *
 * Architecture:
 * - Constructor injection for testability (Supabase client)
 * - Single responsibility: Flashcard data access and business logic
 * - RLS enforcement via Supabase (user_id isolation)
 */
export class FlashcardService {
  constructor(private readonly supabase: ServerSupabaseClient) {}

  /**
   * Gets paginated flashcard list for authenticated user
   *
   * Flow:
   * 1. Build base query for flashcards table
   * 2. Apply sorting (always created_at DESC - newest first)
   * 3. Apply pagination (range based on page and page_size)
   * 4. Execute query with count option to get total items
   * 5. Map database results to DTOs
   * 6. Calculate pagination metadata
   * 7. Return response with data and pagination
   *
   * @param userId - Authenticated user ID
   * @param query - List query parameters (page, page_size)
   * @returns Paginated list of flashcards with metadata
   * @throws Error if database query fails
   */
  async getFlashcards(
    userId: string,
    query: FlashcardListQuery
  ): Promise<FlashcardListResponseDto> {
    // Apply defaults (validation middleware ensures valid values)
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;

    // Build base query - select only required fields for DTO
    let queryBuilder = this.supabase
      .from("flashcards")
      .select(
        "flashcard_id, front, back, source_type, created_at",
        { count: "exact" } // Get total count for pagination
      )
      .eq("user_id", userId) // RLS should enforce this, but explicit is better
      .order("created_at", { ascending: false }); // Always DESC (newest first)

    // Apply pagination using range
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    queryBuilder = queryBuilder.range(from, to);

    // Execute query
    const { data, error, count } = await queryBuilder;

    if (error) {
      console.error("[FlashcardService] Failed to fetch flashcards", {
        userId,
        query,
        error: error.message,
        errorDetails: error,
        errorCode: error.code,
        errorHint: error.hint,
      });
      throw new Error("Nie udało się pobrać fiszek");
    }

    // Map database results to DTOs
    const items: FlashcardListItemDto[] = (data ?? []).map((row) => ({
      id: row.flashcard_id,
      front: row.front,
      back: row.back,
      source_type: row.source_type,
      created_at: row.created_at,
    }));

    // Calculate pagination metadata
    const totalItems = count ?? 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      data: items,
      pagination: {
        page,
        page_size: pageSize,
        total_pages: totalPages,
        total_items: totalItems,
      },
    };
  }

  /**
   * Deletes a single flashcard by ID
   *
   * Flow:
   * 1. Execute DELETE query matching flashcard_id AND user_id
   * 2. Check count of deleted rows
   * 3. If count is 0, throw NotFoundError (flashcard doesn't exist or doesn't belong to user)
   * 4. Return void on success
   *
   * Security:
   * - RLS policies enforce user_id isolation
   * - Explicit .eq('user_id', userId) prevents IDOR attacks
   * - Returns 404 (not 403) to avoid leaking resource existence
   *
   * @param id - Flashcard ID to delete
   * @param userId - Authenticated user ID
   * @throws NotFoundError if flashcard doesn't exist or doesn't belong to user
   * @throws Error if database operation fails
   */
  async delete(id: FlashcardId, userId: string): Promise<void> {
    const { error, count } = await this.supabase
      .from("flashcards")
      .delete({ count: "exact" })
      .match({ flashcard_id: id, user_id: userId });

    if (error) {
      console.error("[FlashcardService] Failed to delete flashcard", {
        flashcard_id: id,
        userId,
        error: error.message,
        errorDetails: error,
        errorCode: error.code,
        errorHint: error.hint,
      });
      throw new Error("Nie udało się usunąć fiszki");
    }

    // Check if any rows were deleted
    if (count === 0) {
      throw new NotFoundError("Nie znaleziono fiszki");
    }
  }

  /**
   * Deletes multiple flashcards by IDs (bulk delete)
   *
   * Flow:
   * 1. Execute DELETE query with .in() for multiple IDs
   * 2. Filter by user_id to prevent IDOR
   * 3. Check count of deleted rows
   * 4. If count is 0, throw NotFoundError (no matching flashcards for this user)
   * 5. Return void on success
   *
   * Security:
   * - RLS policies enforce user_id isolation
   * - Explicit .eq('user_id', userId) prevents IDOR attacks
   * - Returns 404 if none of the IDs match user's flashcards
   *
   * Performance:
   * - Uses .in() for efficient bulk operation (single query vs N queries)
   * - ON DELETE CASCADE automatically removes related flashcard_sources
   *
   * @param ids - Array of flashcard IDs to delete
   * @param userId - Authenticated user ID
   * @throws NotFoundError if none of the flashcards exist or belong to user
   * @throws Error if database operation fails
   */
  async bulkDelete(ids: FlashcardId[], userId: string): Promise<void> {
    const { error, count } = await this.supabase
      .from("flashcards")
      .delete({ count: "exact" })
      .in("flashcard_id", ids)
      .eq("user_id", userId);

    if (error) {
      console.error("[FlashcardService] Failed to bulk delete flashcards", {
        ids,
        userId,
        error: error.message,
        errorDetails: error,
        errorCode: error.code,
        errorHint: error.hint,
      });
      throw new Error("Nie udało się usunąć fiszek");
    }

    // Check if any rows were deleted
    if (count === 0) {
      throw new NotFoundError("Nie znaleziono żadnej z wybranych fiszek");
    }
  }
}
