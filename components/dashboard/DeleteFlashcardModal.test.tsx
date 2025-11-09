import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { DeleteFlashcardModal } from "./DeleteFlashcardModal";

/**
 * Unit tests for DeleteFlashcardModal component
 *
 * Tests modal rendering, confirmation/cancellation, and loading states.
 */

describe("DeleteFlashcardModal", () => {
  describe("GIVEN a delete confirmation modal", () => {
    describe("WHEN the modal is closed", () => {
      it("THEN should not render modal content", () => {
        // Arrange
        const mockOnConfirm = vi.fn();
        const mockOnOpenChange = vi.fn();

        // Act
        render(
          <DeleteFlashcardModal
            open={false}
            onOpenChange={mockOnOpenChange}
            flashcardId="test-id"
            onConfirm={mockOnConfirm}
          />
        );

        // Assert - Modal content should not be visible
        expect(
          screen.queryByText(/czy na pewno chcesz usunąć/i)
        ).not.toBeInTheDocument();
      });
    });

    describe("WHEN the modal is open", () => {
      it("THEN should display confirmation title and description", () => {
        // Arrange
        const mockOnConfirm = vi.fn();
        const mockOnOpenChange = vi.fn();

        // Act
        render(
          <DeleteFlashcardModal
            open={true}
            onOpenChange={mockOnOpenChange}
            flashcardId="test-id"
            onConfirm={mockOnConfirm}
          />
        );

        // Assert - Title and description should be visible
        expect(
          screen.getByText(/czy na pewno chcesz usunąć tę fiszkę/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/ta akcja jest nieodwracalna/i)
        ).toBeInTheDocument();
      });

      it("THEN should display Cancel and Delete buttons", () => {
        // Arrange
        const mockOnConfirm = vi.fn();
        const mockOnOpenChange = vi.fn();

        // Act
        render(
          <DeleteFlashcardModal
            open={true}
            onOpenChange={mockOnOpenChange}
            flashcardId="test-id"
            onConfirm={mockOnConfirm}
          />
        );

        // Assert
        expect(
          screen.getByRole("button", { name: /anuluj/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /usuń/i })
        ).toBeInTheDocument();
      });
    });

    describe("WHEN Cancel button is clicked", () => {
      it("THEN should call onOpenChange with false", async () => {
        // Arrange
        const user = userEvent.setup();
        const mockOnConfirm = vi.fn();
        const mockOnOpenChange = vi.fn();

        render(
          <DeleteFlashcardModal
            open={true}
            onOpenChange={mockOnOpenChange}
            flashcardId="test-id"
            onConfirm={mockOnConfirm}
          />
        );

        // Act
        const cancelButton = screen.getByRole("button", { name: /anuluj/i });
        await user.click(cancelButton);

        // Assert
        await waitFor(() => {
          expect(mockOnOpenChange).toHaveBeenCalledWith(false);
        });
        expect(mockOnConfirm).not.toHaveBeenCalled();
      });
    });

    describe("WHEN Delete button is clicked", () => {
      it("THEN should call onConfirm with flashcard ID", async () => {
        // Arrange
        const user = userEvent.setup();
        const mockOnConfirm = vi.fn().mockResolvedValue(undefined);
        const mockOnOpenChange = vi.fn();

        render(
          <DeleteFlashcardModal
            open={true}
            onOpenChange={mockOnOpenChange}
            flashcardId="test-flashcard-id"
            onConfirm={mockOnConfirm}
          />
        );

        // Act
        const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
        await user.click(deleteButton);

        // Assert
        await waitFor(() => {
          expect(mockOnConfirm).toHaveBeenCalledWith("test-flashcard-id");
        });
      });
    });

    describe("WHEN isDeleting is true", () => {
      it("THEN should show loading state with spinner", () => {
        // Arrange
        const mockOnConfirm = vi.fn();
        const mockOnOpenChange = vi.fn();

        // Act
        render(
          <DeleteFlashcardModal
            open={true}
            onOpenChange={mockOnOpenChange}
            flashcardId="test-id"
            onConfirm={mockOnConfirm}
            isDeleting={true}
          />
        );

        // Assert - Should show "Usuwanie..." text
        expect(screen.getByText(/usuwanie\.\.\./i)).toBeInTheDocument();
      });

      it("THEN should disable both buttons", () => {
        // Arrange
        const mockOnConfirm = vi.fn();
        const mockOnOpenChange = vi.fn();

        // Act
        render(
          <DeleteFlashcardModal
            open={true}
            onOpenChange={mockOnOpenChange}
            flashcardId="test-id"
            onConfirm={mockOnConfirm}
            isDeleting={true}
          />
        );

        // Assert
        const cancelButton = screen.getByRole("button", { name: /anuluj/i });
        const deleteButton = screen.getByRole("button", { name: /usuwanie/i });

        expect(cancelButton).toBeDisabled();
        expect(deleteButton).toBeDisabled();
      });
    });

    describe("WHEN isDeleting is false (default)", () => {
      it("THEN should show Delete text without spinner", () => {
        // Arrange
        const mockOnConfirm = vi.fn();
        const mockOnOpenChange = vi.fn();

        // Act
        render(
          <DeleteFlashcardModal
            open={true}
            onOpenChange={mockOnOpenChange}
            flashcardId="test-id"
            onConfirm={mockOnConfirm}
            isDeleting={false}
          />
        );

        // Assert
        expect(
          screen.getByRole("button", { name: /^usuń$/i })
        ).toBeInTheDocument();
        expect(screen.queryByText(/usuwanie\.\.\./i)).not.toBeInTheDocument();
      });
    });
  });
});
