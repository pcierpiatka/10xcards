import { test, expect } from "@playwright/test";
import {
  generateTestEmail,
  fillRegisterForm,
  waitForDashboard,
} from "../utils/test-helpers";
import { deleteTestUser } from "../utils/db-helpers";

/**
 * E2E tests for user registration
 *
 * These tests cover critical user flows only. Edge cases and validation
 * are tested at lower levels (unit/integration tests).
 */
test.describe("User Registration", () => {
  let testEmail: string;

  test.beforeEach(() => {
    testEmail = generateTestEmail();
  });

  test.afterEach(async () => {
    // Cleanup: remove test user from database
    await deleteTestUser(testEmail);
  });

  test("should register new user successfully and redirect to dashboard", async ({
    page,
  }) => {
    // Navigate to register page
    await page.goto("/register");

    // Verify page loaded
    await expect(page.locator("h1")).toContainText("Utwórz konto");

    // Fill registration form
    const password = "TestPassword123";
    await fillRegisterForm(page, testEmail, password);

    // Submit form
    await page.getByTestId("register-submit").click();

    // Should redirect to dashboard
    await waitForDashboard(page);

    // Should be authenticated (no redirect back to login)
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
