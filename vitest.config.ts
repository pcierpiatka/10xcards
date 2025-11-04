import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["node_modules/**", "e2e/**", ".next/**"],
    environmentOptions: {
      jsdom: {
        url: "http://localhost",
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "lib/validation/**/*.{ts,tsx}",
        "lib/validations/**/*.{ts,tsx}",
        "lib/integrations/**/*.{ts,tsx}",
        "lib/errors/**/*.{ts,tsx}",
        "lib/api/**/*.{ts,tsx}",
        "lib/utils.ts",
        "hooks/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "app/api/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "lib/test-utils/**",
        "lib/db/**",
        "lib/dto/**",
        "lib/types/**",
        "lib/constants.ts",
        "lib/services/**",
        "node_modules/**",
        ".next/**",
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
