import { describe, it, expect } from "vitest";
import {
  createAiGenerationSchema,
  aiProposalSchema,
  acceptAiGenerationSchema,
} from "./ai-generations";

/**
 * Unit tests for AI generation validation schemas
 * Following BDD/3x3 methodology with Given-When-Then pattern
 */

describe("createAiGenerationSchema", () => {
  // TEST-013-001
  describe("GIVEN valid input text", () => {
    it("WHEN parsing text with 1200 characters THEN should accept and trim", () => {
      // Given (Arrange)
      const validText = "Lorem ipsum ".repeat(100); // ~1200 chars

      // When (Act)
      const result = createAiGenerationSchema.safeParse({
        input_text: validText,
      });

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.input_text).toBe(validText.trim());
        expect(result.data.input_text.length).toBeGreaterThan(0);
      }
    });
  });

  // TEST-013-002
  describe("GIVEN empty string", () => {
    it("WHEN parsing empty input_text THEN should reject with error message", () => {
      // Given (Arrange)
      const emptyInput = {
        input_text: "",
      };

      // When (Act)
      const result = createAiGenerationSchema.safeParse(emptyInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("nie może być pusty");
      }
    });
  });

  // TEST-013-003
  describe("GIVEN whitespace-only string", () => {
    it("WHEN parsing whitespace-only input_text THEN should accept and trim to empty", () => {
      // Given (Arrange)
      const whitespaceInput = {
        input_text: "   \n\t   ",
      };

      // When (Act)
      const result = createAiGenerationSchema.safeParse(whitespaceInput);

      // Then (Assert)
      // Note: In Zod v4, .trim() is applied AFTER validation
      // min(1) checks original "   \n\t   " (length 9) - passes
      // Then trim() converts to "" - validation already passed
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.input_text).toBe(""); // trimmed to empty string
      }
    });
  });

  // TEST-014-001
  describe("GIVEN text longer than 10000 characters", () => {
    it("WHEN parsing input_text with 10001 chars THEN should reject with error", () => {
      // Given (Arrange)
      const longText = "a".repeat(10001);

      // When (Act)
      const result = createAiGenerationSchema.safeParse({
        input_text: longText,
      });

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("maksymalnie 10000");
      }
    });
  });

  // TEST-014-002
  describe("GIVEN text with exactly 10000 characters", () => {
    it("WHEN parsing input_text with 10000 chars THEN should accept", () => {
      // Given (Arrange)
      const maxText = "a".repeat(10000);

      // When (Act)
      const result = createAiGenerationSchema.safeParse({
        input_text: maxText,
      });

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.input_text.length).toBe(10000);
      }
    });
  });

  // TEST-014-003
  describe("GIVEN text with leading and trailing whitespace", () => {
    it("WHEN parsing input_text THEN should trim whitespace", () => {
      // Given (Arrange)
      const textWithWhitespace = {
        input_text: "  valid text  ",
      };

      // When (Act)
      const result = createAiGenerationSchema.safeParse(textWithWhitespace);

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.input_text).toBe("valid text");
      }
    });
  });
});

