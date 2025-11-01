import { describe, it, expect } from "vitest";
import { cn } from "./utils";

/**
 * Unit tests for utility functions
 * Following BDD/3x3 methodology with Given-When-Then pattern
 */

describe("cn utility", () => {
  // TEST-021-001
  describe("GIVEN multiple class names", () => {
    it("WHEN merging classes THEN should combine them", () => {
      // Given (Arrange)
      const class1 = "px-4";
      const class2 = "py-2";

      // When (Act)
      const result = cn(class1, class2);

      // Then (Assert)
      expect(result).toContain("px-4");
      expect(result).toContain("py-2");
    });
  });

  // TEST-021-002
  describe("GIVEN conditional classes", () => {
    it("WHEN merging with booleans THEN should include only truthy", () => {
      // Given (Arrange)
      const baseClass = "base";
      const isActive = true;
      const isDisabled = false;
      const activeClass = isActive && "active";
      const disabledClass = isDisabled && "disabled";

      // When (Act)
      const result = cn(baseClass, activeClass, disabledClass);

      // Then (Assert)
      expect(result).toContain("base");
      expect(result).toContain("active");
      expect(result).not.toContain("disabled");
    });
  });

  // TEST-021-003
  describe("GIVEN conflicting Tailwind classes", () => {
    it("WHEN merging duplicate classes THEN should keep only last one", () => {
      // Given (Arrange)
      const firstPadding = "px-4";
      const secondPadding = "px-8";

      // When (Act)
      const result = cn(firstPadding, secondPadding);

      // Then (Assert)
      // twMerge should keep only px-8 (last one wins)
      expect(result).toBe("px-8");
    });
  });

  // TEST-021-004
  describe("GIVEN array of classes", () => {
    it("WHEN merging array THEN should flatten and combine", () => {
      // Given (Arrange)
      const classArray = ["px-4", "py-2"];

      // When (Act)
      const result = cn(classArray);

      // Then (Assert)
      expect(result).toContain("px-4");
      expect(result).toContain("py-2");
    });
  });

  // TEST-021-005
  describe("GIVEN undefined and null values", () => {
    it("WHEN merging with falsy values THEN should ignore them", () => {
      // Given (Arrange)
      const baseClass = "base";
      const undefinedClass = undefined;
      const nullClass = null;

      // When (Act)
      const result = cn(baseClass, undefinedClass, nullClass);

      // Then (Assert)
      expect(result).toBe("base");
    });
  });
});
