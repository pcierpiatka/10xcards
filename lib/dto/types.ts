/**
 * DTO (Data Transfer Object) type definitions for MVP
 *
 * This file uses a hybrid approach combining:
 * - Type-safe ID aliases and DRY composition (from typesV2)
 * - Minimal fields based on UI needs (from rubber duck analysis)
 * - Flat structures where MVP doesn't need nesting
 *
 * Design principles:
 * - Type safety: Use branded ID types to prevent mixing different entity IDs
 * - DRY: Core shapes composed via extends, single source of truth
 * - KISS: Flat structures for MVP, no unnecessary nesting
 * - YAGNI: Only fields actually used by UI
 * - Information Hiding: Don't expose internal DB structure without reason
 *
 * See: .claude/thinking/gumowa-kaczka-dto-simplification.md
 */

import type {
  AiGeneration,
  AiFlashcardProposal,
  Flashcard,
  FlashcardSource,
  FlashcardSourceType,
} from "@/lib/db/database.types";

// ============================================================================
// BASE TYPES & ALIASES
// ============================================================================

/**
 * Type-safe ID aliases prevent accidentally mixing different entity IDs.
 * Example: function deleteFlashcard(id: FlashcardId) won't accept AiGenerationId
 */
export type AiGenerationId = AiGeneration["id"];
export type FlashcardId = Flashcard["flashcard_id"];
export type FlashcardSourceId = FlashcardSource["flashcard_source_id"];

/**
 * Core flashcard shape - reused across all flashcard DTOs.
 * Derived from database entity to maintain single source of truth.
 */
export interface FlashcardCoreDto extends Pick<Flashcard, "front" | "back"> {
  id: FlashcardId;
}

/**
 * Canonical AI proposal structure used across generation flows.
 */
export type AiProposalDto = Pick<AiFlashcardProposal, "front" | "back">;

// ============================================================================
// 1. AI GENERATION
// ============================================================================

/**
 * Command: POST /api/ai/generations
 * UI: AI Generation Form → Generate button
 * Derived from: AiGeneration (input_text only)
 */
export type CreateAiGenerationCommand = Pick<AiGeneration, "input_text">;

/**
 * Response: POST /api/ai/generations (201)
 * UI: Display checkbox list of proposals to accept
 */
export interface AiGenerationResponseDto {
  generation_id: AiGenerationId;
  proposals: AiProposalDto[];
}

/**
 * Command: POST /api/ai/generations/accept
 * UI: Accept selected proposals → create flashcards → redirect to list
 */
export interface AcceptAiGenerationCommand {
  generation_id: AiGenerationId;
  proposals: AiProposalDto[];
}

// Response: 204 No Content

// ============================================================================
// 2. FLASHCARD CRUD
// ============================================================================

/**
 * Command: POST /api/flashcards
 * UI: Manual flashcard creation form
 * Derived from: Flashcard (front, back only)
 */
export type CreateManualFlashcardCommand = Pick<Flashcard, "front" | "back">;

/**
 * Response: POST /api/flashcards (201)
 * UI: Add created flashcard to local state (instant feedback, no refetch)
 *
 * Minimal fields based on rubber duck analysis:
 * - id: Required for subsequent edit/delete
 * - front, back: Display in list
 * - source_type: Display badge ("Manual")
 *
 * Removed (see rubber duck doc):
 * - flashcard_source_id: Internal DB field, no UI use case in MVP
 * - created_at: Not displayed for fresh items ("just now" is implicit)
 */
export interface CreateManualFlashcardResponseDto extends FlashcardCoreDto {
  source_type: FlashcardSourceType;
}

/**
 * Query: GET /api/flashcards
 * UI: Flashcard list with pagination and filters
 */
export interface FlashcardListQuery {
  page?: number; // default: 1
  page_size?: number; // default: 20, max: 100
  sort?: "created_at_asc" | "created_at_desc"; // default: created_at_desc
  source_type?: FlashcardSourceType;
}

/**
 * Single flashcard item in list
 * UI: Displayed in flashcard list with edit/delete buttons
 *
 * Flat structure based on rubber duck analysis:
 * - source_type: Top-level (not nested) - needed for badge only
 * - created_at: For sorting and "added X days ago"
 *
 * Removed (see rubber duck doc):
 * - flashcard_source (nested object): No "view source" feature in MVP
 * - flashcard_source_id: Internal field with no UI use case
 * - updated_at: Not displayed in list view
 */
export interface FlashcardListItemDto extends FlashcardCoreDto {
  source_type: FlashcardSourceType;
  created_at: string; // ISO-8601
}

/**
 * Response: GET /api/flashcards (200)
 */
export interface FlashcardListResponseDto {
  data: FlashcardListItemDto[];
  pagination: PaginationDto;
}

