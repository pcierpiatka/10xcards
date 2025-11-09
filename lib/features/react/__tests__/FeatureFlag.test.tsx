/**
 * Tests for <FeatureFlag> component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeatureFlag } from "../FeatureFlag";

describe("FeatureFlag", () => {
  const originalEnv = process.env.ENV_NAME;

  beforeEach(() => {
    // Clear console to avoid cluttering test output
    vi.spyOn(console, "warn").mockImplementation(vi.fn());
    vi.spyOn(console, "error").mockImplementation(vi.fn());
  });

  afterEach(() => {
    // Restore original ENV_NAME
    if (originalEnv !== undefined) {
      process.env.ENV_NAME = originalEnv;
    } else {
      delete process.env.ENV_NAME;
    }
    vi.restoreAllMocks();
  });

  describe("when feature is enabled", () => {
    beforeEach(() => {
      // Local environment has all flags enabled
      process.env.ENV_NAME = "local";
    });

    it("renders children when feature is enabled", () => {
      render(
        <FeatureFlag name="auth.login">
          <div>Login Form</div>
        </FeatureFlag>
      );

      expect(screen.getByText("Login Form")).toBeInTheDocument();
    });

    it("does not render fallback when feature is enabled", () => {
      render(
        <FeatureFlag name="auth.login" fallback={<div>Coming Soon</div>}>
          <div>Login Form</div>
        </FeatureFlag>
      );

      expect(screen.getByText("Login Form")).toBeInTheDocument();
      expect(screen.queryByText("Coming Soon")).not.toBeInTheDocument();
    });

    it("renders multiple children", () => {
      render(
        <FeatureFlag name="flashcards.list">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </FeatureFlag>
      );

      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
      expect(screen.getByText("Item 3")).toBeInTheDocument();
    });
  });

  describe("when feature is disabled", () => {
    beforeEach(() => {
      // Production environment has auth.register disabled
      process.env.ENV_NAME = "production";
    });

    it("does not render children when feature is disabled", () => {
      render(
        <FeatureFlag name="auth.register">
          <div>Register Form</div>
        </FeatureFlag>
      );

      expect(screen.queryByText("Register Form")).not.toBeInTheDocument();
    });

    it("renders fallback when provided and feature is disabled", () => {
      render(
        <FeatureFlag name="auth.register" fallback={<div>Coming Soon</div>}>
          <div>Register Form</div>
        </FeatureFlag>
      );

      expect(screen.queryByText("Register Form")).not.toBeInTheDocument();
      expect(screen.getByText("Coming Soon")).toBeInTheDocument();
    });

    it("renders null when no fallback provided and feature is disabled", () => {
      const { container } = render(
        <FeatureFlag name="auth.register">
          <div>Register Form</div>
        </FeatureFlag>
      );

      // Should render nothing (Fragment with null renders no DOM nodes)
      expect(container.firstChild).toBeNull();
    });
  });

  describe("integration environment", () => {
    beforeEach(() => {
      process.env.ENV_NAME = "integration";
    });

    it("renders auth features", () => {
      render(
        <FeatureFlag name="auth.login">
          <div>Login</div>
        </FeatureFlag>
      );

      expect(screen.getByText("Login")).toBeInTheDocument();
    });

    it("renders flashcard features", () => {
      render(
        <FeatureFlag name="flashcards.create.ai">
          <div>Generate Flashcards</div>
        </FeatureFlag>
      );

      expect(screen.getByText("Generate Flashcards")).toBeInTheDocument();
    });

    it("shows fallback message", () => {
      render(
        <FeatureFlag
          name="auth.login"
          fallback={<div>Feature coming soon!</div>}
        >
          <div>Login</div>
        </FeatureFlag>
      );

      expect(screen.getByText("Login")).toBeInTheDocument();
      expect(
        screen.queryByText("Feature coming soon!")
      ).not.toBeInTheDocument();
    });
  });

  describe("real-world usage patterns", () => {
    beforeEach(() => {
      process.env.ENV_NAME = "local";
    });

    it("works in navigation links", () => {
      render(
        <nav>
          <a href="/dashboard">Dashboard</a>
          <FeatureFlag name="flashcards.list">
            <a href="/flashcards">Flashcards</a>
          </FeatureFlag>
        </nav>
      );

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Flashcards")).toBeInTheDocument();
    });

    it("works with conditional sections", () => {
      render(
        <div>
          <h1>Dashboard</h1>
          <FeatureFlag name="flashcards.create.ai">
            <section>
              <h2>AI Generation Section</h2>
              <button>Generate Flashcards</button>
            </section>
          </FeatureFlag>
        </div>
      );

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("AI Generation Section")).toBeInTheDocument();
      expect(screen.getByText("Generate Flashcards")).toBeInTheDocument();
    });

    it("works with nested components", () => {
      const ViewButton = () => <button>View</button>;
      const FlashcardsWidget = () => (
        <div>
          <input placeholder="Search" />
          <ViewButton />
        </div>
      );

      render(
        <FeatureFlag name="flashcards.list">
          <FlashcardsWidget />
        </FeatureFlag>
      );

      expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
      expect(screen.getByText("View")).toBeInTheDocument();
    });
  });
});
