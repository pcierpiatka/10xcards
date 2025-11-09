/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { FlashcardItem } from "./FlashcardItem";
import type { FlashcardViewModel } from "@/lib/types/viewModels";
import * as flashcardService from "@/lib/services/flashcard-service.client";

/**
 * Integration tests for FlashcardItem delete functionality
 *
 * Tests the full delete flow including:
 * - Modal interaction
 * - API call
 * - Optimistic UI
 * - Rollback on error
 * - Toast notifications
 */

// Mock the flashcard service
vi.mock("@/lib/services/flashcard-service.client", () => ({
  deleteFlashcard: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      message: string
    ) {
      super(message);
      this.name = "ApiError";
    }
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("FlashcardItem - Delete Integration", () => {
  const mockFlashcard: FlashcardViewModel = {
    id: "test-flashcard-id",
    front: "Test Question",
    back: "Test Answer",
    source_type: "manual",
    created_at: new Date().toISOString(),
  };

  const mockCallbacks = {
    onDelete: vi.fn(),
    onOptimisticDelete: vi.fn(),
    onDeleteError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GIVEN a flashcard with delete functionality", () => {
    describe("WHEN user clicks delete button", () => {
      it("THEN should open confirmation modal", async () => {
        // Arrange
        const user = userEvent.setup();
        render(<FlashcardItem flashcard={mockFlashcard} {...mockCallbacks} />);

        // Act - Click delete button
        const deleteButton = screen.getByRole("button", {
          name: /usuń fiszkę/i,
        });
        await user.click(deleteButton);

        // Assert - Modal should be visible
        await waitFor(() => {
          expect(
            screen.getByText(/czy na pewno chcesz usunąć tę fiszkę/i)
          ).toBeInTheDocument();
        });
      });
    });

    describe("WHEN user confirms deletion AND API succeeds", () => {
      it("THEN should execute optimistic delete, call API, and show success toast", async () => {
        // Arrange
        const user = userEvent.setup();
        vi.mocked(flashcardService.deleteFlashcard).mockResolvedValue(
          undefined
        );

        render(<FlashcardItem flashcard={mockFlashcard} {...mockCallbacks} />);

        // Act - Open modal
        const deleteButton = screen.getByRole("button", {
          name: /usuń fiszkę/i,
        });
        await user.click(deleteButton);

        // Act - Confirm deletion
        const confirmButton = await screen.findByRole("button", {
          name: /^usuń$/i,
        });
        await user.click(confirmButton);

        // Assert - Optimistic delete called immediately
        expect(mockCallbacks.onOptimisticDelete).toHaveBeenCalledWith(
          "test-flashcard-id"
        );

        // Assert - API called
        await waitFor(() => {
          expect(flashcardService.deleteFlashcard).toHaveBeenCalledWith(
            "test-flashcard-id"
          );
        });

        // Assert - Success callback called
        await waitFor(() => {
          expect(mockCallbacks.onDelete).toHaveBeenCalledWith(
            "test-flashcard-id"
          );
        });

        // Assert - Error callback NOT called
        expect(mockCallbacks.onDeleteError).not.toHaveBeenCalled();

        // Assert - Success toast shown
        const { toast } = await import("sonner");
        expect(toast.success).toHaveBeenCalledWith("Fiszka została usunięta");
      });
    });

    describe("WHEN user confirms deletion AND API returns 500 error", () => {
      it("THEN should rollback optimistic delete and show error toast", async () => {
        // Arrange
        const user = userEvent.setup();
        const mockError = new flashcardService.ApiError(
          500,
          "Internal Server Error"
        );
        vi.mocked(flashcardService.deleteFlashcard).mockRejectedValue(
          mockError
        );

        render(<FlashcardItem flashcard={mockFlashcard} {...mockCallbacks} />);

        // Act - Open modal and confirm
        const deleteButton = screen.getByRole("button", {
          name: /usuń fiszkę/i,
        });
        await user.click(deleteButton);

        const confirmButton = await screen.findByRole("button", {
          name: /^usuń$/i,
        });
        await user.click(confirmButton);

        // Assert - Optimistic delete called
        expect(mockCallbacks.onOptimisticDelete).toHaveBeenCalled();

        // Assert - Error callback called for rollback
        await waitFor(() => {
          expect(mockCallbacks.onDeleteError).toHaveBeenCalledWith(
            "test-flashcard-id",
            mockError
          );
        });

        // Assert - Success callback NOT called
        expect(mockCallbacks.onDelete).not.toHaveBeenCalled();

        // Assert - Error toast shown
        const { toast } = await import("sonner");
        expect(toast.error).toHaveBeenCalledWith(
          "Nie udało się usunąć fiszki. Spróbuj ponownie"
        );
      });
    });

    describe("WHEN user confirms deletion AND API returns 404 error", () => {
      it("THEN should call error callback and show 404 toast", async () => {
        // Arrange
        const user = userEvent.setup();
        const mockError = new flashcardService.ApiError(404, "Not Found");
        vi.mocked(flashcardService.deleteFlashcard).mockRejectedValue(
          mockError
        );

        render(<FlashcardItem flashcard={mockFlashcard} {...mockCallbacks} />);

        // Act
        const deleteButton = screen.getByRole("button", {
          name: /usuń fiszkę/i,
        });
        await user.click(deleteButton);

        const confirmButton = await screen.findByRole("button", {
          name: /^usuń$/i,
        });
        await user.click(confirmButton);

        // Assert
        await waitFor(() => {
          expect(mockCallbacks.onDeleteError).toHaveBeenCalledWith(
            "test-flashcard-id",
            mockError
          );
        });

        const { toast } = await import("sonner");
        expect(toast.error).toHaveBeenCalledWith(
          "Fiszka nie istnieje lub została już usunięta"
        );
      });
    });

    describe("WHEN user confirms deletion AND API returns 401 error", () => {
      it("THEN should call error callback and show session expired toast", async () => {
        // Arrange
        const user = userEvent.setup();
        const mockError = new flashcardService.ApiError(401, "Unauthorized");
        vi.mocked(flashcardService.deleteFlashcard).mockRejectedValue(
          mockError
        );

        render(<FlashcardItem flashcard={mockFlashcard} {...mockCallbacks} />);

        // Act
        const deleteButton = screen.getByRole("button", {
          name: /usuń fiszkę/i,
        });
        await user.click(deleteButton);

        const confirmButton = await screen.findByRole("button", {
          name: /^usuń$/i,
        });
        await user.click(confirmButton);

        // Assert
        await waitFor(() => {
          expect(mockCallbacks.onDeleteError).toHaveBeenCalled();
        });

        const { toast } = await import("sonner");
        expect(toast.error).toHaveBeenCalledWith(
          "Sesja wygasła. Zaloguj się ponownie"
        );
      });
    });

    describe("WHEN user cancels deletion in modal", () => {
      it("THEN should NOT call any callbacks or API", async () => {
        // Arrange
        const user = userEvent.setup();
        render(<FlashcardItem flashcard={mockFlashcard} {...mockCallbacks} />);

        // Act - Open modal
        const deleteButton = screen.getByRole("button", {
          name: /usuń fiszkę/i,
        });
        await user.click(deleteButton);

        // Act - Click cancel
        const cancelButton = await screen.findByRole("button", {
          name: /anuluj/i,
        });
        await user.click(cancelButton);

        // Assert - No callbacks called
        await waitFor(() => {
          expect(mockCallbacks.onOptimisticDelete).not.toHaveBeenCalled();
          expect(mockCallbacks.onDelete).not.toHaveBeenCalled();
          expect(mockCallbacks.onDeleteError).not.toHaveBeenCalled();
          expect(flashcardService.deleteFlashcard).not.toHaveBeenCalled();
        });

        // Assert - Modal should be closed
        expect(
          screen.queryByText(/czy na pewno chcesz usunąć/i)
        ).not.toBeInTheDocument();
      });
    });

    describe("WHEN delete is in progress", () => {
      it("THEN should call optimistic delete immediately while API is pending", async () => {
        // Arrange
        const user = userEvent.setup();
        let resolveDelete: (() => void) | undefined;
        const deletePromise = new Promise<void>((resolve) => {
          resolveDelete = () => resolve();
        });

        vi.mocked(flashcardService.deleteFlashcard).mockReturnValue(
          deletePromise as any
        );

        render(<FlashcardItem flashcard={mockFlashcard} {...mockCallbacks} />);

        // Act - Open modal
        const deleteButton = screen.getByRole("button", {
          name: /usuń fiszkę/i,
        });
        await user.click(deleteButton);

        const confirmButton = await screen.findByRole("button", {
          name: /^usuń$/i,
        });

        // Act - Confirm deletion
        await user.click(confirmButton);

        // Assert - Optimistic delete called immediately (before API resolves)
        expect(mockCallbacks.onOptimisticDelete).toHaveBeenCalledWith(
          "test-flashcard-id"
        );

        // Assert - API called but not resolved yet
        expect(flashcardService.deleteFlashcard).toHaveBeenCalled();
        expect(mockCallbacks.onDelete).not.toHaveBeenCalled(); // Not yet

        // Cleanup - Resolve the promise to avoid hanging test
        if (resolveDelete) {
          resolveDelete();
        }
        await waitFor(() => {
          expect(mockCallbacks.onDelete).toHaveBeenCalled();
        });
      });
    });
  });
});
