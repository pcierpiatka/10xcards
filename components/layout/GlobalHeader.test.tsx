/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { GlobalHeader } from "./GlobalHeader";

/**
 * Unit tests for GlobalHeader component
 *
 * Tests rendering in authenticated and unauthenticated states:
 * - Email display visibility
 * - UserMenu visibility
 * - Navigation links
 * - Auth buttons (login/register)
 */

// Mock Supabase server client
vi.mock("@/lib/db/supabase.server", () => ({
  createClient: vi.fn(),
}));

// Mock Next.js Link to avoid router dependencies
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock UserMenu component
vi.mock("./UserMenu", () => ({
  UserMenu: ({ email }: { email: string }) => (
    <div data-testid="user-menu">UserMenu({email})</div>
  ),
}));

// Mock Button component
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    asChild,
    ...props
  }: {
    children: React.ReactNode;
    asChild?: boolean;
    variant?: string;
  }) => (asChild ? <>{children}</> : <button {...props}>{children}</button>),
}));

describe("GlobalHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GIVEN authenticated user", () => {
    beforeEach(async () => {
      // Mock session with authenticated user
      const { createClient } = await import("@/lib/db/supabase.server");
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: {
                user: {
                  id: "test-user-id",
                  email: "test@example.com",
                },
                access_token: "mock-token",
              },
            },
            error: null,
          }),
        },
      } as any);
    });

    it("WHEN rendering THEN should display user email", async () => {
      // Act
      const component = await GlobalHeader();
      render(component);

      // Assert - Email should be visible
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });

    it("WHEN rendering THEN should display UserMenu with email", async () => {
      // Act
      const component = await GlobalHeader();
      render(component);

      // Assert - UserMenu should be rendered
      const userMenu = screen.getByTestId("user-menu");
      expect(userMenu).toBeInTheDocument();
      expect(userMenu).toHaveTextContent("UserMenu(test@example.com)");
    });

    it("WHEN rendering THEN should display Dashboard link", async () => {
      // Act
      const component = await GlobalHeader();
      render(component);

      // Assert - Dashboard link should be visible
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute("href", "/dashboard");
    });

    it("WHEN rendering THEN should NOT display login/register buttons", async () => {
      // Act
      const component = await GlobalHeader();
      render(component);

      // Assert - Auth buttons should not be visible
      expect(
        screen.queryByRole("link", { name: /zaloguj się/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /zarejestruj się/i })
      ).not.toBeInTheDocument();
    });

    it("WHEN rendering THEN should display 10xCards logo", async () => {
      // Act
      const component = await GlobalHeader();
      render(component);

      // Assert - Logo should be visible
      const logo = screen.getByText("10xCards");
      expect(logo).toBeInTheDocument();
    });
  });

  describe("GIVEN unauthenticated user", () => {
    beforeEach(async () => {
      // Mock no session
      const { createClient } = await import("@/lib/db/supabase.server");
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: null,
            },
            error: null,
          }),
        },
      } as any);
    });

    it("WHEN rendering THEN should NOT display user email", async () => {
      // Act
      const component = await GlobalHeader();
      render(component);

      // Assert - No email should be visible
      expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    });

    it("WHEN rendering THEN should NOT display UserMenu", async () => {
      // Act
      const component = await GlobalHeader();
      render(component);

      // Assert - UserMenu should not be rendered
      expect(screen.queryByTestId("user-menu")).not.toBeInTheDocument();
    });

    it("WHEN rendering THEN should NOT display Dashboard link", async () => {
      // Act
      const component = await GlobalHeader();
      render(component);

      // Assert - Dashboard link should not be visible
      expect(
        screen.queryByRole("link", { name: /dashboard/i })
      ).not.toBeInTheDocument();
    });

    it("WHEN rendering THEN should display login button", async () => {
      // Act
      const component = await GlobalHeader();
      render(component);

      // Assert - Login button should be visible
      const loginLink = screen.getByRole("link", { name: /zaloguj się/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/login");
    });

    it("WHEN rendering THEN should display register button", async () => {
      // Act
      const component = await GlobalHeader();
      render(component);

      // Assert - Register button should be visible
      const registerLink = screen.getByRole("link", {
        name: /zarejestruj się/i,
      });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute("href", "/register");
    });

    it("WHEN rendering THEN should display 10xCards logo", async () => {
      // Act
      const component = await GlobalHeader();
      render(component);

      // Assert - Logo should be visible
      const logo = screen.getByText("10xCards");
      expect(logo).toBeInTheDocument();
    });
  });

  describe("GIVEN session with null email (edge case)", () => {
    beforeEach(async () => {
      // Mock session with user but no email
      const { createClient } = await import("@/lib/db/supabase.server");
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: {
                user: {
                  id: "test-user-id",
                  email: null, // Edge case: no email
                },
                access_token: "mock-token",
              },
            },
            error: null,
          }),
        },
      } as any);
    });

    it("WHEN rendering THEN should still display UserMenu with fallback", async () => {
      // Act
      const component = await GlobalHeader();
      render(component);

      // Assert - UserMenu should still render with fallback "User"
      const userMenu = screen.getByTestId("user-menu");
      expect(userMenu).toBeInTheDocument();
      expect(userMenu).toHaveTextContent("UserMenu(User)");
    });
  });
});
