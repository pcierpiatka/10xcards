# Auth Test Coverage - Unit, Integration & Component Tests

**Data utworzenia**: 2025-11-03
**Framework**: Vitest ^2.1.9 + React Testing Library ^16.3.0
**Zakres**: useAuth hook + LoginForm/RegisterForm components + API routes
**Cel**: Prawidłowe pokrycie testami według test pyramid

---

## 1. Przegląd zadania

Uzupełnienie luk w pokryciu testami dla auth flow zgodnie z test pyramid. Obecnie mamy:

- ✅ 27 unit testów dla walidacji Zod (100% coverage)
- ✅ 3 E2E testy (tylko critical paths)
- ❌ 0 integration testów dla useAuth hook
- ❌ 0 integration testów dla API routes
- ❌ 0 component testów dla formularzy

**Problem**: Odwrócona piramida - brakuje warstwy integration i component, co oznacza że większość logiki biznesowej nie jest testowana.

**Cel tego planu**: Zaimplementować brakujące testy zgodnie z test pyramid:

```
           🔺 3 E2E (critical paths) ✅
      🔺🔺🔺🔺 Integration tests (hook + API) ❌ TO ADD
  🔺🔺🔺🔺🔺🔺 Component tests (forms) ❌ TO ADD
🟢🟢🟢🟢🟢🟢🟢 27 Unit tests (Zod validation) ✅
```

---

## 2. Approach (Podejście MVP)

**Filozofia**: Test behavior, not implementation. Każda warstwa testuje inną rzecz:

- **Unit tests** (Zod) - walidacja danych (już mamy ✅)
- **Component tests** (forms) - UI w izolacji, z mockami
- **Integration tests** (hook + API) - współpraca między warstwami
- **E2E tests** (już mamy ✅) - pełne user flows

### Kluczowe decyzje:

1. **Vitest + React Testing Library** - już skonfigurowane w projekcie
2. **MSW (Mock Service Worker)** - mockowanie API dla integration testów
3. **Testing Library philosophy** - test what user sees, not implementation
4. **No E2E duplication** - nie testujemy w E2E tego co jest w unit/component
5. **MVP scope** - tylko login/register (password reset później)

### Test strategy breakdown:

**Component Tests (8 testów):**

```
LoginForm.test.tsx (4 testy)
- Renderowanie + linki
- Loading state
- Error display
- Form submission
```

```
RegisterForm.test.tsx (4 testy)
- Renderowanie + linki
- Loading state
- Error display
- Form submission
```

**Integration Tests - Hook (8 testów):**

```
useAuth.test.ts (8 testów)
- login() success flow
- login() error flows (invalid password, network error)
- register() success flow
- register() error flows (existing email)
- State management (isLoading, error)
```

**Integration Tests - API Routes (10 testów):**

```
login/route.test.ts (5 testów)
- Valid credentials → 200
- Invalid credentials → 401
- Validation errors → 400
- Supabase errors handling
```

```
register/route.test.ts (5 testów)
- Valid data → 201
- Weak password → 400
- Duplicate email → 400
- Validation errors → 400
```

**Total new tests**: 26 testów (8 component + 8 hook integration + 10 API integration)

---

## 3. Rozbicie zadań (Task Breakdown)

### FAZA 1: SETUP TESTING INFRASTRUCTURE

#### Task 1.1: Zainstalować MSW dla mockowania API

**Zadanie:** Setup Mock Service Worker do mockowania fetch w testach

- [ ] Zainstalować MSW:

  ```bash
  npm install --save-dev msw@latest
  ```

- [ ] Utworzyć handlers dla API:

  ```bash
  mkdir -p lib/test-utils
  touch lib/test-utils/msw-handlers.ts
  ```

