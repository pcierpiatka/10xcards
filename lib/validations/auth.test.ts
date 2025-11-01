import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  passwordResetSchema,
  updatePasswordSchema,
} from "./auth";

/**
 * Unit tests for authentication validation schemas
 */

describe("loginSchema", () => {
  describe("GIVEN valid email and password", () => {
    it("WHEN parsing login data THEN should accept valid credentials", () => {
      // Given (Arrange)
      const validInput = {
        email: "user@example.com",
        password: "SomePassword123",
      };

      // When (Act)
      const result = loginSchema.safeParse(validInput);

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });
  });

  describe("GIVEN invalid email format", () => {
    it("WHEN parsing with invalid email THEN should reject with error message", () => {
      // Given (Arrange)
      const invalidInput = {
        email: "not-an-email",
        password: "SomePassword123",
      };

      // When (Act)
      const result = loginSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Nieprawidłowy format e-mail"
        );
        expect(result.error.issues[0].path).toContain("email");
      }
    });
  });

  describe("GIVEN missing email field", () => {
    it("WHEN parsing without email THEN should reject with validation error", () => {
      // Given (Arrange)
      const invalidInput = {
        password: "SomePassword123",
      };

      // When (Act)
      const result = loginSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("email");
      }
    });
  });

  describe("GIVEN empty email string", () => {
    it("WHEN parsing with empty email THEN should reject with error message", () => {
      // Given (Arrange)
      const invalidInput = {
        email: "",
        password: "SomePassword123",
      };

      // When (Act)
      const result = loginSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Nieprawidłowy format e-mail"
        );
        expect(result.error.issues[0].path).toContain("email");
      }
    });
  });

  describe("GIVEN empty password string", () => {
    it("WHEN parsing with empty password THEN should reject with error message", () => {
      // Given (Arrange)
      const invalidInput = {
        email: "user@example.com",
        password: "",
      };

      // When (Act)
      const result = loginSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Hasło jest wymagane");
        expect(result.error.issues[0].path).toContain("password");
      }
    });
  });

  describe("GIVEN missing password field", () => {
    it("WHEN parsing without password THEN should reject with validation error", () => {
      // Given (Arrange)
      const invalidInput = {
        email: "user@example.com",
      };

      // When (Act)
      const result = loginSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("password");
      }
    });
  });

  describe("GIVEN password with 1 character", () => {
    it("WHEN parsing with minimal password THEN should accept (no minimum length for login)", () => {
      // Given (Arrange)
      const validInput = {
        email: "user@example.com",
        password: "a",
      };

      // When (Act)
      const result = loginSchema.safeParse(validInput);

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });
  });
});

describe("registerSchema", () => {
  describe("GIVEN valid registration data", () => {
    it("WHEN parsing registration data THEN should accept valid input with matching passwords", () => {
      // Given (Arrange)
      const validInput = {
        email: "user@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      // When (Act)
      const result = registerSchema.safeParse(validInput);

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });
  });

  describe("GIVEN password without uppercase letter", () => {
    it("WHEN parsing with lowercase-only password THEN should reject with error message", () => {
      // Given (Arrange)
      const invalidInput = {
        email: "user@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      // When (Act)
      const result = registerSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password"
        );
        expect(passwordError?.message).toBe(
          "Hasło musi zawierać wielką literę"
        );
      }
    });
  });

  describe("GIVEN password without lowercase letter", () => {
    it("WHEN parsing with uppercase-only password THEN should reject with error message", () => {
      // Given (Arrange)
      const invalidInput = {
        email: "user@example.com",
        password: "PASSWORD123",
        confirmPassword: "PASSWORD123",
      };

      // When (Act)
      const result = registerSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password"
        );
        expect(passwordError?.message).toBe("Hasło musi zawierać małą literę");
      }
    });
  });

  describe("GIVEN password without digit", () => {
    it("WHEN parsing with letter-only password THEN should reject with error message", () => {
      // Given (Arrange)
      const invalidInput = {
        email: "user@example.com",
        password: "PasswordOnly",
        confirmPassword: "PasswordOnly",
      };

      // When (Act)
      const result = registerSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password"
        );
        expect(passwordError?.message).toBe("Hasło musi zawierać cyfrę");
      }
    });
  });

  describe("GIVEN password shorter than 8 characters", () => {
    it("WHEN parsing with 7-character password THEN should reject with error message", () => {
      // Given (Arrange)
      const invalidInput = {
        email: "user@example.com",
        password: "Pass12",
        confirmPassword: "Pass12",
      };

      // When (Act)
      const result = registerSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password"
        );
        expect(passwordError?.message).toBe("Hasło musi mieć minimum 8 znaków");
      }
    });
  });

  describe("GIVEN mismatched passwords", () => {
    it("WHEN parsing with different password and confirmPassword THEN should reject with error message", () => {
      // Given (Arrange)
      const invalidInput = {
        email: "user@example.com",
        password: "Password123",
        confirmPassword: "DifferentPassword123",
      };

      // When (Act)
      const result = registerSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.issues.find(
          (issue) => issue.path[0] === "confirmPassword"
        );
        expect(confirmPasswordError?.message).toBe(
          "Hasła muszą być identyczne"
        );
      }
    });
  });

  describe("GIVEN invalid email format", () => {
    it("WHEN parsing with invalid email THEN should reject with error message", () => {
      // Given (Arrange)
      const invalidInput = {
        email: "not-an-email",
        password: "Password123",
        confirmPassword: "Password123",
      };

      // When (Act)
      const result = registerSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find(
          (issue) => issue.path[0] === "email"
        );
        expect(emailError?.message).toBe("Nieprawidłowy format e-mail");
      }
    });
  });

  describe("GIVEN missing email field", () => {
    it("WHEN parsing without email THEN should reject with validation error", () => {
      // Given (Arrange)
      const invalidInput = {
        password: "Password123",
        confirmPassword: "Password123",
      };

      // When (Act)
      const result = registerSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find(
          (issue) => issue.path[0] === "email"
        );
        expect(emailError).toBeDefined();
      }
    });
  });

  describe("GIVEN empty email string", () => {
    it("WHEN parsing with empty email THEN should reject with error message", () => {
      // Given (Arrange)
      const invalidInput = {
        email: "",
        password: "Password123",
        confirmPassword: "Password123",
      };

      // When (Act)
      const result = registerSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find(
          (issue) => issue.path[0] === "email"
        );
        expect(emailError?.message).toBe("Nieprawidłowy format e-mail");
      }
    });
  });

  describe("GIVEN missing password field", () => {
    it("WHEN parsing without password THEN should reject with validation error", () => {
      // Given (Arrange)
      const invalidInput = {
        email: "user@example.com",
        confirmPassword: "Password123",
      };

      // When (Act)
      const result = registerSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password"
        );
        expect(passwordError).toBeDefined();
      }
    });
  });

  describe("GIVEN missing confirmPassword field", () => {
    it("WHEN parsing without confirmPassword THEN should reject with validation error", () => {
      // Given (Arrange)
      const invalidInput = {
        email: "user@example.com",
        password: "Password123",
      };

      // When (Act)
      const result = registerSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.issues.find(
          (issue) => issue.path[0] === "confirmPassword"
        );
        expect(confirmPasswordError).toBeDefined();
      }
    });
  });
});

