import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/lib/test-utils";
import { RegisterForm } from "./RegisterForm";
import { useAuth } from "@/hooks/useAuth";

/**
 * Component tests for RegisterForm
 *
 * Tests user-facing behavior: rendering, loading states, error display, form submission
 * Integration with useAuth hook is mocked to isolate component logic
 */

// Mock useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    register: vi.fn(),
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

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GIVEN RegisterForm component", () => {
    it("WHEN rendering THEN should display all form fields and link", () => {
      // Act
      renderWithProviders(<RegisterForm />);

      // Assert - Heading
      expect(
        screen.getByRole("heading", { name: /utwórz konto/i })
      ).toBeInTheDocument();

      // Assert - Form fields (3 pola)
      expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^hasło$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/potwierdź hasło/i)).toBeInTheDocument();

      // Assert - Submit button
      expect(
        screen.getByRole("button", { name: /zarejestruj się/i })
      ).toBeInTheDocument();

      // Assert - Navigation link to login
      expect(
        screen.getByRole("link", { name: /zaloguj się/i })
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
      renderWithProviders(<RegisterForm />);

      // Assert - Submit button shows loading text
      const submitButton = screen.getByRole("button", {
        name: /tworzenie konta/i,
      });
      expect(submitButton).toHaveTextContent("Tworzenie konta...");

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
        error: "Ten adres e-mail jest już zajęty",
      });

      // Act
      renderWithProviders(<RegisterForm />);

      // Assert - Error message is displayed
      const errorMessage = screen.getByTestId("register-error");
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent(
        "Ten adres e-mail jest już zajęty"
      );
    });
  });

  describe("GIVEN form submission", () => {
    it("WHEN user fills form and clicks submit THEN should call register function", async () => {
      // Arrange - Mock register function
      const mockRegister = vi.fn();
      vi.mocked(useAuth).mockReturnValue({
        login: vi.fn(),
        register: mockRegister,
        logout: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();

      // Act - Render and fill form
      renderWithProviders(<RegisterForm />);

      const emailInput = screen.getByLabelText(/e-mail/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/potwierdź hasło/i);
      const submitButton = screen.getByRole("button", {
        name: /zarejestruj się/i,
      });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "TestPassword123");
      await user.type(confirmPasswordInput, "TestPassword123");
      await user.click(submitButton);

      // Assert - register function was called with correct arguments
      expect(mockRegister).toHaveBeenCalledTimes(1);
      expect(mockRegister).toHaveBeenCalledWith(
        "test@example.com",
        "TestPassword123",
        "TestPassword123"
      );
    });
  });
});
