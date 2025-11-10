import { describe, it, expect, beforeEach, vi } from "vitest";
import { FlashcardService } from "./flashcard-service.server";
import { NotFoundError } from "@/lib/errors";
import type { ServerSupabaseClient } from "@/lib/db/supabase.server";

/**
 * Unit tests for FlashcardService
 * Following BDD/3x3 methodology with Given-When-Then pattern
 *
 * Test coverage for update() method:
 * - Happy path: update front/back, source_type transitions
 * - Error cases: not found, auth failures, database errors
 */

describe("FlashcardService.update()", () => {
  let mockSupabase: ServerSupabaseClient;
  let flashcardService: FlashcardService;
  const userId = "user-123";
  const flashcardId = "flashcard-456";

  beforeEach(() => {
    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn(),
    } as unknown as ServerSupabaseClient;

    flashcardService = new FlashcardService(mockSupabase);
  });

  // TEST-UPDATE-001
  describe("GIVEN manual flashcard exists", () => {
    it("WHEN updating both fields THEN should update and preserve manual source_type", async () => {
      // Given (Arrange)
      const updateData = {
        front: "Updated front",
        back: "Updated back",
      };

      // Mock SELECT query - returns manual flashcard
      const selectMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  flashcard_id: flashcardId,
                  source_type: "manual",
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock UPDATE query
      const updateMock = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    flashcard_id: flashcardId,
                    front: "Updated front",
                    back: "Updated back",
                    source_type: "manual",
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(selectMock())
        .mockReturnValueOnce(updateMock());

      // When (Act)
      const result = await flashcardService.update(
        flashcardId,
        userId,
        updateData
      );

      // Then (Assert)
      expect(result).toEqual({
        id: flashcardId,
        front: "Updated front",
        back: "Updated back",
        source_type: "manual",
      });
      expect(result.source_type).toBe("manual"); // Should stay manual
    });
  });

  // TEST-UPDATE-002
  describe("GIVEN AI flashcard exists", () => {
    it("WHEN updating THEN should change source_type to ai-edited", async () => {
      // Given (Arrange)
      const updateData = {
        front: "Edited front",
        back: "Edited back",
      };

      // Mock SELECT query - returns AI flashcard
      const selectMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  flashcard_id: flashcardId,
                  source_type: "ai",
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock UPDATE query - returns ai-edited
      const updateMock = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    flashcard_id: flashcardId,
                    front: "Edited front",
                    back: "Edited back",
                    source_type: "ai-edited",
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(selectMock())
        .mockReturnValueOnce(updateMock());

      // When (Act)
      const result = await flashcardService.update(
        flashcardId,
        userId,
        updateData
      );

      // Then (Assert)
      expect(result.source_type).toBe("ai-edited"); // Changed from 'ai'
    });
  });

  // TEST-UPDATE-003
  describe("GIVEN ai-edited flashcard exists", () => {
    it("WHEN updating THEN should keep source_type as ai-edited", async () => {
      // Given (Arrange)
      const updateData = {
        front: "Re-edited front",
        back: "Re-edited back",
      };

      // Mock SELECT query - returns ai-edited flashcard
      const selectMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  flashcard_id: flashcardId,
                  source_type: "ai-edited",
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock UPDATE query
      const updateMock = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    flashcard_id: flashcardId,
                    front: "Re-edited front",
                    back: "Re-edited back",
                    source_type: "ai-edited",
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(selectMock())
        .mockReturnValueOnce(updateMock());

      // When (Act)
      const result = await flashcardService.update(
        flashcardId,
        userId,
        updateData
      );

      // Then (Assert)
      expect(result.source_type).toBe("ai-edited"); // Stays ai-edited
    });
  });

  // TEST-UPDATE-004
  describe("GIVEN flashcard does not exist", () => {
    it("WHEN updating THEN should throw NotFoundError", async () => {
      // Given (Arrange)
      const updateData = {
        front: "Test",
        back: "Test",
      };

      // Mock SELECT query - returns null (not found)
      const selectMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(
        selectMock()
      );

      // When & Then (Act + Assert)
      await expect(
        flashcardService.update(flashcardId, userId, updateData)
      ).rejects.toThrow(NotFoundError);
    });
  });

  // TEST-UPDATE-005
  describe("GIVEN SELECT query fails", () => {
    it("WHEN updating THEN should throw NotFoundError", async () => {
      // Given (Arrange)
      const updateData = {
        front: "Test",
        back: "Test",
      };

      // Mock SELECT query - returns error
      const selectMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  message: "Database error",
                  code: "PGRST116",
                  hint: null,
                },
              }),
            }),
          }),
        }),
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce(
        selectMock()
      );

      // When & Then (Act + Assert)
      await expect(
        flashcardService.update(flashcardId, userId, updateData)
      ).rejects.toThrow(NotFoundError);
    });
  });

  // TEST-UPDATE-006
  describe("GIVEN UPDATE query fails", () => {
    it("WHEN updating THEN should throw Error with Polish message", async () => {
      // Given (Arrange)
      const updateData = {
        front: "Test",
        back: "Test",
      };

      // Mock SELECT query - succeeds
      const selectMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  flashcard_id: flashcardId,
                  source_type: "manual",
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock UPDATE query - fails
      const updateMock = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: {
                    message: "Database error",
                    code: "23505",
                    hint: "Duplicate key",
                  },
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabase.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(selectMock())
        .mockReturnValueOnce(updateMock());

      // When & Then (Act + Assert)
      await expect(
        flashcardService.update(flashcardId, userId, updateData)
      ).rejects.toThrow("Nie udało się zaktualizować fiszki");
    });
  });
});
