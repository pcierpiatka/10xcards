import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/lib/test-utils";
import { LoginForm } from "./LoginForm";
import { useAuth } from "@/hooks/useAuth";

/**
 * Component tests for LoginForm
 *
 * Tests user-facing behavior: rendering, loading states, error display, form submission
 * Integration with useAuth hook is mocked to isolate component logic
 */

// Mock useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    login: vi.fn(),
    isLoading: false,
    error: null,
  })),
}));

// Mock Next.js Link to avoid router dependencies
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GIVEN LoginForm component", () => {
    it("WHEN rendering THEN should display all form fields and links", () => {
      // Act
      renderWithProviders(<LoginForm />);

      // Assert - Heading
      expect(
        screen.getByRole("heading", { name: /zaloguj się/i })
      ).toBeInTheDocument();

      // Assert - Form fields
      expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument();

      // Assert - Submit button
      expect(
        screen.getByRole("button", { name: /zaloguj się/i })
      ).toBeInTheDocument();

      // Assert - Navigation links
      expect(
        screen.getByRole("link", { name: /zarejestruj się/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /zapomniałeś hasła/i })
      ).toBeInTheDocument();
    });
  });

  describe("GIVEN loading state", () => {
    it("WHEN isLoading is true THEN should show loading state and disabled button", () => {
      // Arrange - Mock useAuth with loading state
      vi.mocked(useAuth).mockReturnValue({
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
        isLoading: true,
        error: null,
      });

      // Act
      renderWithProviders(<LoginForm />);

      // Assert - Submit button shows loading text
      const submitButton = screen.getByRole("button", { name: /logowanie/i });
      expect(submitButton).toHaveTextContent("Logowanie...");

      // Assert - Submit button is disabled
      expect(submitButton).toBeDisabled();
    });
  });

  describe("GIVEN error state", () => {
    it("WHEN error prop is provided THEN should display error message", () => {
      // Arrange - Mock useAuth with error
      vi.mocked(useAuth).mockReturnValue({
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
        isLoading: false,
        error: "Nieprawidłowy e-mail lub hasło",
      });

      // Act
      renderWithProviders(<LoginForm />);

      // Assert - Error message is displayed
      const errorMessage = screen.getByTestId("login-error");
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent("Nieprawidłowy e-mail lub hasło");
    });
  });

  describe("GIVEN form submission", () => {
    it("WHEN user fills form and clicks submit THEN should call login function", async () => {
      // Arrange - Mock login function
      const mockLogin = vi.fn();
      vi.mocked(useAuth).mockReturnValue({
        login: mockLogin,
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();

      // Act - Render and fill form
      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/e-mail/i);
      const passwordInput = screen.getByLabelText(/hasło/i);
      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "TestPassword123");
      await user.click(submitButton);

      // Assert - login function was called with correct arguments
      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(mockLogin).toHaveBeenCalledWith(
        "test@example.com",
        "TestPassword123"
      );
    });
  });
});
