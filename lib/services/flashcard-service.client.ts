import type {
  AcceptAiGenerationCommand,
  AiGenerationResponseDto,
  CreateAiGenerationCommand,
  CreateManualFlashcardCommand,
  CreateManualFlashcardResponseDto,
  FlashcardId,
  FlashcardListQuery,
  FlashcardListResponseDto,
  UpdateFlashcardCommand,
  UpdateFlashcardResponseDto,
} from "@/lib/dto/types";

/**
 * API Service for flashcard operations
 * Handles all HTTP communication with backend API
 */

const API_BASE = "/api";

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.message || "Wystąpił błąd",
      data.code
    );
  }

  return data;
}

/**
 * Fetch paginated list of flashcards
 * GET /api/flashcards?page=1&page_size=20
 */
export async function fetchFlashcards(
  query: FlashcardListQuery = {}
): Promise<FlashcardListResponseDto> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", query.page.toString());
  if (query.page_size) params.set("page_size", query.page_size.toString());

  const url = `${API_BASE}/flashcards?${params.toString()}`;
  return apiFetch<FlashcardListResponseDto>(url);
}

/**
 * Generate AI flashcard proposals
 * POST /api/ai/generations
 */
export async function generateAiFlashcards(
  command: CreateAiGenerationCommand
): Promise<AiGenerationResponseDto> {
  return apiFetch<AiGenerationResponseDto>(`${API_BASE}/ai/generations`, {
    method: "POST",
    body: JSON.stringify(command),
  });
}

/**
 * Accept selected AI proposals and create flashcards
 * POST /api/ai/generations/accept
 * Returns: 204 No Content
 */
export async function acceptAiGeneration(
  command: AcceptAiGenerationCommand
): Promise<undefined> {
  return apiFetch<undefined>(`${API_BASE}/ai/generations/accept`, {
    method: "POST",
    body: JSON.stringify(command),
  });
}

/**
 * Create manual flashcard
 * POST /api/flashcards
 */
export async function createManualFlashcard(
  command: CreateManualFlashcardCommand
): Promise<CreateManualFlashcardResponseDto> {
  return apiFetch<CreateManualFlashcardResponseDto>(`${API_BASE}/flashcards`, {
    method: "POST",
    body: JSON.stringify(command),
  });
}

/**
 * Update existing flashcard
 * PATCH /api/flashcards/{id}
 */
export async function updateFlashcard(
  id: FlashcardId,
  command: UpdateFlashcardCommand
): Promise<UpdateFlashcardResponseDto> {
  return apiFetch<UpdateFlashcardResponseDto>(`${API_BASE}/flashcards/${id}`, {
    method: "PATCH",
    body: JSON.stringify(command),
  });
}

/**
 * Delete flashcard
 * DELETE /api/flashcards/{id}
 * Returns: 204 No Content
 */
export async function deleteFlashcard(id: FlashcardId): Promise<undefined> {
  return apiFetch<undefined>(`${API_BASE}/flashcards/${id}`, {
    method: "DELETE",
  });
}
