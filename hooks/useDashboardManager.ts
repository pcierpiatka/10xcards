import { useEffect, useState } from "react";
import type {
  AiGenerationResponseDto,
  AiProposalDto,
  CreateManualFlashcardCommand,
  FlashcardId,
  PaginationDto,
  UpdateFlashcardCommand,
} from "@/lib/dto/types";
import type { FlashcardViewModel } from "@/lib/types/viewModels";
import * as flashcardService from "@/lib/services/flashcard-service.client";

/**
 * View state types for Dashboard
 */
type ViewState =
  | "idle"
  | "loadingList"
  | "generatingAi"
  | "acceptingProposals"
  | "error";

/**
 * Custom hook for Dashboard state management
 * Centralizes all business logic for /dashboard view
 */
export function useDashboardManager() {
  // State
  const [flashcards, setFlashcards] = useState<FlashcardViewModel[]>([]);
  const [pagination, setPagination] = useState<PaginationDto | null>(null);
  const [aiProposals, setAiProposals] =
    useState<AiGenerationResponseDto | null>(null);
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [formResetKey, setFormResetKey] = useState(0); // For resetting AI form
  // Optimistic delete backup - stores flashcards that were deleted but might need rollback
  const [optimisticallyDeleted, setOptimisticallyDeleted] = useState<
    Map<FlashcardId, FlashcardViewModel>
  >(new Map());

  // Load initial flashcards on mount
  useEffect(() => {
    const loadInitialFlashcards = async () => {
      try {
        setViewState("loadingList");
        setError(null);

        const response = await flashcardService.fetchFlashcards({
          page: 1,
          page_size: 20,
        });

        setFlashcards(response.data);
        setPagination(response.pagination);
        setViewState("idle");
      } catch (err) {
        console.error("Failed to load flashcards:", err);
        setError(
          err instanceof flashcardService.ApiError
            ? err.message
            : "Nie udało się załadować fiszek"
        );
        setViewState("error");
      }
    };

    loadInitialFlashcards();
  }, []); // Run once on mount

  // Actions (skeleton implementations)

  const generateAiProposals = async (text: string) => {
    try {
      setViewState("generatingAi");
      setError(null);

      const response = await flashcardService.generateAiFlashcards({
        input_text: text,
      });

      setAiProposals(response);
      setViewState("idle");
    } catch (err) {
      console.error("Failed to generate AI proposals:", err);
      setError(
        err instanceof flashcardService.ApiError
          ? err.message
          : "Nie udało się wygenerować propozycji"
      );
      setViewState("error");
    }
  };

  const acceptAiProposals = async (selected: AiProposalDto[]) => {
    if (!aiProposals) {
      console.error("No AI proposals to accept");
      return;
    }

    try {
      setViewState("acceptingProposals");
      setError(null);

      await flashcardService.acceptAiGeneration({
        generation_id: aiProposals.generation_id,
        proposals: selected,
      });

      // Clear proposals
      setAiProposals(null);

      // Reset form (clear textarea)
      setFormResetKey((prev) => prev + 1);

      // Refresh flashcard list to show new items on top
      const response = await flashcardService.fetchFlashcards({
        page: 1,
        page_size: 20,
      });

      setFlashcards(response.data);
      setPagination(response.pagination);
      setViewState("idle");
    } catch (err) {
      console.error("Failed to accept AI proposals:", err);
      setError(
        err instanceof flashcardService.ApiError
          ? err.message
          : "Nie udało się zaakceptować propozycji"
      );
      setViewState("error");
    }
  };

  const rejectAiProposals = () => {
    setAiProposals(null);
    // Reset form (clear textarea)
    setFormResetKey((prev) => prev + 1);
  };

  const createManualFlashcard = async (data: CreateManualFlashcardCommand) => {
    console.log("createManualFlashcard called with:", data);
    // TODO: Implement in step 9
  };

  const updateFlashcard = async (
    id: FlashcardId,
    data: UpdateFlashcardCommand
  ) => {
    console.log("updateFlashcard called with:", id, data);
    // TODO: Implement in step 11
  };

  /**
   * Optimistic delete - remove flashcard from UI immediately
   * Called from FlashcardItem before API call
   */
  const handleOptimisticDelete = (id: FlashcardId) => {
    const flashcard = flashcards.find((f) => f.id === id);
    if (flashcard) {
      // Store flashcard for potential rollback
      setOptimisticallyDeleted((prev) => new Map(prev).set(id, flashcard));
      // Remove from UI
      setFlashcards((prev) => prev.filter((f) => f.id !== id));
    }
  };

  /**
   * Rollback optimistic delete - restore flashcard on error
   * Called from FlashcardItem if API call fails
   */
  const handleDeleteError = (id: FlashcardId) => {
    const backup = optimisticallyDeleted.get(id);
    if (backup) {
      // Restore flashcard to list (at the beginning for visibility)
      setFlashcards((prev) => [backup, ...prev]);
      // Remove from backup
      setOptimisticallyDeleted((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    }
  };

  /**
   * Delete flashcard - cleanup after successful deletion
   * Called from FlashcardItem after API success
   */
  const deleteFlashcard = async (id: FlashcardId) => {
    // Cleanup backup after successful deletion
    setOptimisticallyDeleted((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });

    // Update pagination count (optimistic)
    if (pagination) {
      setPagination({
        ...pagination,
        total_items: Math.max(0, pagination.total_items - 1),
        total_pages: Math.max(
          1,
          Math.ceil(
            Math.max(0, pagination.total_items - 1) / pagination.page_size
          )
        ),
      });
    }
  };

  const loadMoreFlashcards = async () => {
    if (!pagination || pagination.page >= pagination.total_pages) {
      console.log("No more pages to load");
      return;
    }

    try {
      setViewState("loadingList");
      setError(null);

      const nextPage = pagination.page + 1;
      const response = await flashcardService.fetchFlashcards({
        page: nextPage,
        page_size: pagination.page_size,
      });

      // Append new flashcards to existing list
      setFlashcards((prev) => [...prev, ...response.data]);
      setPagination(response.pagination);
      setViewState("idle");
    } catch (err) {
      console.error("Failed to load more flashcards:", err);
      setError(
        err instanceof flashcardService.ApiError
          ? err.message
          : "Nie udało się załadować kolejnych fiszek"
      );
      setViewState("error");
    }
  };

  // Computed values
  const hasMore =
    pagination !== null && pagination.page < pagination.total_pages;

  return {
    // State
    flashcards,
    pagination,
    aiProposals,
    viewState,
    error,
    formResetKey,
    // Computed
    hasMore,
    // Actions
    generateAiProposals,
    acceptAiProposals,
    rejectAiProposals,
    createManualFlashcard,
    updateFlashcard,
    deleteFlashcard,
    loadMoreFlashcards,
    // Optimistic delete helpers
    handleOptimisticDelete,
    handleDeleteError,
  };
}
