import { test, expect } from "@playwright/test";
import {
  createTestUser,
  fillLoginForm,
  waitForDashboard,
} from "../utils/test-helpers";
import { deleteTestUser } from "../utils/db-helpers";

/**
 * E2E tests for user login
 *
 * These tests cover critical user flows only. Edge cases and validation
 * are tested at lower levels (unit/integration tests).
 */
test.describe("User Login", () => {
  let testEmail: string;
  let testPassword: string;

  test.beforeEach(async ({ page }) => {
    // Setup: create test user via registration
    const user = await createTestUser(page);
    testEmail = user.email;
    testPassword = user.password;
  });

  test.afterEach(async () => {
    // Cleanup: remove test user from database
    await deleteTestUser(testEmail);
  });

  test("should login successfully with valid credentials", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");

    // Verify page loaded
    await expect(page.locator("h1")).toContainText("Zaloguj się");

    // Fill login form
    await fillLoginForm(page, testEmail, testPassword);

    // Submit form
    await page.getByTestId("login-submit").click();

    // Should redirect to dashboard
    await waitForDashboard(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should redirect authenticated user from login to dashboard", async ({
    page,
  }) => {
    // Login first
    await page.goto("/login");
    await fillLoginForm(page, testEmail, testPassword);
    await page.getByTestId("login-submit").click();
    await waitForDashboard(page);

    // Try to access login page again (while authenticated)
    await page.goto("/login");

    // Should redirect to dashboard (middleware protection)
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