- [ ] Utworzyć `lib/test-utils/msw-handlers.ts`:

  ```typescript
  import { http, HttpResponse } from "msw";

  export const handlers = [
    // POST /api/auth/login - success
    http.post("/api/auth/login", async ({ request }) => {
      const body = await request.json();
      const { email, password } = body as { email: string; password: string };

      if (email === "test@example.com" && password === "TestPassword123") {
        return HttpResponse.json({
          user: { id: "test-user-id", email },
          session: {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            expires_at: Date.now() + 3600000,
          },
        });
      }

      return HttpResponse.json(
        { error: "Nieprawidłowy e-mail lub hasło" },
        { status: 401 }
      );
    }),

    // POST /api/auth/register - success
    http.post("/api/auth/register", async ({ request }) => {
      const body = await request.json();
      const { email } = body as { email: string };

      if (email === "existing@example.com") {
        return HttpResponse.json(
          { error: "Ten adres e-mail jest już zajęty" },
          { status: 400 }
        );
      }

      return HttpResponse.json(
        {
          user: { id: "new-user-id", email },
          session: {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            expires_at: Date.now() + 3600000,
          },
        },
        { status: 201 }
      );
    }),
  ];
  ```

- [ ] Dodać MSW setup do vitest config:

  ```typescript
  // vitest.setup.ts
  import { afterAll, afterEach, beforeAll } from "vitest";
  import { setupServer } from "msw/node";
  import { handlers } from "./lib/test-utils/msw-handlers";

  export const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  ```

**Zależności:** Brak
**Czas:** ~20 minut

---

#### Task 1.2: Utworzyć test utilities dla React Testing Library

**Zadanie:** Helper functions dla renderowania komponentów z providerami

- [ ] Utworzyć `lib/test-utils/test-render.tsx`:

  ```typescript
  import { render, RenderOptions } from "@testing-library/react";
  import { ReactElement } from "react";

  /**
   * Custom render function that wraps components with providers
   * Use this instead of RTL's render for components that need context
   */
  export function renderWithProviders(
    ui: ReactElement,
    options?: RenderOptions
  ) {
    return render(ui, {
      wrapper: ({ children }) => <>{children}</>,
      ...options,
    });
  }

  // Re-export everything from RTL
  export * from "@testing-library/react";
  ```

- [ ] Utworzyć `lib/test-utils/index.ts`:
  ```typescript
  export * from "./test-render";
  export { server } from "../../vitest.setup";
  export { handlers } from "./msw-handlers";
  ```

**Zależności:** Brak
**Czas:** ~10 minut

---

### FAZA 2: COMPONENT TESTS

#### Task 2.1: Testy dla LoginForm (4 testy)

**Zadanie:** Component tests dla LoginForm w izolacji

- [ ] Utworzyć `components/auth/LoginForm.test.tsx`

**Test 1: Renderowanie formularza**

```typescript
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/lib/test-utils";
import { LoginForm } from "./LoginForm";

// Mock useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    login: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

describe("LoginForm", () => {
  it("should render all form fields and links", () => {
    renderWithProviders(<LoginForm />);

    // Heading
    expect(screen.getByRole("heading", { name: /zaloguj się/i })).toBeInTheDocument();

    // Form fields
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument();

    // Submit button
    expect(screen.getByRole("button", { name: /zaloguj się/i })).toBeInTheDocument();

    // Links
    expect(screen.getByRole("link", { name: /zarejestruj się/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /zapomniałeś hasła/i })).toBeInTheDocument();
  });
});
```

**Test 2: Loading state**

```typescript
it("should show loading state when isLoading is true", () => {
  // Mock useAuth with loading state
  vi.mocked(useAuth).mockReturnValue({
    login: vi.fn(),
    isLoading: true,
    error: null,
  });

  renderWithProviders(<LoginForm />);

  const submitButton = screen.getByRole("button", { name: /logowanie/i });

  expect(submitButton).toHaveTextContent("Logowanie...");
  expect(submitButton).toBeDisabled();
});
```

**Test 3: Error display**

