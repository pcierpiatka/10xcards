import { http, HttpResponse } from "msw";

/**
 * MSW handlers for mocking API requests in tests
 *
 * These handlers intercept HTTP requests during tests and return mock responses.
 * Used for testing components and hooks that interact with API endpoints.
 */

export const handlers = [
  // POST /api/auth/login - success case
  http.post("http://localhost/api/auth/login", async ({ request }) => {
    const body = await request.json();
    const { email, password } = body as { email: string; password: string };

    // Mock successful login
    if (email === "test@example.com" && password === "TestPassword123") {
      return HttpResponse.json(
        {
          user: {
            id: "test-user-id",
            email: email,
          },
          session: {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            expires_at: Date.now() + 3600000,
          },
        },
        { status: 200 }
      );
    }

    // Mock invalid credentials
    return HttpResponse.json(
      { error: "Nieprawidłowy e-mail lub hasło" },
      { status: 401 }
    );
  }),

  // POST /api/auth/register - success case
  http.post("http://localhost/api/auth/register", async ({ request }) => {
    const body = await request.json();
    const { email } = body as {
      email: string;
      password: string;
      confirmPassword: string;
    };

    // Mock existing email error
    if (email === "existing@example.com") {
      return HttpResponse.json(
        { error: "Ten adres e-mail jest już zajęty" },
        { status: 400 }
      );
    }

    // Mock successful registration
    return HttpResponse.json(
      {
        user: {
          id: "new-user-id",
          email: email,
        },
        session: {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expires_at: Date.now() + 3600000,
        },
      },
      { status: 201 }
    );
  }),

  // POST /api/auth/logout - success case
  http.post("http://localhost/api/auth/logout", () => {
    return HttpResponse.json(
      { message: "Wylogowano pomyślnie" },
      { status: 200 }
    );
  }),
];
