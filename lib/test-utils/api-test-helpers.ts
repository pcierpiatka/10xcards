import { NextRequest } from "next/server";

/**
 * API testing utilities
 *
 * Helper functions for testing Next.js API route handlers.
 * These utilities create mock NextRequest objects and handle responses.
 */

/**
 * Create a mock NextRequest for testing API routes
 *
 * @param url - The URL path (e.g., "/api/auth/login")
 * @param options - Request options (method, body, headers)
 * @returns NextRequest object
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = "GET", body, headers = {} } = options;

  const requestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  // Create a full URL (required by NextRequest)
  const fullUrl = `http://localhost${url}`;

  return new NextRequest(fullUrl, requestInit);
}

/**
 * Parse JSON response from NextResponse
 *
 * @param response - NextResponse object
 * @returns Parsed JSON data
 */
export async function parseJsonResponse<T = unknown>(
  response: Response
): Promise<T> {
  return (await response.json()) as T;
}

/**
 * Helper to test API route error responses
 *
 * @param response - NextResponse object
 * @returns Object with status and error message
 */
export async function parseErrorResponse(response: Response): Promise<{
  status: number;
  error: string;
}> {
  const data = await parseJsonResponse<{ error: string }>(response);
  return {
    status: response.status,
    error: data.error,
  };
}