```typescript
it("should display error message when error prop is provided", () => {
  vi.mocked(useAuth).mockReturnValue({
    login: vi.fn(),
    isLoading: false,
    error: "Nieprawidłowy e-mail lub hasło",
  });

  renderWithProviders(<LoginForm />);

  expect(screen.getByTestId("login-error")).toHaveTextContent(
    "Nieprawidłowy e-mail lub hasło"
  );
});
```

**Test 4: Form submission**

```typescript
it("should call login function on form submit", async () => {
  const mockLogin = vi.fn();
  vi.mocked(useAuth).mockReturnValue({
    login: mockLogin,
    isLoading: false,
    error: null,
  });

  const user = userEvent.setup();
  renderWithProviders(<LoginForm />);

  // Fill form
  await user.type(screen.getByLabelText(/e-mail/i), "test@example.com");
  await user.type(screen.getByLabelText(/hasło/i), "TestPassword123");

  // Submit
  await user.click(screen.getByRole("button", { name: /zaloguj się/i }));

  // Verify login was called
  expect(mockLogin).toHaveBeenCalledWith("test@example.com", "TestPassword123");
});
```

**Zależności:** Task 1.1, 1.2
**Czas:** ~30 minut

---

#### Task 2.2: Testy dla RegisterForm (4 testy)

**Zadanie:** Component tests dla RegisterForm w izolacji

- [ ] Utworzyć `components/auth/RegisterForm.test.tsx`

**Struktura testów (analogiczna do LoginForm):**

1. Renderowanie formularza (email, password, confirmPassword, link do login)
2. Loading state ("Tworzenie konta...")
3. Error display
4. Form submission (wywołuje register z 3 parametrami)

**Kod testów** (podobny do LoginForm, dostosowany do 3 pól):

```typescript
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/lib/test-utils";
import { RegisterForm } from "./RegisterForm";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    register: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

describe("RegisterForm", () => {
  it("should render all form fields and link", () => {
    renderWithProviders(<RegisterForm />);

    expect(screen.getByRole("heading", { name: /utwórz konto/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^hasło$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/potwierdź hasło/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zarejestruj się/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /zaloguj się/i })).toBeInTheDocument();
  });

  it("should show loading state when isLoading is true", () => {
    vi.mocked(useAuth).mockReturnValue({
      register: vi.fn(),
      isLoading: true,
      error: null,
    });

    renderWithProviders(<RegisterForm />);

    const submitButton = screen.getByRole("button", { name: /tworzenie konta/i });
    expect(submitButton).toHaveTextContent("Tworzenie konta...");
    expect(submitButton).toBeDisabled();
  });

  it("should display error message when error prop is provided", () => {
    vi.mocked(useAuth).mockReturnValue({
      register: vi.fn(),
      isLoading: false,
      error: "Ten adres e-mail jest już zajęty",
    });

    renderWithProviders(<RegisterForm />);

    expect(screen.getByTestId("register-error")).toHaveTextContent(
      "Ten adres e-mail jest już zajęty"
    );
  });

  it("should call register function on form submit", async () => {
    const mockRegister = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText(/e-mail/i), "test@example.com");
    await user.type(screen.getByLabelText(/^hasło$/i), "TestPassword123");
    await user.type(screen.getByLabelText(/potwierdź hasło/i), "TestPassword123");

    await user.click(screen.getByRole("button", { name: /zarejestruj się/i }));

    expect(mockRegister).toHaveBeenCalledWith(
      "test@example.com",
      "TestPassword123",
      "TestPassword123"
    );
  });
});
```

**Zależności:** Task 1.1, 1.2
**Czas:** ~30 minut

---

### FAZA 3: INTEGRATION TESTS - useAuth HOOK

#### Task 3.1: Setup testowania hooków

**Zadanie:** Dodać @testing-library/react-hooks utilities

- [ ] Utilities są już w @testing-library/react (renderHook)

