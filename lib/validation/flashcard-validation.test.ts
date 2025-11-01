import { describe, it, expect } from "vitest";
import { flashcardListQuerySchema } from "./flashcard-validation";

/**
 * Unit tests for flashcard validation schemas
 * Following BDD/3x3 methodology with Given-When-Then pattern
 */

describe("flashcardListQuerySchema", () => {
  // TEST-009-001
  describe("GIVEN no query parameters", () => {
    it("WHEN parsing empty object THEN should use default values", () => {
      // Given (Arrange)
      const emptyQuery = {};

      // When (Act)
      const result = flashcardListQuerySchema.safeParse(emptyQuery);

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.page_size).toBe(20);
      }
    });
  });

  // TEST-009-002
  describe("GIVEN valid page number", () => {
    it("WHEN parsing with page=5 THEN should accept and parse as number", () => {
      // Given (Arrange)
      const queryWithPage = {
        page: "5",
      };

      // When (Act)
      const result = flashcardListQuerySchema.safeParse(queryWithPage);

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.page_size).toBe(20); // default
      }
    });
  });

  // TEST-009-003
  describe("GIVEN valid page_size", () => {
    it("WHEN parsing with page_size=50 THEN should accept and parse as number", () => {
      // Given (Arrange)
      const queryWithPageSize = {
        page_size: "50",
      };

      // When (Act)
      const result = flashcardListQuerySchema.safeParse(queryWithPageSize);

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1); // default
        expect(result.data.page_size).toBe(50);
      }
    });
  });

  // TEST-010-001
  describe("GIVEN negative page number", () => {
    it("WHEN parsing with page=-1 THEN should reject with error message", () => {
      // Given (Arrange)
      const queryWithNegativePage = {
        page: "-1",
      };

      // When & Then (Act + Assert)
      // Note: Schema throws Error in transform, not caught by safeParse
      expect(() => {
        flashcardListQuerySchema.parse(queryWithNegativePage);
      }).toThrow("dodatnią liczbą całkowitą");
    });
  });

  // TEST-010-002
  describe("GIVEN zero page number", () => {
    it("WHEN parsing with page=0 THEN should reject with error message", () => {
      // Given (Arrange)
      const queryWithZeroPage = {
        page: "0",
      };

      // When & Then (Act + Assert)
      // Note: Schema throws Error in transform, not caught by safeParse
      expect(() => {
        flashcardListQuerySchema.parse(queryWithZeroPage);
      }).toThrow("dodatnią liczbą całkowitą");
    });
  });

  // TEST-010-003
  describe("GIVEN non-integer page number", () => {
    it("WHEN parsing with page=1.5 THEN should accept (parseInt converts to 1)", () => {
      // Given (Arrange)
      const queryWithFloatPage = {
        page: "1.5",
      };

      // When (Act)
      // Note: parseInt("1.5") = 1 (valid integer), so schema accepts it
      const result = flashcardListQuerySchema.safeParse(queryWithFloatPage);

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1); // parseInt truncates to 1
      }
    });
  });

  // TEST-011-001
  describe("GIVEN page_size less than 1", () => {
    it("WHEN parsing with page_size=0 THEN should reject with error message", () => {
      // Given (Arrange)
      const queryWithInvalidPageSize = {
        page_size: "0",
      };

      // When & Then (Act + Assert)
      // Note: Schema throws Error in transform
      expect(() => {
        flashcardListQuerySchema.parse(queryWithInvalidPageSize);
      }).toThrow("od 1 do 100");
    });
  });

  // TEST-011-002
  describe("GIVEN page_size greater than 100", () => {
    it("WHEN parsing with page_size=101 THEN should reject with error message", () => {
      // Given (Arrange)
      const queryWithLargePageSize = {
        page_size: "101",
      };

      // When & Then (Act + Assert)
      // Note: Schema throws Error in transform
      expect(() => {
        flashcardListQuerySchema.parse(queryWithLargePageSize);
      }).toThrow("od 1 do 100");
    });
  });

  // TEST-011-003
  describe("GIVEN page_size equal to 1 (minimum boundary)", () => {
    it("WHEN parsing with page_size=1 THEN should accept", () => {
      // Given (Arrange)
      const queryWithMinPageSize = {
        page_size: "1",
      };

      // When (Act)
      const result = flashcardListQuerySchema.safeParse(queryWithMinPageSize);

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1); // default
        expect(result.data.page_size).toBe(1); // minimum valid value
      }
    });
  });

  // TEST-012-001
  describe("GIVEN page_size equal to 100 (maximum boundary)", () => {
    it("WHEN parsing with page_size=100 THEN should accept", () => {
      // Given (Arrange)
      const queryWithMaxPageSize = {
        page_size: "100",
      };

      // When (Act)
      const result = flashcardListQuerySchema.safeParse(queryWithMaxPageSize);

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1); // default
        expect(result.data.page_size).toBe(100); // maximum valid value
      }
    });
  });
});
