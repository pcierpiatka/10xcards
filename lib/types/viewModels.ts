import type { FlashcardId, FlashcardListItemDto } from "@/lib/dto/types";

/**
 * ViewModel for flashcard with UI-specific state
 * Extends FlashcardListItemDto with optimistic update tracking
 */
export interface FlashcardViewModel extends FlashcardListItemDto {
  id: FlashcardId | string; // UUID from server or temp ID (timestamp)
  status?: "syncing" | "synced" | "error";
}
