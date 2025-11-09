/**
 * Tests for public API exports (barrel export)
 *
 * Verifies that all exports are accessible via '@/lib/features'
 */

import { describe, it, expect } from "vitest";
import * as FeatureFlags from "../index";

describe("Feature Flags Public API", () => {
  describe("exports", () => {
    it("exports isFeatureEnabled function", () => {
      expect(FeatureFlags.isFeatureEnabled).toBeDefined();
      expect(typeof FeatureFlags.isFeatureEnabled).toBe("function");
    });

    it("exports getEnvironment function", () => {
      expect(FeatureFlags.getEnvironment).toBeDefined();
      expect(typeof FeatureFlags.getEnvironment).toBe("function");
    });

    it("exports requireFeature function", () => {
      expect(FeatureFlags.requireFeature).toBeDefined();
      expect(typeof FeatureFlags.requireFeature).toBe("function");
    });

    it("exports FeatureFlag component", () => {
      expect(FeatureFlags.FeatureFlag).toBeDefined();
      expect(typeof FeatureFlags.FeatureFlag).toBe("function");
    });

    it("exports useFeature hook", () => {
      expect(FeatureFlags.useFeature).toBeDefined();
      expect(typeof FeatureFlags.useFeature).toBe("function");
    });
  });

  describe("individual imports", () => {
    it("allows importing isFeatureEnabled individually", async () => {
      const { isFeatureEnabled } = await import("../index");
      expect(isFeatureEnabled).toBeDefined();
    });

    it("allows importing requireFeature individually", async () => {
      const { requireFeature } = await import("../index");
      expect(requireFeature).toBeDefined();
    });

    it("allows importing FeatureFlag individually", async () => {
      const { FeatureFlag } = await import("../index");
      expect(FeatureFlag).toBeDefined();
    });

    it("allows importing useFeature individually", async () => {
      const { useFeature } = await import("../index");
      expect(useFeature).toBeDefined();
    });
  });

  describe("alias import from @/lib/features", () => {
    it("supports alias import", async () => {
      const featureModule = await import("@/lib/features");

      expect(featureModule.isFeatureEnabled).toBeDefined();
      expect(featureModule.requireFeature).toBeDefined();
      expect(featureModule.FeatureFlag).toBeDefined();
      expect(featureModule.useFeature).toBeDefined();
    });
  });
});