/**
 * Response: GET /api/flashcards/{id} (200)
 * UI: Before editing flashcard (pre-populate form)
 *
 * Note: Same shape as list item. Additional fields (like updated_at)
 * not needed in edit form for MVP.
 */
export interface FlashcardDetailResponseDto {
  flashcard: FlashcardListItemDto;
}

/**
 * Command: PATCH /api/flashcards/{id}
 * UI: Edit flashcard modal/form
 * Derived from: Flashcard (front, back optional for partial update)
 */
export type UpdateFlashcardCommand = Partial<Pick<Flashcard, "front" | "back">>;

/**
 * Response: PATCH /api/flashcards/{id} (200)
 * UI: Update local state with new values
 *
 * Returns 200 (not 204) because server may mutate source_type:
 * - If original source_type = "ai" AND user edits → changes to "ai-edited"
 * - Frontend needs to know this change to update badge
 */
export interface UpdateFlashcardResponseDto extends FlashcardCoreDto {
  source_type: FlashcardSourceType;
}

// DELETE /api/flashcards/{id} → 204 No Content

/**
 * Command: DELETE /api/flashcards (bulk)
 * UI: Multi-select + "Delete selected" button
 */
export interface BulkDeleteFlashcardsCommand {
  ids: FlashcardId[];
}

// Response: 204 No Content

// ============================================================================
// 3. FLASHCARD SOURCES
// ============================================================================

/**
 * Query: GET /api/flashcard-sources
 * UI: Analytics or source filtering (future feature)
 */
export interface FlashcardSourceListQuery {
  source_type?: FlashcardSourceType;
  limit?: number;
  cursor?: string;
}

/**
 * Single flashcard source item
 * Derived from: FlashcardSource (all fields, no simplification needed)
 */
export interface FlashcardSourceListItemDto {
  id: FlashcardSourceId;
  source_type: FlashcardSourceType;
  source_id: string | null; // AI generation ID or null for manual
  created_at: string;
}

/**
 * Response: GET /api/flashcard-sources (200)
 */
export interface FlashcardSourceListResponseDto {
  data: FlashcardSourceListItemDto[];
  next_cursor: string | null;
}

/**
 * Response: GET /api/flashcard-sources/{id} (200)
 * UI: View all flashcards from a specific source
 */
export interface FlashcardSourceDetailResponseDto {
  source: {
    id: FlashcardSourceId;
    source_type: FlashcardSourceType;
    source_id: string | null;
    created_at: string;
    flashcards: FlashcardCoreDto[]; // Minimal: just id, front, back
  };
}

// ============================================================================
// 4. STUDY MODE
// ============================================================================

/**
 * Query: GET /api/study/flashcards
 * UI: Study mode - flip cards front/back
 */
export interface StudyFlashcardsQuery {
  limit?: number; // default: all, max: 200
  exclude_ids?: FlashcardId[];
  shuffle?: boolean; // default: true
}

/**
 * Single card in study session
 * UI: Display in flip card interface
 *
 * Minimal fields based on rubber duck analysis:
 * - id: Track seen cards for exclude_ids
 * - front, back: Display in flip card
 *
 * Removed (see rubber duck doc):
 * - source_type: No badge shown during study (would be distracting)
 * - created_at: Not relevant in study mode
 */
export type StudyCardDto = FlashcardCoreDto;

/**
 * Response: GET /api/study/flashcards (200)
 * UI: Study session with progress counter "Card X of Y"
 */
export interface StudyFlashcardsResponseDto {
  cards: StudyCardDto[];
  total_available: number; // For progress display
}

/**
 * Command: POST /api/study/summary
 * UI: Log study session completion (optional analytics)
 */
export interface SubmitStudySummaryCommand {
  cards_seen: number;
  cards_total: number;
  duration_seconds: number;
}

// Response: 202 Accepted

// ============================================================================
// 5. USER MANAGEMENT
// ============================================================================

/**
 * Command: DELETE /api/users/me
 * UI: Account deletion with optional password re-auth
 */
export interface DeleteUserCommand {
  password?: string;
}

// Response: 204 No Content

// ============================================================================
// 6. SHARED/UTILITY
// ============================================================================

/**
 * Pagination metadata for list responses
 */
export interface PaginationDto {
  page: number;
  page_size: number;
  total_pages: number;
  total_items: number;
}

/**
 * Standard error response format
 * Used across all endpoints for consistent error handling
 */
export interface ErrorResponseDto {
  status: number;
  message: string; // User-friendly message
  code?: string; // Optional error code for client handling
  details?: unknown; // Optional additional context
}

/**
 * Rate limit error (429)
 * Extends standard error with retry information
 */
export interface RateLimitErrorResponseDto extends ErrorResponseDto {
  status: 429;
  retry_after: number; // Unix timestamp when rate limit resets
}
