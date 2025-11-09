import { test, expect } from "@playwright/test";
import { createTestUser, login, waitForDashboard } from "../utils/test-helpers";
import { deleteTestUser } from "../utils/db-helpers";

/**
 * E2E tests for deleting flashcards
 *
 * Tests the critical user flow:
 * 1. User navigates to dashboard
 * 2. Clicks delete button on flashcard
 * 3. Confirms deletion in modal
 * 4. Flashcard is removed from list
 */
test.describe("Delete Flashcard", () => {
  let testEmail: string;
  let testPassword: string;

  test.beforeEach(async ({ page }) => {
    // Setup: create test user
    const user = await createTestUser(page);
    testEmail = user.email;
    testPassword = user.password;

    // Login and navigate to dashboard
    await login(page, testEmail, testPassword);
    await waitForDashboard(page);
  });

  test.afterEach(async () => {
    // Cleanup: remove test user from database
    await deleteTestUser(testEmail);
  });

  test("should delete flashcard after confirmation", async ({ page }) => {
    // Given: User is on dashboard with at least one flashcard
    // (assuming test user has flashcards from seed/fixtures or manual creation)

    // Check if there are any flashcards
    const flashcardCards = page.locator('[data-testid="flashcard-item"]');
    const initialCount = await flashcardCards.count();

    // Skip test if no flashcards exist
    if (initialCount === 0) {
      test.skip();
      return;
    }

    // When: User clicks delete button on first flashcard
    const firstFlashcard = flashcardCards.first();
    const deleteButton = firstFlashcard.locator(
      'button[aria-label="Usuń fiszkę"]'
    );
    await deleteButton.click();

    // Then: Confirmation modal should appear
    await expect(
      page.getByText(/czy na pewno chcesz usunąć tę fiszkę/i)
    ).toBeVisible();

    // When: User confirms deletion
    const confirmButton = page.getByRole("button", { name: /^usuń$/i });
    await confirmButton.click();

    // Then: Modal should close
    await expect(
      page.getByText(/czy na pewno chcesz usunąć tę fiszkę/i)
    ).not.toBeVisible();

    // Then: Flashcard should be removed from list
    await expect(flashcardCards).toHaveCount(initialCount - 1);

    // Then: Success toast should appear
    await expect(page.getByText(/fiszka została usunięta/i)).toBeVisible();
  });

  test("should NOT delete flashcard when canceling in modal", async ({
    page,
  }) => {
    // Given: User is on dashboard with at least one flashcard
    const flashcardCards = page.locator('[data-testid="flashcard-item"]');
    const initialCount = await flashcardCards.count();

    if (initialCount === 0) {
      test.skip();
      return;
    }

    // When: User clicks delete button
    const firstFlashcard = flashcardCards.first();
    const deleteButton = firstFlashcard.locator(
      'button[aria-label="Usuń fiszkę"]'
    );
    await deleteButton.click();

    // Then: Modal appears
    await expect(
      page.getByText(/czy na pewno chcesz usunąć tę fiszkę/i)
    ).toBeVisible();

    // When: User cancels deletion
    const cancelButton = page.getByRole("button", { name: /anuluj/i });
    await cancelButton.click();

    // Then: Modal should close
    await expect(
      page.getByText(/czy na pewno chcesz usunąć tę fiszkę/i)
    ).not.toBeVisible();

    // Then: Flashcard count should remain unchanged
    await expect(flashcardCards).toHaveCount(initialCount);

    // Then: No success toast should appear
    await expect(page.getByText(/fiszka została usunięta/i)).not.toBeVisible();
  });

  test("should close modal when pressing Escape key", async ({ page }) => {
    // Given: User is on dashboard with flashcards
    const flashcardCards = page.locator('[data-testid="flashcard-item"]');
    const initialCount = await flashcardCards.count();

    if (initialCount === 0) {
      test.skip();
      return;
    }

    // When: User opens delete modal
    const deleteButton = flashcardCards
      .first()
      .locator('button[aria-label="Usuń fiszkę"]');
    await deleteButton.click();

    // Then: Modal is visible
    await expect(
      page.getByText(/czy na pewno chcesz usunąć tę fiszkę/i)
    ).toBeVisible();

    // When: User presses Escape
    await page.keyboard.press("Escape");

    // Then: Modal should close
    await expect(
      page.getByText(/czy na pewno chcesz usunąć tę fiszkę/i)
    ).not.toBeVisible();

    // Then: Flashcard count unchanged
    await expect(flashcardCards).toHaveCount(initialCount);
  });
});