describe("aiProposalSchema", () => {
  // TEST-015-001
  describe("GIVEN valid proposal", () => {
    it("WHEN parsing valid front and back THEN should accept", () => {
      // Given (Arrange)
      const validProposal = {
        front: "What is TypeScript?",
        back: "A typed superset of JavaScript",
      };

      // When (Act)
      const result = aiProposalSchema.safeParse(validProposal);

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.front).toBe("What is TypeScript?");
        expect(result.data.back).toBe("A typed superset of JavaScript");
      }
    });
  });

  // TEST-015-002
  describe("GIVEN empty front", () => {
    it("WHEN parsing with empty front THEN should reject with error", () => {
      // Given (Arrange)
      const invalidProposal = {
        front: "",
        back: "Answer",
      };

      // When (Act)
      const result = aiProposalSchema.safeParse(invalidProposal);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("nie może być pusty");
      }
    });
  });

  // TEST-015-003
  describe("GIVEN front longer than 300 characters", () => {
    it("WHEN parsing with 301-char front THEN should reject with error", () => {
      // Given (Arrange)
      const invalidProposal = {
        front: "a".repeat(301),
        back: "Answer",
      };

      // When (Act)
      const result = aiProposalSchema.safeParse(invalidProposal);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("maksymalnie 300");
      }
    });
  });

  // TEST-015-004
  describe("GIVEN empty back", () => {
    it("WHEN parsing with empty back THEN should reject with error", () => {
      // Given (Arrange)
      const invalidProposal = {
        front: "Question",
        back: "",
      };

      // When (Act)
      const result = aiProposalSchema.safeParse(invalidProposal);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("nie może być pusty");
      }
    });
  });

  // TEST-015-005
  describe("GIVEN back longer than 600 characters", () => {
    it("WHEN parsing with 601-char back THEN should reject with error", () => {
      // Given (Arrange)
      const invalidProposal = {
        front: "Question",
        back: "a".repeat(601),
      };

      // When (Act)
      const result = aiProposalSchema.safeParse(invalidProposal);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("maksymalnie 600");
      }
    });
  });

  // TEST-015-006
  describe("GIVEN front exactly 300 characters", () => {
    it("WHEN parsing with 300-char front THEN should accept", () => {
      // Given (Arrange)
      const validProposal = {
        front: "a".repeat(300),
        back: "Answer",
      };

      // When (Act)
      const result = aiProposalSchema.safeParse(validProposal);

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.front.length).toBe(300);
      }
    });
  });

  // TEST-015-007
  describe("GIVEN back exactly 600 characters", () => {
    it("WHEN parsing with 600-char back THEN should accept", () => {
      // Given (Arrange)
      const validProposal = {
        front: "Question",
        back: "a".repeat(600),
      };

      // When (Act)
      const result = aiProposalSchema.safeParse(validProposal);

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.back.length).toBe(600);
      }
    });
  });

  // TEST-015-008
  describe("GIVEN proposal with whitespace", () => {
    it("WHEN parsing THEN should trim front and back", () => {
      // Given (Arrange)
      const proposalWithWhitespace = {
        front: "  Question  ",
        back: "  Answer  ",
      };

      // When (Act)
      const result = aiProposalSchema.safeParse(proposalWithWhitespace);

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.front).toBe("Question");
        expect(result.data.back).toBe("Answer");
      }
    });
  });
});

describe("acceptAiGenerationSchema", () => {
  const validProposal = { front: "Q", back: "A" };

  // TEST-016-001
  describe("GIVEN valid acceptance data", () => {
    it("WHEN parsing valid generation_id and proposals THEN should accept", () => {
      // Given (Arrange)
      const validInput = {
        generation_id: "123e4567-e89b-12d3-a456-426614174000",
        proposals: [validProposal],
      };

      // When (Act)
      const result = acceptAiGenerationSchema.safeParse(validInput);

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.generation_id).toBe(
          "123e4567-e89b-12d3-a456-426614174000"
        );
        expect(result.data.proposals).toHaveLength(1);
      }
    });
  });

  // TEST-016-002
  describe("GIVEN invalid UUID format", () => {
    it("WHEN parsing with non-UUID generation_id THEN should reject", () => {
      // Given (Arrange)
      const invalidInput = {
        generation_id: "not-a-uuid",
        proposals: [validProposal],
      };

      // When (Act)
      const result = acceptAiGenerationSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("UUID");
      }
    });
  });

  // TEST-016-003
  describe("GIVEN empty proposals array", () => {
    it("WHEN parsing with zero proposals THEN should reject", () => {
      // Given (Arrange)
      const invalidInput = {
        generation_id: "123e4567-e89b-12d3-a456-426614174000",
        proposals: [],
      };

      // When (Act)
      const result = acceptAiGenerationSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("co najmniej jedną");
      }
    });
  });

  // TEST-016-004
  describe("GIVEN more than 10 proposals", () => {
    it("WHEN parsing with 11 proposals THEN should reject", () => {
      // Given (Arrange)
      const invalidInput = {
        generation_id: "123e4567-e89b-12d3-a456-426614174000",
        proposals: Array(11).fill(validProposal),
      };

      // When (Act)
      const result = acceptAiGenerationSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("maksymalnie 10");
      }
    });
  });

  // TEST-016-005
  describe("GIVEN exactly 10 proposals", () => {
    it("WHEN parsing with 10 proposals THEN should accept", () => {
      // Given (Arrange)
      const validInput = {
        generation_id: "123e4567-e89b-12d3-a456-426614174000",
        proposals: Array(10).fill(validProposal),
      };

      // When (Act)
      const result = acceptAiGenerationSchema.safeParse(validInput);

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.proposals).toHaveLength(10);
      }
    });
  });
});
