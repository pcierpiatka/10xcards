import { vi } from "vitest";

/**
 * Mock Supabase client for testing
 *
 * Provides mock implementations of Supabase auth methods used in tests.
 * Use this to avoid hitting real Supabase API during unit/integration tests.
 */

export const mockSupabaseClient = {
  auth: {
    setSession: vi.fn(),
    signOut: vi.fn(),
    updateUser: vi.fn(),
    getUser: vi.fn(),
    getSession: vi.fn(),
  },
};

/**
 * Create a fresh mock Supabase client
 * Useful when you need to reset mocks between tests
 */
export function createMockSupabaseClient() {
  return {
    auth: {
      setSession: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
  };
}

/**
 * Reset all mock functions
 * Call this in beforeEach to ensure test isolation
 */
export function resetSupabaseMocks() {
  Object.values(mockSupabaseClient.auth).forEach((mockFn) => {
    if (typeof mockFn === "function" && "mockReset" in mockFn) {
      mockFn.mockReset();
    }
  });
}
