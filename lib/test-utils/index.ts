/**
 * Test utilities barrel export
 *
 * Central place to import all test helpers and utilities.
 * Usage:
 *   import { renderWithProviders, server, handlers } from '@/lib/test-utils';
 */

// React Testing Library utilities
export * from "./test-render";

// MSW (Mock Service Worker)
export { server } from "../../vitest.setup";
export { handlers } from "./msw-handlers";

// Supabase mocks
export * from "./supabase-mock";
export * from "./supabase-server-mock";

// API testing utilities
export * from "./api-test-helpers";