- [ ] Utworzyć helper do mockowania Supabase client:

  ```typescript
  // lib/test-utils/supabase-mock.ts
  import { vi } from "vitest";

  export const mockSupabaseClient = {
    auth: {
      setSession: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
    },
  };

  export function createMockSupabaseClient() {
    return mockSupabaseClient;
  }
  ```

- [ ] Dodać do `lib/test-utils/index.ts`:
  ```typescript
  export * from "./supabase-mock";
  ```

**Czas:** ~10 minut

---

#### Task 3.2: Testy dla useAuth hook (8 testów)

**Zadanie:** Integration tests dla useAuth - współpraca z API + state management

- [ ] Utworzyć `hooks/useAuth.test.ts`

**Test 1: login() - success flow**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAuth } from "./useAuth";
import { server } from "@/lib/test-utils";
import { http, HttpResponse } from "msw";

// Mock Supabase client
vi.mock("@/lib/db/supabase.client", () => ({
  createClient: () => ({
    auth: {
      setSession: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

// Mock window.location
delete (window as any).location;
window.location = { href: "" } as any;

describe("useAuth hook", () => {
  beforeEach(() => {
    window.location.href = "";
  });

  it("login with valid credentials should set session and redirect", async () => {
    const { result } = renderHook(() => useAuth());

    // Call login
    const loginPromise = result.current.login(
      "test@example.com",
      "TestPassword123"
    );

    // Should set loading state
    expect(result.current.isLoading).toBe(true);

    await waitFor(async () => {
      const success = await loginPromise;
      expect(success).toBe(true);
    });

    // Should redirect
    expect(window.location.href).toBe("/dashboard");

    // Should clear error
    expect(result.current.error).toBeNull();
  });
});
```

**Test 2: login() - invalid password**

```typescript
it("login with invalid password should set error", async () => {
  const { result } = renderHook(() => useAuth());

  const success = await result.current.login(
    "test@example.com",
    "WrongPassword"
  );

  expect(success).toBe(false);
  expect(result.current.error).toBe("Nieprawidłowy e-mail lub hasło");
  expect(result.current.isLoading).toBe(false);
  expect(window.location.href).toBe(""); // No redirect
});
```

**Test 3: login() - network error**

```typescript
it("login with network error should set error message", async () => {
  // Override handler to throw network error
  server.use(
    http.post("/api/auth/login", () => {
      return HttpResponse.error();
    })
  );

  const { result } = renderHook(() => useAuth());

  const success = await result.current.login(
    "test@example.com",
    "TestPassword123"
  );

  expect(success).toBe(false);
  expect(result.current.error).toBe("Wystąpił błąd sieci. Sprawdź połączenie.");
  expect(result.current.isLoading).toBe(false);
});
```

**Test 4: register() - success flow**

```typescript
it("register with valid data should create user and redirect", async () => {
  const { result } = renderHook(() => useAuth());

  const success = await result.current.register(
    "new@example.com",
    "TestPassword123",
    "TestPassword123"
  );

  expect(success).toBe(true);
  expect(window.location.href).toBe("/dashboard");
  expect(result.current.error).toBeNull();
});
```

**Test 5: register() - existing email**

```typescript
it("register with existing email should set error", async () => {
  const { result } = renderHook(() => useAuth());

  const success = await result.current.register(
    "existing@example.com",
    "TestPassword123",
    "TestPassword123"
  );

  expect(success).toBe(false);
  expect(result.current.error).toBe("Ten adres e-mail jest już zajęty");
  expect(window.location.href).toBe("");
});
```

**Test 6: isLoading state management**

```typescript
it("isLoading should be true during API call", async () => {
  const { result } = renderHook(() => useAuth());

  expect(result.current.isLoading).toBe(false);

  const loginPromise = result.current.login(
    "test@example.com",
    "TestPassword123"
  );

  // Should be loading immediately
  expect(result.current.isLoading).toBe(true);

  await loginPromise;

  // Should stop loading after completion
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
});
```

**Test 7: error cleared on next call**

```typescript
it("error should be cleared on next login attempt", async () => {
  const { result } = renderHook(() => useAuth());

  // First call - fail
  await result.current.login("test@example.com", "WrongPassword");
  expect(result.current.error).not.toBeNull();

  // Second call - should clear error
  result.current.login("test@example.com", "TestPassword123");

  // Error should be cleared immediately
  expect(result.current.error).toBeNull();
});
```

**Test 8: logout() - success flow**

```typescript
it("logout should clear session and redirect", async () => {
  const { result } = renderHook(() => useAuth());

  const success = await result.current.logout();

  expect(success).toBe(true);
  expect(window.location.href).toBe("/login");
  expect(result.current.error).toBeNull();
});
```

**Zależności:** Task 1.1, 3.1
**Czas:** ~60 minut

---

### FAZA 4: INTEGRATION TESTS - API ROUTES

#### Task 4.1: Setup testowania API routes

**Zadanie:** Utilities do testowania Next.js API routes

- [ ] Utworzyć `lib/test-utils/api-test-helpers.ts`:

  ```typescript
  import { NextRequest } from "next/server";

  /**
   * Create mock NextRequest for testing API routes
   */
  export function createMockRequest(
    url: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): NextRequest {
    const { method = "GET", body, headers = {} } = options;

    return new NextRequest(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  ```

- [ ] Mock Supabase dla API route testów:

  ```typescript
  // lib/test-utils/supabase-api-mock.ts
  import { vi } from "vitest";

  export const mockSupabaseAuth = {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
  };

  export function setupSupabaseMock() {
    vi.mock("@/lib/db/supabase.server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: mockSupabaseAuth,
      }),
    }));
  }
  ```

**Czas:** ~15 minut

---

#### Task 4.2: Testy dla POST /api/auth/login (5 testów)

**Zadanie:** Integration tests dla login API route

- [ ] Utworzyć `app/api/auth/login/route.test.ts`

**Test 1: Valid credentials → 200**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import {
  createMockRequest,
  mockSupabaseAuth,
  setupSupabaseMock,
} from "@/lib/test-utils";

setupSupabaseMock();

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 with session for valid credentials", async () => {
    // Mock Supabase success response
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: "user-123", email: "test@example.com" },
        session: {
          access_token: "token-123",
          refresh_token: "refresh-123",
          expires_at: Date.now() + 3600000,
        },
      },
      error: null,
    });

    const request = createMockRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: {
        email: "test@example.com",
        password: "TestPassword123",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.email).toBe("test@example.com");
    expect(data.session.access_token).toBe("token-123");
  });
});
```

**Test 2: Invalid password → 401**

```typescript
it("should return 401 for invalid password", async () => {
  mockSupabaseAuth.signInWithPassword.mockResolvedValue({
    data: { user: null, session: null },
    error: { message: "Invalid login credentials" },
  });

  const request = createMockRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    body: {
      email: "test@example.com",
      password: "WrongPassword",
    },
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(401);
  expect(data.error).toBe("Nieprawidłowy e-mail lub hasło");
});
```

**Test 3: Invalid email format → 400**

```typescript
it("should return 400 for invalid email format", async () => {
  const request = createMockRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    body: {
      email: "invalid-email",
      password: "TestPassword123",
    },
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.error).toBe("Nieprawidłowy format e-mail");
});
```

**Test 4: Missing email → 400**

```typescript
it("should return 400 for missing email", async () => {
  const request = createMockRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    body: {
      password: "TestPassword123",
    },
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.error).toContain("email");
});
```

**Test 5: Missing password → 400**

```typescript
it("should return 400 for missing password", async () => {
  const request = createMockRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    body: {
      email: "test@example.com",
    },
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.error).toContain("password");
});
```

**Zależności:** Task 4.1
**Czas:** ~45 minut

---

#### Task 4.3: Testy dla POST /api/auth/register (5 testów)

**Zadanie:** Integration tests dla register API route

- [ ] Utworzyć `app/api/auth/register/route.test.ts`

**Struktura testów (analogiczna do login):**

1. Valid data → 201 with session
2. Weak password → 400
3. Duplicate email → 400
4. Invalid email format → 400
5. Missing confirmPassword → 400

**Kod testów** (podobny do login, dostosowany do register):

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import {
  createMockRequest,
  mockSupabaseAuth,
  setupSupabaseMock,
} from "@/lib/test-utils";

setupSupabaseMock();

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 201 with session for valid registration", async () => {
    mockSupabaseAuth.signUp.mockResolvedValue({
      data: {
        user: { id: "new-user-123", email: "new@example.com" },
        session: {
          access_token: "token-new",
          refresh_token: "refresh-new",
          expires_at: Date.now() + 3600000,
        },
      },
      error: null,
    });

    const request = createMockRequest(
      "http://localhost:3000/api/auth/register",
      {
        method: "POST",
        body: {
          email: "new@example.com",
          password: "TestPassword123",
          confirmPassword: "TestPassword123",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user.email).toBe("new@example.com");
  });

  it("should return 400 for weak password", async () => {
    const request = createMockRequest(
      "http://localhost:3000/api/auth/register",
      {
        method: "POST",
        body: {
          email: "new@example.com",
          password: "weak",
          confirmPassword: "weak",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("8 znaków");
  });

  it("should return 400 for duplicate email", async () => {
    mockSupabaseAuth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });

    const request = createMockRequest(
      "http://localhost:3000/api/auth/register",
      {
        method: "POST",
        body: {
          email: "existing@example.com",
          password: "TestPassword123",
          confirmPassword: "TestPassword123",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Ten adres e-mail jest już zajęty");
  });

  it("should return 400 for mismatched passwords", async () => {
    const request = createMockRequest(
      "http://localhost:3000/api/auth/register",
      {
        method: "POST",
        body: {
          email: "new@example.com",
          password: "TestPassword123",
          confirmPassword: "DifferentPassword123",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("identyczne");
  });

  it("should return 400 for invalid email format", async () => {
    const request = createMockRequest(
      "http://localhost:3000/api/auth/register",
      {
        method: "POST",
        body: {
          email: "invalid-email",
          password: "TestPassword123",
          confirmPassword: "TestPassword123",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Nieprawidłowy format e-mail");
  });
});
```

**Zależności:** Task 4.1
**Czas:** ~45 minut

---

## 4. Harmonogram implementacji

### Day 1: Setup & Component Tests (1.5h)

- [ ] Faza 1: Setup MSW + test utilities (Task 1.1, 1.2) - 30 min
- [ ] Faza 2: Component tests (Task 2.1, 2.2) - 60 min

### Day 2: Integration Tests - Hook (1.25h)

- [ ] Faza 3: useAuth hook tests (Task 3.1, 3.2) - 70 min

### Day 3: Integration Tests - API Routes (2h)

- [ ] Faza 4: API route tests setup (Task 4.1) - 15 min
- [ ] Faza 4: Login route tests (Task 4.2) - 45 min
- [ ] Faza 4: Register route tests (Task 4.3) - 45 min

**Total time:** ~4.75 hours (~5h z buforem)

---

## 5. Success Criteria

✅ **Po implementacji:**

1. **Infrastructure:**
   - [ ] MSW zainstalowany i skonfigurowany
   - [ ] Test utilities utworzone (`msw-handlers.ts`, `test-render.tsx`)
   - [ ] Vitest setup działa z MSW

2. **Component Tests (8 testów):**
   - [ ] LoginForm: 4 testy (render, loading, error, submission)
   - [ ] RegisterForm: 4 testy (render, loading, error, submission)

3. **Integration Tests - Hook (8 testów):**
   - [ ] useAuth login: success, invalid password, network error
   - [ ] useAuth register: success, existing email
   - [ ] State management: isLoading, error clearing
   - [ ] useAuth logout: success flow

4. **Integration Tests - API Routes (10 testów):**
   - [ ] POST /api/auth/login: 5 testów (success, errors, validation)
   - [ ] POST /api/auth/register: 5 testów (success, errors, validation)

5. **Quality:**
   - [ ] Wszystkie testy przechodzą (`npm run test:unit`)
   - [ ] Coverage dla auth wzrósł z 0% → 80%+ (hook, components, API)
   - [ ] Test execution time < 10 sekund
   - [ ] Brak flaky tests
   - [ ] Mocki są czytelne i utrzymywalne

6. **Test Pyramid Balance:**

   ```
   Before:
         🔺🔺🔺 3 E2E
              ❌ 0 integration
              ❌ 0 component
   🟢🟢🟢🟢🟢🟢🟢 27 unit

   After:
            🔺 3 E2E
      🔺🔺🔺🔺🔺 18 integration (8 hook + 10 API)
    🔺🔺🔺🔺🔺🔺 8 component
   🟢🟢🟢🟢🟢🟢🟢 27 unit
   ```

---

## 6. Files to Create

### Nowe pliki (13):

**Test utilities (4):**

- `lib/test-utils/msw-handlers.ts` - MSW request handlers
- `lib/test-utils/test-render.tsx` - Custom render with providers
- `lib/test-utils/supabase-mock.ts` - Supabase client mock
- `lib/test-utils/api-test-helpers.ts` - API route testing utilities

**Component tests (2):**

- `components/auth/LoginForm.test.tsx` - 4 testy
- `components/auth/RegisterForm.test.tsx` - 4 testy

**Integration tests - Hook (1):**

- `hooks/useAuth.test.ts` - 8 testów

**Integration tests - API Routes (2):**

- `app/api/auth/login/route.test.ts` - 5 testów
- `app/api/auth/register/route.test.ts` - 5 testów

**Utilities index (1):**

- `lib/test-utils/index.ts` - Re-exports

### Zmodyfikowane pliki (2):

- `vitest.setup.ts` - Dodać MSW setup (beforeAll, afterEach, afterAll)
- `package.json` - Dodać msw dependency

---

## 7. Notatki MVP

**Świadome uproszczenia (można dodać później):**

- ❌ Brak testów dla `resetPassword()` i `updatePassword()` - będzie w osobnym tasku
- ❌ Brak testów dla `useDashboardManager` hook - osobny task
- ❌ Brak visual regression tests dla komponentów
- ❌ Brak testów accessibility (a11y) - można dodać z @testing-library/jest-dom
- ❌ Brak testów dla password-reset i update-password API routes

**Testing best practices applied:**

- ✅ Test behavior, not implementation (user perspective)
- ✅ Mocki są czytelne i łatwe do utrzymania (MSW > fetch mock)
- ✅ Test isolation (każdy test jest niezależny)
- ✅ Explicit assertions (toContainText, toBeDisabled)
- ✅ User-centric selectors (getByRole, getByLabelText)

**Anti-patterns do uniknięcia:**

- ❌ Testowanie implementation details (internal state, private methods)
- ❌ Brittle selectors (getByClassName, querySelector)
- ❌ Shared state między testami (używaj beforeEach do reset)
- ❌ Asercje na mocki zamiast na behavior (sprawdzaj co user widzi)
- ❌ Over-mocking (mock tylko external dependencies, nie internal logic)

---

## 8. Pytania do rozstrzygnięcia

- [ ] Czy mockować Supabase client w testach komponentów?
  - **Decyzja**: TAK - mockujemy useAuth hook, który używa Supabase internally.

- [ ] Czy używać MSW czy vi.fn() dla mockowania fetch?
  - **Decyzja**: MSW - bardziej realistic, łatwiejsze do utrzymania, works in browser too.

- [ ] Czy testować window.location redirects?
  - **Decyzja**: TAK w hook tests - mockujemy window.location i sprawdzamy href.

- [ ] Czy coverage 80% wystarczy dla MVP?
  - **Decyzja**: TAK - 100% nie jest konieczne, 80% to dobry balans (test critical paths).

---

## 9. Risks & Mitigations

| Ryzyko                                   | Prawdopodobieństwo | Mitygacja                                                    |
| ---------------------------------------- | ------------------ | ------------------------------------------------------------ |
| **MSW setup complexity**                 | Medium             | Użyj oficjalnej dokumentacji MSW + vitest integration guide  |
| **Flaky hook tests** (async)             | Medium             | Użyj waitFor(), proper async/await, clear mocks w beforeEach |
| **API route tests failing**              | Low                | Mock Supabase properly, use createMockRequest helper         |
| **Component tests breaking on refactor** | Low                | Use semantic selectors (role, label) not className           |
| **Long test execution time**             | Low                | MSW is fast, vitest parallel execution, only 26 tests        |

---

## 10. What I Actually Did (vs Plan)

_Sekcja do wypełnienia podczas implementacji_

### FAZA 1: SETUP TESTING INFRASTRUCTURE ✅ / ⏳ / ❌

**Task 1.1: MSW installation and setup**

- Status:
- Czas faktyczny:
- Zmiany vs plan:

**Task 1.2: Test utilities**

- Status:
- Czas faktyczny:
- Zmiany vs plan:

### FAZA 2: COMPONENT TESTS ✅ / ⏳ / ❌

**Task 2.1: LoginForm tests**

- Status:
- Czas faktyczny:
- Zmiany vs plan:
- Test results:

**Task 2.2: RegisterForm tests**

- Status:
- Czas faktyczny:
- Zmiany vs plan:
- Test results:

### FAZA 3: INTEGRATION TESTS - HOOK ✅ / ⏳ / ❌

**Task 3.1: Hook testing setup**

- Status:
- Czas faktyczny:
- Zmiany vs plan:

**Task 3.2: useAuth hook tests**

- Status:
- Czas faktyczny:
- Zmiany vs plan:
- Test results:

### FAZA 4: INTEGRATION TESTS - API ROUTES ✅ / ⏳ / ❌

**Task 4.1: API testing setup**

- Status:
- Czas faktyczny:
- Zmiany vs plan:

**Task 4.2: Login route tests**

- Status:
- Czas faktyczny:
- Zmiany vs plan:
- Test results:

**Task 4.3: Register route tests**

- Status:
- Czas faktyczny:
- Zmiany vs plan:
- Test results:

---

## 11. References

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW (Mock Service Worker)](https://mswjs.io/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)

---

## 12. Coverage Measurement

Po implementacji uruchom coverage report:

```bash
npm run test:coverage
```

**Expected coverage dla auth:**

- `hooks/useAuth.ts`: 80%+
- `components/auth/LoginForm.tsx`: 80%+
- `components/auth/RegisterForm.tsx`: 80%+
- `app/api/auth/login/route.ts`: 80%+
- `app/api/auth/register/route.ts`: 80%+

**Przed implementacją:**

```
lib/validations/auth.ts: 100% ✅ (unit tests)
hooks/useAuth.ts: 0% ❌
components/auth/*: 0% ❌
app/api/auth/*/route.ts: 0% ❌
```

**Po implementacji (target):**

```
lib/validations/auth.ts: 100% ✅
hooks/useAuth.ts: 80%+ ✅
components/auth/*: 80%+ ✅
app/api/auth/*/route.ts: 80%+ ✅
```

---

**KONIEC PLANU**

Następny krok: Zatwierdzenie planu przez usera → Faza 1 implementacja (Setup MSW + test utilities)
