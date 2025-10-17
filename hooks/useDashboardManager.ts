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

  const deleteFlashcard = async (id: FlashcardId) => {
    console.log("deleteFlashcard called with:", id);
    // TODO: Implement in step 12
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
  };
}
