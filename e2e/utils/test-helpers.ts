import { Page, expect } from "@playwright/test";

/**
 * Generate unique test user email
 * Uses timestamp + random string to ensure uniqueness across parallel tests
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Fill registration form
 * @param page - Playwright page object
 * @param email - User email
 * @param password - User password (will be used for both password and confirmPassword)
 */
export async function fillRegisterForm(
  page: Page,
  email: string,
  password: string
) {
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill(password);
  await page.getByTestId("register-confirm-password").fill(password);
}

/**
 * Fill login form
 * @param page - Playwright page object
 * @param email - User email
 * @param password - User password
 */
export async function fillLoginForm(
  page: Page,
  email: string,
  password: string
) {
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
}

/**
 * Wait for navigation to dashboard and verify URL
 * @param page - Playwright page object
 */
export async function waitForDashboard(page: Page) {
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  await expect(page).toHaveURL(/\/dashboard/);
}

/**
 * Create test user via registration flow
 * This helper registers a new user and logs them out, ready for login tests
 * @param page - Playwright page object
 * @returns Object with email and password of created user
 */
export async function createTestUser(page: Page) {
  const testEmail = generateTestEmail();
  const testPassword = "TestPassword123";

  await page.goto("/register");
  await fillRegisterForm(page, testEmail, testPassword);
  await page.getByTestId("register-submit").click();
  await waitForDashboard(page);

  // Logout to prepare for login test (POST request)
  await page.request.post("/api/auth/logout");

  // Clear all cookies from browser context
  await page.context().clearCookies();

  // Wait a moment for session to clear
  await page.waitForTimeout(500);

  return { email: testEmail, password: testPassword };
}
