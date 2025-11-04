import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";

/**
 * Custom render function that wraps components with providers
 *
 * Use this instead of RTL's render for components that need context providers.
 * For now it's a simple wrapper, but can be extended with:
 * - Router context
 * - Theme providers
 * - Auth context
 * - Query client providers
 */
export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, {
    wrapper: ({ children }) => <>{children}</>,
    ...options,
  });
}

// Re-export everything from React Testing Library
export * from "@testing-library/react";
