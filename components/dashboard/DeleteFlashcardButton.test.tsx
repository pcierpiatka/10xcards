import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { DeleteFlashcardButton } from "./DeleteFlashcardButton";

/**
 * Unit tests for DeleteFlashcardButton component
 *
 * Tests rendering, interactions, and accessibility features.
 */

describe("DeleteFlashcardButton", () => {
  describe("GIVEN a delete button", () => {
    describe("WHEN the button is rendered", () => {
      it("THEN should display trash icon", () => {
        // Arrange
        const mockOnDeleteClick = vi.fn();

        // Act
        render(
          <DeleteFlashcardButton
            flashcardId="test-id"
            onDeleteClick={mockOnDeleteClick}
          />
        );

        // Assert - Button should be in document
        const button = screen.getByRole("button", { name: /usuń fiszkę/i });
        expect(button).toBeInTheDocument();
      });

      it("THEN should have accessible aria-label", () => {
        // Arrange
        const mockOnDeleteClick = vi.fn();

        // Act
        render(
          <DeleteFlashcardButton
            flashcardId="test-id"
            onDeleteClick={mockOnDeleteClick}
          />
        );

        // Assert
        const button = screen.getByRole("button", { name: /usuń fiszkę/i });
        expect(button).toHaveAttribute("aria-label", "Usuń fiszkę");
      });
    });

    describe("WHEN the button is clicked", () => {
      it("THEN should call onDeleteClick callback", async () => {
        // Arrange
        const user = userEvent.setup();
        const mockOnDeleteClick = vi.fn();

        render(
          <DeleteFlashcardButton
            flashcardId="test-id"
            onDeleteClick={mockOnDeleteClick}
          />
        );

        // Act
        const button = screen.getByRole("button", { name: /usuń fiszkę/i });
        await user.click(button);

        // Assert
        expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
      });
    });

    describe("WHEN the button is disabled", () => {
      it("THEN should be disabled and not clickable", async () => {
        // Arrange
        const user = userEvent.setup();
        const mockOnDeleteClick = vi.fn();

        render(
          <DeleteFlashcardButton
            flashcardId="test-id"
            onDeleteClick={mockOnDeleteClick}
            disabled={true}
          />
        );

        // Act
        const button = screen.getByRole("button", { name: /usuń fiszkę/i });
        await user.click(button);

        // Assert
        expect(button).toBeDisabled();
        expect(mockOnDeleteClick).not.toHaveBeenCalled();
      });
    });

    describe("WHEN the button is enabled (default)", () => {
      it("THEN should not be disabled", () => {
        // Arrange
        const mockOnDeleteClick = vi.fn();

        // Act
        render(
          <DeleteFlashcardButton
            flashcardId="test-id"
            onDeleteClick={mockOnDeleteClick}
          />
        );

        // Assert
        const button = screen.getByRole("button", { name: /usuń fiszkę/i });
        expect(button).not.toBeDisabled();
      });
    });
  });
});