describe("passwordResetSchema", () => {
  describe("GIVEN valid email", () => {
    it("WHEN parsing password reset request THEN should accept valid email", () => {
      // Given (Arrange)
      const validInput = {
        email: "user@example.com",
      };

      // When (Act)
      const result = passwordResetSchema.safeParse(validInput);

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });
  });

  describe("GIVEN invalid email format", () => {
    it("WHEN parsing with invalid email THEN should reject with error message", () => {
      // Given (Arrange)
      const invalidInput = {
        email: "not-an-email",
      };

      // When (Act)
      const result = passwordResetSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Nieprawidłowy format e-mail"
        );
        expect(result.error.issues[0].path).toContain("email");
      }
    });
  });

  describe("GIVEN missing email field", () => {
    it("WHEN parsing without email THEN should reject with validation error", () => {
      // Given (Arrange)
      const invalidInput = {};

      // When (Act)
      const result = passwordResetSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("email");
      }
    });
  });
});

describe("updatePasswordSchema", () => {
  describe("GIVEN valid password update data", () => {
    it("WHEN parsing password update THEN should accept valid matching passwords", () => {
      // Given (Arrange)
      const validInput = {
        password: "NewPassword123",
        confirmPassword: "NewPassword123",
      };

      // When (Act)
      const result = updatePasswordSchema.safeParse(validInput);

      // Then (Assert)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });
  });

  describe("GIVEN password without uppercase letter", () => {
    it("WHEN parsing with lowercase-only password THEN should reject with error message", () => {
      // Given (Arrange)
      const invalidInput = {
        password: "newpassword123",
        confirmPassword: "newpassword123",
      };

      // When (Act)
      const result = updatePasswordSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password"
        );
        expect(passwordError?.message).toBe(
          "Hasło musi zawierać wielką literę"
        );
      }
    });
  });

  describe("GIVEN password without lowercase letter", () => {
    it("WHEN parsing with uppercase-only password THEN should reject with error message", () => {
      // Given (Arrange)
      const invalidInput = {
        password: "NEWPASSWORD123",
        confirmPassword: "NEWPASSWORD123",
      };

      // When (Act)
      const result = updatePasswordSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password"
        );
        expect(passwordError?.message).toBe("Hasło musi zawierać małą literę");
      }
    });
  });

  describe("GIVEN password without digit", () => {
    it("WHEN parsing with letter-only password THEN should reject with error message", () => {
      // Given (Arrange)
      const invalidInput = {
        password: "NewPasswordOnly",
        confirmPassword: "NewPasswordOnly",
      };

      // When (Act)
      const result = updatePasswordSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password"
        );
        expect(passwordError?.message).toBe("Hasło musi zawierać cyfrę");
      }
    });
  });

  describe("GIVEN password shorter than 8 characters", () => {
    it("WHEN parsing with 7-character password THEN should reject with error message", () => {
      // Given (Arrange)
      const invalidInput = {
        password: "New12",
        confirmPassword: "New12",
      };

      // When (Act)
      const result = updatePasswordSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password"
        );
        expect(passwordError?.message).toBe("Hasło musi mieć minimum 8 znaków");
      }
    });
  });

  describe("GIVEN mismatched passwords", () => {
    it("WHEN parsing with different password and confirmPassword THEN should reject with error message", () => {
      // Given (Arrange)
      const invalidInput = {
        password: "NewPassword123",
        confirmPassword: "DifferentPassword123",
      };

      // When (Act)
      const result = updatePasswordSchema.safeParse(invalidInput);

      // Then (Assert)
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.issues.find(
          (issue) => issue.path[0] === "confirmPassword"
        );
        expect(confirmPasswordError?.message).toBe(
          "Hasła muszą być identyczne"
        );
      }
    });
  });
});
