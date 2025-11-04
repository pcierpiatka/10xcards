import { vi } from "vitest";

/**
 * Mock Supabase server client for API route testing
 *
 * Provides mock implementations of Supabase server methods used in API routes.
 * Use this to avoid hitting real Supabase API during API integration tests.
 */

/**
 * Mock server Supabase client with commonly used auth methods
 */
export const mockSupabaseServerClient = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
    resetPasswordForEmail: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  })),
};

/**
 * Create a fresh mock Supabase server client
 * Useful when you need to reset mocks between tests
 */
export function createMockSupabaseServerClient() {
  return {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      updateUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
    })),
  };
}

/**
 * Reset all mock functions
 * Call this in beforeEach to ensure test isolation
 */
export function resetSupabaseServerMocks() {
  Object.values(mockSupabaseServerClient.auth).forEach((mockFn) => {
    if (typeof mockFn === "function" && "mockReset" in mockFn) {
      mockFn.mockReset();
    }
  });
  if ("mockReset" in mockSupabaseServerClient.from) {
    mockSupabaseServerClient.from.mockReset();
  }
}
