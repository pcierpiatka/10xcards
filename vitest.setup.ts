import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "./lib/test-utils/msw-handlers";
import { fetch, Headers, Request, Response } from "undici";

/**
 * Setup fetch polyfill for MSW in Node.js environment
 * MSW 2.x requires fetch to be available globally
 */
// @ts-expect-error - undici types don't match global fetch perfectly
global.fetch = fetch;
// @ts-expect-error - undici types don't match global Headers perfectly
global.Headers = Headers;
// @ts-expect-error - undici types don't match global Request perfectly
global.Request = Request;
// @ts-expect-error - undici types don't match global Response perfectly
global.Response = Response;

/**
 * Setup Mock Service Worker for API mocking in tests
 */
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset handlers after each test to ensure test isolation
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());
