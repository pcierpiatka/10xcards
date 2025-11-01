import { describe, it, expect, vi } from "vitest";
import { ApiError, ApiErrors, errorResponse } from "./error-responses";

/**
 * Unit tests for API error handling
 * Following BDD/3x3 methodology with Given-When-Then pattern
 */

describe("ApiError", () => {
  // TEST-017-001
  describe("GIVEN status code and message", () => {
    it("WHEN creating ApiError THEN should set properties correctly", () => {
      // Given (Arrange)
      const statusCode = 401;
      const message = "Unauthorized";

      // When (Act)
      const error = new ApiError(statusCode, message);

      // Then (Assert)
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Unauthorized");
      expect(error.name).toBe("ApiError");
    });
  });

  // TEST-017-002
  describe("GIVEN ApiError instance", () => {
    it("WHEN accessing stack trace THEN should be defined", () => {
      // Given (Arrange)
      const error = new ApiError(500, "Server error");

      // When (Act)
      const stack = error.stack;

      // Then (Assert)
      expect(stack).toBeDefined();
      expect(stack).toContain("ApiError");
    });
  });
});

describe("ApiErrors factory", () => {
  // TEST-018-001
  describe("GIVEN Unauthorized error needed", () => {
    it("WHEN accessing ApiErrors.Unauthorized THEN should return 401 error", () => {
      // Given & When (Arrange & Act)
      const error = ApiErrors.Unauthorized;

      // Then (Assert)
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain("zalogowany");
    });
  });

  // TEST-018-002
  describe("GIVEN Forbidden error needed", () => {
    it("WHEN accessing ApiErrors.Forbidden THEN should return 403 error", () => {
      // Given & When (Arrange & Act)
      const error = ApiErrors.Forbidden;

      // Then (Assert)
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain("Brak dostępu");
    });
  });

  // TEST-018-003
  describe("GIVEN NotFound error needed", () => {
    it("WHEN accessing ApiErrors.NotFound THEN should return 404 error", () => {
      // Given & When (Arrange & Act)
      const error = ApiErrors.NotFound;

      // Then (Assert)
      expect(error.statusCode).toBe(404);
      expect(error.message).toContain("nie został znaleziony");
    });
  });

  // TEST-018-004
  describe("GIVEN custom BadRequest needed", () => {
    it("WHEN calling ApiErrors.BadRequest() THEN should return 400 error with custom message", () => {
      // Given (Arrange)
      const customMessage = "Invalid input";

      // When (Act)
      const error = ApiErrors.BadRequest(customMessage);

      // Then (Assert)
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Invalid input");
    });
  });

  // TEST-018-005
  describe("GIVEN InternalServerError needed", () => {
    it("WHEN accessing ApiErrors.InternalServerError THEN should return 500 error", () => {
      // Given & When (Arrange & Act)
      const error = ApiErrors.InternalServerError;

      // Then (Assert)
      expect(error.statusCode).toBe(500);
      expect(error.message).toContain("błąd serwera");
    });
  });
});

describe("errorResponse", () => {
  // TEST-019-001
  describe("GIVEN ApiError instance", () => {
    it("WHEN calling errorResponse THEN should return NextResponse with correct status and body", async () => {
      // Given (Arrange)
      const error = new ApiError(404, "Not found");

      // When (Act)
      const response = errorResponse(error);

      // Then (Assert)
      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body).toEqual({ error: "Not found" });
    });
  });

  // TEST-019-002
  describe("GIVEN standard Error instance", () => {
    it("WHEN calling errorResponse THEN should return 500 with generic message", async () => {
      // Given (Arrange)
      const error = new Error("Something broke");

      // When (Act)
      const response = errorResponse(error);

      // Then (Assert)
      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.error).toContain("błąd serwera");
    });
  });

  // TEST-019-003
  describe("GIVEN non-Error object", () => {
    it("WHEN calling errorResponse with string THEN should return 500", async () => {
      // Given (Arrange)
      const error = "String error";

      // When (Act)
      const response = errorResponse(error);

      // Then (Assert)
      expect(response.status).toBe(500);
    });
  });

  // TEST-019-004
  describe("GIVEN null or undefined", () => {
    it("WHEN calling errorResponse with null THEN should return 500", async () => {
      // Given (Arrange)
      const error = null;

      // When (Act)
      const response = errorResponse(error);

      // Then (Assert)
      expect(response.status).toBe(500);
    });
  });

  // TEST-019-005
  describe("GIVEN unexpected error", () => {
    it("WHEN calling errorResponse THEN should log error to console", () => {
      // Given (Arrange)
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {
          // Mock implementation
        });
      const error = new Error("Unexpected");

      // When (Act)
      errorResponse(error);

      // Then (Assert)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Unexpected API error:",
        error
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
