# 실제 백엔드 API 연동 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자 웹의 모든 도메인(auth/members/notices/faq/payments)을 실제 백엔드 API 계약(`/api/admin/**`, `{success,data,message}` 래핑, 페이지네이션 없음)에 맞게 연결한다.

**Architecture:** `lib/apiClient.ts`에 응답 언래핑 인터셉터를 추가하고, 각 `features/*/{types,api,mock,hooks}.ts`와 관련 페이지 컴포넌트를 새 계약에 맞게 순차적으로 교체한다. 도메인별 api 계층 격리 패턴(`USE_MOCK_API` 분기)은 그대로 유지한다.

**Tech Stack:** Vite, React 19, TypeScript, axios, TanStack Query, React Router v6, Vitest + Testing Library.

## Global Constraints

- 모든 관리자 API 경로는 `/api/admin/**` (로그인만 `/api/auth/login`).
- 모든 HTTP 응답은 `{ success, data, message }` 래핑. `api.ts`에서 axios 호출 후 `const { data } = await apiClient.xxx(...)`로 꺼내는 기존 패턴은 유지 (인터셉터가 이미 언래핑해줌).
- 페이지네이션 없음 — 모든 목록 API는 배열을 직접 반환.
- 회원/공지/FAQ/결제 id는 숫자(number)로 온다. 라우트 파라미터(`useParams`)는 항상 문자열이므로, API 함수 시그니처는 URL 조립을 위해 `id: string`을 유지하고, 페이지 컴포넌트에서 숫자 id를 문자열로 변환(`String(x.id)`)해서 넘긴다.
- `VITE_USE_MOCK_API=true`일 때 쓰는 `mock.ts`도 매 도메인 작업에서 함께 새 계약으로 갱신한다.
- 테스트: `npm test` (vitest). 각 태스크 종료 시 해당 도메인 테스트가 통과해야 한다.

---

### Task 1: apiClient 응답 언래핑

**Files:**
- Modify: `src/lib/apiClient.ts`
- Test: `src/lib/apiClient.test.ts`

**Interfaces:**
- Produces: `unwrapEnvelope(response: AxiosResponse): AxiosResponse` — 이후 모든 `features/*/api.ts`가 암묵적으로 의존.

- [ ] **Step 1: 테스트 추가**

`src/lib/apiClient.test.ts`에 아래 `describe` 블록을 추가한다 (기존 `attachAuthHeader`/`handleAuthError` 블록은 그대로 둔다):

```ts
import { unwrapEnvelope } from "./apiClient";
import type { AxiosResponse } from "axios";

describe("unwrapEnvelope", () => {
  it("returns the unwrapped data when success is true", () => {
    const response = {
      data: { success: true, data: { id: 1 } },
    } as AxiosResponse;
    const result = unwrapEnvelope(response);
    expect(result.data).toEqual({ id: 1 });
  });

  it("throws with the server message when success is false", () => {
    const response = {
      data: { success: false, message: "권한이 없습니다." },
    } as AxiosResponse;
    expect(() => unwrapEnvelope(response)).toThrow("권한이 없습니다.");
  });

  it("throws a default message when success is false and message is missing", () => {
    const response = { data: { success: false } } as AxiosResponse;
    expect(() => unwrapEnvelope(response)).toThrow("요청이 실패했습니다.");
  });

  it("passes through responses without a success field", () => {
    const response = { data: [1, 2, 3] } as AxiosResponse;
    const result = unwrapEnvelope(response);
    expect(result.data).toEqual([1, 2, 3]);
  });
});
```

Also add the import at the top alongside the existing imports:
```ts
import { attachAuthHeader, handleAuthError, unwrapEnvelope } from "./apiClient";
```
(replace the existing `import { attachAuthHeader, handleAuthError } from "./apiClient";` line with this one)

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm test -- src/lib/apiClient.test.ts`
Expected: FAIL — `unwrapEnvelope` is not exported from `./apiClient`

- [ ] **Step 3: `apiClient.ts` 구현**

`src/lib/apiClient.ts` 전체를 다음으로 교체:

```ts
import axios from "axios";
import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const TOKEN_STORAGE_KEY = "admin_access_token";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export function attachAuthHeader(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
}

export function unwrapEnvelope(response: AxiosResponse): AxiosResponse {
  const body = response.data as ApiEnvelope<unknown> | unknown;
  if (body && typeof body === "object" && "success" in body) {
    const envelope = body as ApiEnvelope<unknown>;
    if (!envelope.success) {
      throw new Error(envelope.message ?? "요청이 실패했습니다.");
    }
    response.data = envelope.data;
  }
  return response;
}

export function handleAuthError(
  error: AxiosError,
  redirect: () => void = () => {
    window.location.href = "/login";
  }
): Promise<never> {
  if (error.response?.status === 401) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    redirect();
  }
  return Promise.reject(error);
}

apiClient.interceptors.request.use(attachAuthHeader);
apiClient.interceptors.response.use(unwrapEnvelope, (error: AxiosError) =>
  handleAuthError(error)
);
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `npm test -- src/lib/apiClient.test.ts`
Expected: PASS (all tests in the file)

- [ ] **Step 5: Commit**

```bash
git add src/lib/apiClient.ts src/lib/apiClient.test.ts
git commit -m "feat: unwrap {success,data,message} response envelope in apiClient"
```

---

### Task 2: auth 도메인 연동

**Files:**
- Modify: `src/features/auth/types.ts`, `src/features/auth/api.ts`, `src/features/auth/mock.ts`, `src/features/auth/AuthContext.tsx`, `src/pages/login/LoginPage.tsx`
- Test: `src/features/auth/AuthContext.test.tsx`, `src/pages/login/LoginPage.test.tsx`

**Interfaces:**
- Consumes: `apiClient` (Task 1, already unwraps envelope).
- Produces: `login(payload: LoginRequest): Promise<LoginResponse>`, `useAuth(): { admin: AdminUser | null; isAuthenticated: boolean; login(loginId: string, password: string): Promise<void>; logout(): void }`.

> 로그인 요청/응답의 정확한 필드명은 백엔드 스펙에 명시되어 있지 않아 `{ loginId, password }` 요청과 `{ accessToken, admin: { id, loginId, email, nickname, role } }` 응답을 가정한다. 실제 필드가 확인되면 이 태스크에서 만지는 3개 파일만 다시 고치면 된다.

- [ ] **Step 1: 타입 변경**

`src/features/auth/types.ts` 전체 교체:

```ts
// 로그인 요청/응답 필드는 백엔드 확인 전 임시 가정 (확인되면 이 파일만 수정)
export interface AdminUser {
  id: number;
  loginId: string;
  email: string;
  nickname: string;
  role: string;
}

export interface LoginRequest {
  loginId: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  admin: AdminUser;
}
```

- [ ] **Step 2: api.ts 변경**

`src/features/auth/api.ts` 전체 교체:

```ts
import { apiClient } from "../../lib/apiClient";
import { mockLogin } from "./mock";
import type { LoginRequest, LoginResponse } from "./types";

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  if (USE_MOCK_API) {
    return mockLogin(payload);
  }
  const { data } = await apiClient.post<LoginResponse>(
    "/api/auth/login",
    payload
  );
  return data;
}
```

- [ ] **Step 3: mock.ts 변경**

`src/features/auth/mock.ts` 전체 교체:

```ts
import type { LoginRequest, LoginResponse } from "./types";

const MOCK_LOGIN_ID = "admin";
const MOCK_PASSWORD = "admin1234";

export async function mockLogin(payload: LoginRequest): Promise<LoginResponse> {
  await delay(300);
  if (payload.loginId !== MOCK_LOGIN_ID || payload.password !== MOCK_PASSWORD) {
    throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
  }
  return {
    accessToken: "mock-access-token",
    admin: {
      id: 1,
      loginId: MOCK_LOGIN_ID,
      email: "admin@sentic.com",
      nickname: "관리자",
      role: "ADMIN",
    },
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

- [ ] **Step 4: AuthContext 변경 (ADMIN 권한 체크 포함)**

`src/features/auth/AuthContext.tsx` 전체 교체:

```tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { login as loginRequest } from "./api";
import type { AdminUser } from "./types";

const TOKEN_STORAGE_KEY = "admin_access_token";
const ADMIN_STORAGE_KEY = "admin_user";

interface AuthContextValue {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  login: (loginId: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AdminUser) : null;
  });

  useEffect(() => {
    if (admin) {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admin));
    } else {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
  }, [admin]);

  async function login(loginId: string, password: string) {
    const response = await loginRequest({ loginId, password });
    if (response.admin.role !== "ADMIN") {
      throw new Error("관리자 권한이 없습니다.");
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken);
    setAdmin(response.admin);
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAdmin(null);
  }

  const value = useMemo(
    () => ({ admin, isAuthenticated: admin !== null, login, logout }),
    [admin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

- [ ] **Step 5: LoginPage 변경 (이메일 → 아이디 필드)**

`src/pages/login/LoginPage.tsx` 전체 교체:

```tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(loginId, password);
      navigate("/members", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "아이디 또는 비밀번호가 올바르지 않습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold">관리자 로그인</h1>
        <div className="space-y-2">
          <label htmlFor="loginId" className="text-sm font-medium">
            아이디
          </label>
          <Input
            id="loginId"
            type="text"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            비밀번호
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "로그인 중..." : "로그인"}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: 테스트 갱신 — AuthContext**

`src/features/auth/AuthContext.test.tsx` 전체 교체:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";
import * as api from "./api";

vi.mock("./api");

function TestConsumer() {
  const { admin, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <p>{isAuthenticated ? `logged-in:${admin?.loginId}` : "logged-out"}</p>
      <button onClick={() => login("admin", "password")}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

const adminUser = {
  id: 1,
  loginId: "admin",
  email: "admin@sentic.com",
  nickname: "관리자",
  role: "ADMIN",
};

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.login).mockReset();
  });

  it("logs in and stores the admin user", async () => {
    vi.mocked(api.login).mockResolvedValue({
      accessToken: "token-123",
      admin: adminUser,
    });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByText("logged-out")).toBeInTheDocument();
    await user.click(screen.getByText("login"));

    await waitFor(() => {
      expect(screen.getByText("logged-in:admin")).toBeInTheDocument();
    });
    expect(localStorage.getItem("admin_access_token")).toBe("token-123");
  });

  it("logs out and clears storage", async () => {
    vi.mocked(api.login).mockResolvedValue({
      accessToken: "token-123",
      admin: adminUser,
    });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText("login"));
    await waitFor(() => screen.getByText("logged-in:admin"));

    await user.click(screen.getByText("logout"));
    expect(screen.getByText("logged-out")).toBeInTheDocument();
    expect(localStorage.getItem("admin_access_token")).toBeNull();
  });

  it("rejects login when the account is not an admin", async () => {
    vi.mocked(api.login).mockResolvedValue({
      accessToken: "token-123",
      admin: { ...adminUser, role: "USER" },
    });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText("login"));

    await waitFor(() => {
      expect(screen.getByText("logged-out")).toBeInTheDocument();
    });
    expect(localStorage.getItem("admin_access_token")).toBeNull();
  });
});
```

- [ ] **Step 7: 테스트 갱신 — LoginPage**

`src/pages/login/LoginPage.test.tsx` 전체 교체:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { AuthProvider } from "../../features/auth/AuthContext";
import * as api from "../../features/auth/api";

vi.mock("../../features/auth/api");

function renderLoginPage() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/members" element={<p>members page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.login).mockReset();
  });

  it("navigates to /members after a successful login", async () => {
    vi.mocked(api.login).mockResolvedValue({
      accessToken: "token-123",
      admin: {
        id: 1,
        loginId: "admin",
        email: "admin@sentic.com",
        nickname: "관리자",
        role: "ADMIN",
      },
    });
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText("아이디"), "admin");
    await user.type(screen.getByLabelText("비밀번호"), "password");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => {
      expect(screen.getByText("members page")).toBeInTheDocument();
    });
  });

  it("shows an error message when login fails", async () => {
    vi.mocked(api.login).mockRejectedValue(new Error("unauthorized"));
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText("아이디"), "admin");
    await user.type(screen.getByLabelText("비밀번호"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => {
      expect(screen.getByText("unauthorized")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 8: 테스트 실행 → 통과 확인**

Run: `npm test -- src/features/auth src/pages/login`
Expected: PASS (all tests)

- [ ] **Step 9: Commit**

```bash
git add src/features/auth src/pages/login
git commit -m "feat: connect auth login to POST /api/auth/login with ADMIN role check"
```

---

### Task 3: members 도메인 (types/api/mock/hooks)

**Files:**
- Modify: `src/features/members/types.ts`, `src/features/members/api.ts`, `src/features/members/mock.ts`, `src/features/members/hooks.ts`
- Test: `src/features/members/api.test.ts`, `src/features/members/hooks.test.tsx`

**Interfaces:**
- Produces: `fetchMembers(params: {keyword: string}): Promise<Member[]>`, `fetchMember(id: string): Promise<Member>`, `updateMemberStatus(id: string, status: MemberStatus): Promise<Member>`, `useMembers(keyword: string)`, `useMember(id: string)`, `useUpdateMemberStatus()`.

- [ ] **Step 1: 타입 변경**

`src/features/members/types.ts` 전체 교체:

```ts
export type MemberStatus = "ACTIVE" | "INACTIVE" | "BANNED";

export interface Member {
  id: number;
  loginId: string;
  email: string;
  nickname: string;
  provider: string;
  role: string;
  status: MemberStatus;
  createdAt: string;
}

export interface FetchMembersParams {
  keyword: string;
}
```

- [ ] **Step 2: api.ts 변경**

`src/features/members/api.ts` 전체 교체:

```ts
import { apiClient } from "../../lib/apiClient";
import { mockFetchMember, mockFetchMembers, mockUpdateMemberStatus } from "./mock";
import type { FetchMembersParams, Member, MemberStatus } from "./types";

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";

export async function fetchMembers(
  params: FetchMembersParams
): Promise<Member[]> {
  if (USE_MOCK_API) {
    return mockFetchMembers(params);
  }
  const { data } = await apiClient.get<Member[]>("/api/admin/users", {
    params: { keyword: params.keyword },
  });
  return data;
}

export async function fetchMember(id: string): Promise<Member> {
  if (USE_MOCK_API) {
    return mockFetchMember(id);
  }
  const { data } = await apiClient.get<Member>(`/api/admin/users/${id}`);
  return data;
}

export async function updateMemberStatus(
  id: string,
  status: MemberStatus
): Promise<Member> {
  if (USE_MOCK_API) {
    return mockUpdateMemberStatus(id, status);
  }
  const { data } = await apiClient.put<Member>(
    `/api/admin/users/${id}/status`,
    { status }
  );
  return data;
}
```

- [ ] **Step 3: mock.ts 변경**

`src/features/members/mock.ts` 전체 교체:

```ts
import type { FetchMembersParams, Member, MemberStatus } from "./types";

const mockMembers: Member[] = [
  {
    id: 1,
    loginId: "alice",
    email: "alice@sentic.com",
    nickname: "Alice",
    provider: "LOCAL",
    role: "USER",
    createdAt: "2026-01-05T00:00:00Z",
    status: "ACTIVE",
  },
  {
    id: 2,
    loginId: "bob",
    email: "bob@sentic.com",
    nickname: "Bob",
    provider: "GOOGLE",
    role: "USER",
    createdAt: "2026-02-10T00:00:00Z",
    status: "ACTIVE",
  },
  {
    id: 3,
    loginId: "carol",
    email: "carol@sentic.com",
    nickname: "Carol",
    provider: "LOCAL",
    role: "USER",
    createdAt: "2026-03-01T00:00:00Z",
    status: "INACTIVE",
  },
  {
    id: 4,
    loginId: "dave",
    email: "dave@sentic.com",
    nickname: "Dave",
    provider: "KAKAO",
    role: "USER",
    createdAt: "2026-03-15T00:00:00Z",
    status: "ACTIVE",
  },
  {
    id: 5,
    loginId: "erin",
    email: "erin@sentic.com",
    nickname: "Erin",
    provider: "LOCAL",
    role: "USER",
    createdAt: "2026-04-02T00:00:00Z",
    status: "BANNED",
  },
  {
    id: 6,
    loginId: "frank",
    email: "frank@sentic.com",
    nickname: "Frank",
    provider: "LOCAL",
    role: "USER",
    createdAt: "2026-04-20T00:00:00Z",
    status: "ACTIVE",
  },
];

export async function mockFetchMembers(
  params: FetchMembersParams
): Promise<Member[]> {
  await delay(200);
  const keyword = params.keyword.trim().toLowerCase();
  if (!keyword) return mockMembers;
  return mockMembers.filter(
    (member) =>
      member.email.toLowerCase().includes(keyword) ||
      member.nickname.toLowerCase().includes(keyword) ||
      member.loginId.toLowerCase().includes(keyword)
  );
}

export async function mockFetchMember(id: string): Promise<Member> {
  await delay(200);
  const member = mockMembers.find((m) => String(m.id) === id);
  if (!member) {
    throw new Error(`Member not found: ${id}`);
  }
  return member;
}

export async function mockUpdateMemberStatus(
  id: string,
  status: MemberStatus
): Promise<Member> {
  await delay(200);
  const index = mockMembers.findIndex((m) => String(m.id) === id);
  if (index === -1) {
    throw new Error(`Member not found: ${id}`);
  }
  mockMembers[index] = { ...mockMembers[index], status };
  return mockMembers[index];
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

- [ ] **Step 4: hooks.ts 변경 (페이지네이션 제거, 배열 캐시로 낙관적 업데이트)**

`src/features/members/hooks.ts` 전체 교체:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMember, fetchMembers, updateMemberStatus } from "./api";
import type { Member, MemberStatus } from "./types";

export function membersQueryKey(keyword: string) {
  return ["members", keyword] as const;
}

export function memberQueryKey(id: string) {
  return ["member", id] as const;
}

export function useMembers(keyword: string) {
  return useQuery({
    queryKey: membersQueryKey(keyword),
    queryFn: () => fetchMembers({ keyword }),
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: memberQueryKey(id),
    queryFn: () => fetchMember(id),
    enabled: Boolean(id),
  });
}

interface UpdateStatusVariables {
  id: string;
  status: MemberStatus;
}

interface MutationContext {
  previousMemberLists: [readonly unknown[], Member[] | undefined][];
  previousMember: Member | undefined;
  id: string;
}

export function useUpdateMemberStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    scope: { id: "member-status-update" },
    mutationFn: ({ id, status }: UpdateStatusVariables) =>
      updateMemberStatus(id, status),
    onMutate: async ({ id, status }): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: ["members"] });
      await queryClient.cancelQueries({ queryKey: memberQueryKey(id) });

      const previousMemberLists = queryClient.getQueriesData<Member[]>({
        queryKey: ["members"],
      });
      const previousMember = queryClient.getQueryData<Member>(
        memberQueryKey(id)
      );

      queryClient.setQueriesData<Member[]>({ queryKey: ["members"] }, (old) => {
        if (!old) return old;
        return old.map((member) =>
          String(member.id) === id ? { ...member, status } : member
        );
      });

      if (previousMember) {
        queryClient.setQueryData<Member>(memberQueryKey(id), {
          ...previousMember,
          status,
        });
      }

      return { previousMemberLists, previousMember, id };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      context.previousMemberLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      if (context.previousMember) {
        queryClient.setQueryData(
          memberQueryKey(context.id),
          context.previousMember
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: memberQueryKey(variables.id) });
    },
  });
}
```

- [ ] **Step 5: 테스트 갱신 — api.test.ts**

`src/features/members/api.test.ts` 전체 교체:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "../../lib/apiClient";
import { fetchMembers, fetchMember, updateMemberStatus } from "./api";

vi.mock("../../lib/apiClient", () => ({
  apiClient: { get: vi.fn(), put: vi.fn() },
}));

describe("members api", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.put).mockReset();
  });

  it("fetchMembers requests the members list with keyword", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    const result = await fetchMembers({ keyword: "alice" });
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/users", {
      params: { keyword: "alice" },
    });
    expect(result).toEqual([]);
  });

  it("fetchMember requests a single member by id", async () => {
    const member = {
      id: 1,
      loginId: "a",
      email: "a@b.com",
      nickname: "a",
      provider: "LOCAL",
      role: "USER",
      status: "ACTIVE",
      createdAt: "2026-01-01",
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: member });
    const result = await fetchMember("1");
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/users/1");
    expect(result).toEqual(member);
  });

  it("updateMemberStatus puts the member status", async () => {
    const member = {
      id: 1,
      loginId: "a",
      email: "a@b.com",
      nickname: "a",
      provider: "LOCAL",
      role: "USER",
      status: "INACTIVE",
      createdAt: "2026-01-01",
    };
    vi.mocked(apiClient.put).mockResolvedValue({ data: member });
    const result = await updateMemberStatus("1", "INACTIVE");
    expect(apiClient.put).toHaveBeenCalledWith("/api/admin/users/1/status", {
      status: "INACTIVE",
    });
    expect(result.status).toBe("INACTIVE");
  });
});
```

- [ ] **Step 6: 테스트 갱신 — hooks.test.tsx**

`src/features/members/hooks.test.tsx` 전체 교체:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { useMembers, useUpdateMemberStatus } from "./hooks";
import * as api from "./api";
import type { Member } from "./types";

vi.mock("./api");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

const member: Member = {
  id: 1,
  loginId: "a",
  email: "a@b.com",
  nickname: "a",
  provider: "LOCAL",
  role: "USER",
  status: "ACTIVE",
  createdAt: "2026-01-01",
};

describe("useUpdateMemberStatus", () => {
  beforeEach(() => {
    vi.mocked(api.fetchMembers).mockReset();
    vi.mocked(api.updateMemberStatus).mockReset();
  });

  it("optimistically updates the cached member list before the request resolves", async () => {
    vi.mocked(api.fetchMembers).mockResolvedValue([member]);
    vi.mocked(api.updateMemberStatus).mockReturnValue(new Promise(() => {}));

    const { wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useMembers(""), {
      wrapper,
    });
    await waitFor(() => expect(listResult.current.data).toBeDefined());

    const { result: mutationResult } = renderHook(
      () => useUpdateMemberStatus(),
      { wrapper }
    );

    act(() => {
      mutationResult.current.mutate({ id: "1", status: "INACTIVE" });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Member[]>(["members", ""]);
      expect(cached?.[0].status).toBe("INACTIVE");
    });
  });

  it("rolls back the optimistic update when the request fails", async () => {
    vi.mocked(api.fetchMembers).mockResolvedValue([member]);
    vi.mocked(api.updateMemberStatus).mockRejectedValue(
      new Error("network error")
    );

    const { wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useMembers(""), {
      wrapper,
    });
    await waitFor(() => expect(listResult.current.data).toBeDefined());

    const { result: mutationResult } = renderHook(
      () => useUpdateMemberStatus(),
      { wrapper }
    );

    act(() => {
      mutationResult.current.mutate({ id: "1", status: "INACTIVE" });
    });

    await waitFor(() => expect(mutationResult.current.isError).toBe(true));

    const cached = queryClient.getQueryData<Member[]>(["members", ""]);
    expect(cached?.[0].status).toBe("ACTIVE");
  });
});
```

- [ ] **Step 7: 테스트 실행 → 통과 확인**

Run: `npm test -- src/features/members/api.test.ts src/features/members/hooks.test.tsx`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/features/members/types.ts src/features/members/api.ts src/features/members/mock.ts src/features/members/hooks.ts src/features/members/api.test.ts src/features/members/hooks.test.tsx
git commit -m "feat: connect members domain to /api/admin/users, drop pagination"
```

---

### Task 4: members 페이지

**Files:**
- Modify: `src/pages/members/MembersListPage.tsx`, `src/pages/members/MemberDetailPage.tsx`, `src/components/common/StatusBadge.tsx`
- Test: `src/pages/members/MembersListPage.test.tsx`, `src/pages/members/MemberDetailPage.test.tsx`, `src/components/common/StatusBadge.test.tsx`

- [ ] **Step 1: StatusBadge에 BANNED 라벨 추가**

`src/components/common/StatusBadge.tsx`에서 `MEMBER_STATUS_LABEL`을 다음으로 교체 (다른 부분은 그대로):

```ts
const MEMBER_STATUS_LABEL: Record<string, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: "활성", tone: "green" },
  INACTIVE: { label: "비활성", tone: "gray" },
  BANNED: { label: "정지", tone: "red" },
};
```

- [ ] **Step 2: MembersListPage 변경 (페이지네이션 제거, provider 컬럼, 상태 select)**

`src/pages/members/MembersListPage.tsx` 전체 교체:

```tsx
import { Link, useSearchParams } from "react-router-dom";
import {
  DataTable,
  type DataTableColumn,
} from "../../components/common/DataTable";
import { SearchInput } from "../../components/common/SearchInput";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useMembers, useUpdateMemberStatus } from "../../features/members/hooks";
import type { Member, MemberStatus } from "../../features/members/types";

const STATUS_OPTIONS: MemberStatus[] = ["ACTIVE", "INACTIVE", "BANNED"];

export function MembersListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";

  const { data, isLoading, isError } = useMembers(keyword);
  const updateStatus = useUpdateMemberStatus();

  function handleKeywordChange(nextKeyword: string) {
    setSearchParams(nextKeyword ? { keyword: nextKeyword } : {});
  }

  function handleStatusChange(member: Member, nextStatus: MemberStatus) {
    updateStatus.mutate({ id: String(member.id), status: nextStatus });
  }

  const columns: DataTableColumn<Member>[] = [
    {
      key: "loginId",
      header: "아이디",
      render: (member) => (
        <Link
          to={`/members/${member.id}`}
          className="font-medium text-slate-900 hover:underline"
        >
          {member.loginId}
        </Link>
      ),
    },
    { key: "email", header: "이메일", render: (member) => member.email },
    { key: "nickname", header: "닉네임", render: (member) => member.nickname },
    { key: "provider", header: "가입경로", render: (member) => member.provider },
    {
      key: "createdAt",
      header: "가입일",
      render: (member) => new Date(member.createdAt).toLocaleDateString("ko-KR"),
    },
    {
      key: "status",
      header: "상태",
      render: (member) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={member.status} kind="member" />
          <select
            className="rounded border border-slate-300 px-2 py-1 text-xs"
            value={member.status}
            disabled={updateStatus.isPending}
            onChange={(e) =>
              handleStatusChange(member, e.target.value as MemberStatus)
            }
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">회원관리</h1>
      <SearchInput
        value={keyword}
        onChange={handleKeywordChange}
        placeholder="아이디, 이메일 또는 닉네임 검색"
      />
      {isLoading && <p className="text-sm text-slate-500">불러오는 중...</p>}
      {isError && (
        <p className="text-sm text-red-600">회원 목록을 불러오지 못했습니다.</p>
      )}
      {data && (
        <DataTable columns={columns} data={data} rowKey={(member) => member.id} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: MemberDetailPage 변경 (loginId/role 표시, select 상태변경)**

`src/pages/members/MemberDetailPage.tsx` 전체 교체:

```tsx
import { Link, useParams } from "react-router-dom";
import {
  DataTable,
  type DataTableColumn,
} from "../../components/common/DataTable";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useMember, useUpdateMemberStatus } from "../../features/members/hooks";
import { useMemberPayments } from "../../features/payments/hooks";
import type { Payment } from "../../features/payments/types";
import type { MemberStatus } from "../../features/members/types";

const STATUS_OPTIONS: MemberStatus[] = ["ACTIVE", "INACTIVE", "BANNED"];

export function MemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const id = memberId ?? "";

  const { data: member, isLoading, isError } = useMember(id);
  const { data: payments } = useMemberPayments(id);
  const updateStatus = useUpdateMemberStatus();

  function handleStatusChange(nextStatus: MemberStatus) {
    updateStatus.mutate({ id, status: nextStatus });
  }

  const paymentColumns: DataTableColumn<Payment>[] = [
    { key: "planId", header: "플랜 ID", render: (payment) => payment.planId },
    {
      key: "amount",
      header: "금액",
      render: (payment) => `${payment.amount.toLocaleString("ko-KR")}원`,
    },
    {
      key: "status",
      header: "상태",
      render: (payment) => <StatusBadge status={payment.status} kind="payment" />,
    },
    {
      key: "paidAt",
      header: "결제일",
      render: (payment) => new Date(payment.paidAt).toLocaleDateString("ko-KR"),
    },
  ];

  if (isLoading) {
    return <p className="text-sm text-slate-500">불러오는 중...</p>;
  }

  if (isError || !member) {
    return <p className="text-sm text-red-600">회원 정보를 불러오지 못했습니다.</p>;
  }

  return (
    <div className="space-y-6">
      <Link to="/members" className="text-sm text-slate-500 hover:underline">
        ← 회원 목록으로
      </Link>
      <h1 className="text-lg font-semibold">회원 상세</h1>
      <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
        <dt className="text-slate-500">아이디</dt>
        <dd>{member.loginId}</dd>
        <dt className="text-slate-500">이메일</dt>
        <dd>{member.email}</dd>
        <dt className="text-slate-500">닉네임</dt>
        <dd>{member.nickname}</dd>
        <dt className="text-slate-500">가입경로</dt>
        <dd>{member.provider}</dd>
        <dt className="text-slate-500">권한</dt>
        <dd>{member.role}</dd>
        <dt className="text-slate-500">가입일</dt>
        <dd>{new Date(member.createdAt).toLocaleDateString("ko-KR")}</dd>
        <dt className="text-slate-500">상태</dt>
        <dd>
          <StatusBadge status={member.status} kind="member" />
        </dd>
      </dl>
      <select
        className="rounded border border-slate-300 px-3 py-1.5 text-sm"
        value={member.status}
        disabled={updateStatus.isPending}
        onChange={(e) => handleStatusChange(e.target.value as MemberStatus)}
      >
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">결제 내역</h2>
          <Link
            to={`/payments?memberId=${id}`}
            className="text-sm text-slate-500 hover:underline"
          >
            전체 결제 내역 보기
          </Link>
        </div>
        <DataTable
          columns={paymentColumns}
          data={payments ?? []}
          rowKey={(payment) => payment.id}
          emptyMessage="결제 내역이 없습니다."
        />
      </section>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 확인 및 갱신**

`src/pages/members/MembersListPage.test.tsx`, `src/pages/members/MemberDetailPage.test.tsx`, `src/components/common/StatusBadge.test.tsx`를 읽고, 옛 계약(페이지네이션, `member.status` 토글 버튼 텍스트, `planName` 컬럼 등)을 참조하는 부분을 위 컴포넌트 변경 사항에 맞게 고친다 — 특히:
- `useMembers("", 0)`처럼 두 번째 인자로 page를 넘기는 호출을 `useMembers("")`로 변경
- "비활성으로 전환" 같은 토글 버튼 텍스트 검증 대신 `getByDisplayValue`/`getByRole("combobox")`로 select 값을 검증하도록 변경
- `member`/`payment` 픽스처에 새 필드(`loginId`, `provider`, `role`, `planId` 등) 추가

- [ ] **Step 5: 테스트 실행 → 통과 확인**

Run: `npm test -- src/pages/members src/components/common/StatusBadge.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/pages/members src/components/common/StatusBadge.tsx src/components/common/StatusBadge.test.tsx
git commit -m "feat: update members pages for new field set and status select"
```

---

### Task 5: notices(announcements) 도메인 (types/api/mock/hooks)

**Files:**
- Modify: `src/features/notices/types.ts`, `src/features/notices/api.ts`, `src/features/notices/mock.ts`, `src/features/notices/hooks.ts`
- Test: `src/features/notices/api.test.ts`, `src/features/notices/hooks.test.tsx`

- [ ] **Step 1: 타입 변경**

`src/features/notices/types.ts` 전체 교체:

```ts
export interface Notice {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeInput {
  title: string;
  content: string;
}
```

- [ ] **Step 2: api.ts 변경 (엔드포인트 변경, pin 전용 엔드포인트 추가)**

`src/features/notices/api.ts` 전체 교체:

```ts
import { apiClient } from "../../lib/apiClient";
import {
  mockCreateNotice,
  mockDeleteNotice,
  mockFetchNotice,
  mockFetchNotices,
  mockTogglePinNotice,
  mockUpdateNotice,
} from "./mock";
import type { Notice, NoticeInput } from "./types";

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";

export async function fetchNotices(): Promise<Notice[]> {
  if (USE_MOCK_API) {
    return mockFetchNotices();
  }
  const { data } = await apiClient.get<Notice[]>("/api/admin/announcements");
  return data;
}

export async function fetchNotice(id: string): Promise<Notice> {
  if (USE_MOCK_API) {
    return mockFetchNotice(id);
  }
  const { data } = await apiClient.get<Notice>(
    `/api/admin/announcements/${id}`
  );
  return data;
}

export async function createNotice(input: NoticeInput): Promise<Notice> {
  if (USE_MOCK_API) {
    return mockCreateNotice(input);
  }
  const { data } = await apiClient.post<Notice>(
    "/api/admin/announcements",
    input
  );
  return data;
}

export async function updateNotice(
  id: string,
  input: NoticeInput
): Promise<Notice> {
  if (USE_MOCK_API) {
    return mockUpdateNotice(id, input);
  }
  const { data } = await apiClient.put<Notice>(
    `/api/admin/announcements/${id}`,
    input
  );
  return data;
}

export async function deleteNotice(id: string): Promise<void> {
  if (USE_MOCK_API) {
    return mockDeleteNotice(id);
  }
  await apiClient.delete(`/api/admin/announcements/${id}`);
}

export async function togglePinNotice(id: string): Promise<Notice> {
  if (USE_MOCK_API) {
    return mockTogglePinNotice(id);
  }
  const { data } = await apiClient.put<Notice>(
    `/api/admin/announcements/${id}/pin`
  );
  return data;
}
```

> `GET /api/admin/announcements/{id}` 단건 조회는 원 스펙 문서에 명시되어 있지 않지만, 공지 수정 폼에서 기존 값을 채우려면 필요하다. 목록 API로 전체를 가져와 `id`로 찾는 방식(FAQ와 동일한 패턴)이 더 안전하면 이 함수를 `fetchNotices().then(list => list.find(...))`로 바꿀 수 있다 — 우선 단건 엔드포인트가 있다고 가정하고 구현하고, 백엔드 확인 후 필요하면 이 함수만 교체한다.

- [ ] **Step 3: mock.ts 변경**

`src/features/notices/mock.ts` 전체 교체:

```ts
import type { Notice, NoticeInput } from "./types";

let mockNotices: Notice[] = [
  {
    id: 1,
    title: "서비스 점검 안내",
    content: "7월 25일 새벽 2시부터 4시까지 서버 점검이 진행됩니다.",
    pinned: true,
    createdAt: "2026-07-10T00:00:00Z",
    updatedAt: "2026-07-10T00:00:00Z",
  },
  {
    id: 2,
    title: "여름 이벤트 오픈",
    content: "학습 목표를 달성하면 뱃지를 드립니다.",
    pinned: false,
    createdAt: "2026-07-15T00:00:00Z",
    updatedAt: "2026-07-15T00:00:00Z",
  },
  {
    id: 3,
    title: "개인정보처리방침 개정 안내",
    content: "2026년 8월 1일부터 개정된 방침이 적용됩니다.",
    pinned: false,
    createdAt: "2026-07-18T00:00:00Z",
    updatedAt: "2026-07-18T00:00:00Z",
  },
];

let nextId = 4;

export async function mockFetchNotices(): Promise<Notice[]> {
  await delay(200);
  return [...mockNotices];
}

export async function mockFetchNotice(id: string): Promise<Notice> {
  await delay(200);
  const notice = mockNotices.find((n) => String(n.id) === id);
  if (!notice) {
    throw new Error(`Notice not found: ${id}`);
  }
  return notice;
}

export async function mockCreateNotice(input: NoticeInput): Promise<Notice> {
  await delay(200);
  const now = new Date().toISOString();
  const notice: Notice = {
    id: nextId++,
    title: input.title,
    content: input.content,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
  mockNotices = [notice, ...mockNotices];
  return notice;
}

export async function mockUpdateNotice(
  id: string,
  input: NoticeInput
): Promise<Notice> {
  await delay(200);
  const index = mockNotices.findIndex((n) => String(n.id) === id);
  if (index === -1) {
    throw new Error(`Notice not found: ${id}`);
  }
  const updated: Notice = {
    ...mockNotices[index],
    ...input,
    updatedAt: new Date().toISOString(),
  };
  mockNotices[index] = updated;
  return updated;
}

export async function mockDeleteNotice(id: string): Promise<void> {
  await delay(200);
  mockNotices = mockNotices.filter((n) => String(n.id) !== id);
}

export async function mockTogglePinNotice(id: string): Promise<Notice> {
  await delay(200);
  const index = mockNotices.findIndex((n) => String(n.id) === id);
  if (index === -1) {
    throw new Error(`Notice not found: ${id}`);
  }
  const updated: Notice = {
    ...mockNotices[index],
    pinned: !mockNotices[index].pinned,
    updatedAt: new Date().toISOString(),
  };
  mockNotices[index] = updated;
  return updated;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

- [ ] **Step 4: hooks.ts 변경 (페이지네이션 제거, togglePin mutation 추가)**

`src/features/notices/hooks.ts` 전체 교체:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createNotice,
  deleteNotice,
  fetchNotice,
  fetchNotices,
  togglePinNotice,
  updateNotice,
} from "./api";
import type { NoticeInput } from "./types";

export const NOTICES_QUERY_KEY = ["notices"] as const;

export function noticeQueryKey(id: string) {
  return ["notice", id] as const;
}

export function useNotices() {
  return useQuery({
    queryKey: NOTICES_QUERY_KEY,
    queryFn: fetchNotices,
  });
}

export function useNotice(id: string) {
  return useQuery({
    queryKey: noticeQueryKey(id),
    queryFn: () => fetchNotice(id),
    enabled: Boolean(id),
  });
}

export function useCreateNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NoticeInput) => createNotice(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTICES_QUERY_KEY });
    },
  });
}

export function useUpdateNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NoticeInput }) =>
      updateNotice(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: NOTICES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: noticeQueryKey(variables.id) });
    },
  });
}

export function useDeleteNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTICES_QUERY_KEY });
    },
  });
}

export function useTogglePinNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => togglePinNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTICES_QUERY_KEY });
    },
  });
}
```

- [ ] **Step 5: 테스트 갱신 — api.test.ts**

`src/features/notices/api.test.ts` 전체 교체:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "../../lib/apiClient";
import {
  createNotice,
  deleteNotice,
  fetchNotice,
  fetchNotices,
  togglePinNotice,
  updateNotice,
} from "./api";

vi.mock("../../lib/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("notices api", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.put).mockReset();
    vi.mocked(apiClient.delete).mockReset();
  });

  it("fetchNotices requests the announcements list", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    const result = await fetchNotices();
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/announcements");
    expect(result).toEqual([]);
  });

  it("fetchNotice requests a single notice by id", async () => {
    const notice = {
      id: 1,
      title: "t",
      content: "c",
      pinned: false,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: notice });
    const result = await fetchNotice("1");
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/announcements/1");
    expect(result).toEqual(notice);
  });

  it("createNotice posts the notice input without pinned", async () => {
    const input = { title: "t", content: "c" };
    const notice = { id: 1, ...input, pinned: false, createdAt: "2026-01-01", updatedAt: "2026-01-01" };
    vi.mocked(apiClient.post).mockResolvedValue({ data: notice });
    const result = await createNotice(input);
    expect(apiClient.post).toHaveBeenCalledWith("/api/admin/announcements", input);
    expect(result).toEqual(notice);
  });

  it("updateNotice puts the notice input without pinned", async () => {
    const input = { title: "t2", content: "c2" };
    const notice = { id: 1, ...input, pinned: false, createdAt: "2026-01-01", updatedAt: "2026-01-02" };
    vi.mocked(apiClient.put).mockResolvedValue({ data: notice });
    const result = await updateNotice("1", input);
    expect(apiClient.put).toHaveBeenCalledWith("/api/admin/announcements/1", input);
    expect(result).toEqual(notice);
  });

  it("deleteNotice deletes the notice", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });
    await deleteNotice("1");
    expect(apiClient.delete).toHaveBeenCalledWith("/api/admin/announcements/1");
  });

  it("togglePinNotice calls the pin endpoint", async () => {
    const notice = { id: 1, title: "t", content: "c", pinned: true, createdAt: "2026-01-01", updatedAt: "2026-01-02" };
    vi.mocked(apiClient.put).mockResolvedValue({ data: notice });
    const result = await togglePinNotice("1");
    expect(apiClient.put).toHaveBeenCalledWith("/api/admin/announcements/1/pin");
    expect(result).toEqual(notice);
  });
});
```

- [ ] **Step 6: 테스트 갱신 — hooks.test.tsx**

`src/features/notices/hooks.test.tsx` 전체 교체:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  useCreateNotice,
  useDeleteNotice,
  useNotices,
  useTogglePinNotice,
  useUpdateNotice,
} from "./hooks";
import * as api from "./api";

vi.mock("./api");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe("notices hooks", () => {
  beforeEach(() => {
    vi.mocked(api.fetchNotices).mockReset();
    vi.mocked(api.createNotice).mockReset();
    vi.mocked(api.updateNotice).mockReset();
    vi.mocked(api.deleteNotice).mockReset();
    vi.mocked(api.togglePinNotice).mockReset();
  });

  it("invalidates the notices list after creating a notice", async () => {
    vi.mocked(api.fetchNotices).mockResolvedValue([]);
    vi.mocked(api.createNotice).mockResolvedValue({
      id: 1,
      title: "t",
      content: "c",
      pinned: false,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result: listResult } = renderHook(() => useNotices(), { wrapper });
    await waitFor(() => expect(listResult.current.data).toBeDefined());

    const { result: mutationResult } = renderHook(() => useCreateNotice(), {
      wrapper,
    });

    await act(async () => {
      await mutationResult.current.mutateAsync({ title: "t", content: "c" });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notices"] });
  });

  it("invalidates the notices list and detail after updating a notice", async () => {
    vi.mocked(api.updateNotice).mockResolvedValue({
      id: 1,
      title: "t2",
      content: "c2",
      pinned: false,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-02",
    });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateNotice(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "1",
        input: { title: "t2", content: "c2" },
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notices"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notice", "1"] });
  });

  it("invalidates the notices list after deleting a notice", async () => {
    vi.mocked(api.deleteNotice).mockResolvedValue(undefined);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteNotice(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("1");
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notices"] });
  });

  it("invalidates the notices list after toggling pin", async () => {
    vi.mocked(api.togglePinNotice).mockResolvedValue({
      id: 1,
      title: "t",
      content: "c",
      pinned: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-02",
    });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useTogglePinNotice(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("1");
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notices"] });
  });
});
```

- [ ] **Step 7: 테스트 실행 → 통과 확인**

Run: `npm test -- src/features/notices/api.test.ts src/features/notices/hooks.test.tsx`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/features/notices/types.ts src/features/notices/api.ts src/features/notices/mock.ts src/features/notices/hooks.ts src/features/notices/api.test.ts src/features/notices/hooks.test.tsx
git commit -m "feat: connect notices domain to /api/admin/announcements, separate pin toggle"
```

---

### Task 6: notices 페이지

**Files:**
- Modify: `src/pages/notices/NoticesListPage.tsx`, `src/pages/notices/NoticeFormPage.tsx`
- Test: `src/pages/notices/NoticesListPage.test.tsx`, `src/pages/notices/NoticeFormPage.test.tsx`

- [ ] **Step 1: NoticesListPage 변경 (페이지네이션 제거, pin은 useTogglePinNotice 사용)**

`src/pages/notices/NoticesListPage.tsx` 전체 교체:

```tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DataTable,
  type DataTableColumn,
} from "../../components/common/DataTable";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Button } from "../../components/ui/button";
import {
  useDeleteNotice,
  useNotices,
  useTogglePinNotice,
} from "../../features/notices/hooks";
import type { Notice } from "../../features/notices/types";

function sortNotices(notices: Notice[]): Notice[] {
  return [...notices].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function NoticesListPage() {
  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null);

  const { data, isLoading, isError } = useNotices();
  const togglePin = useTogglePinNotice();
  const deleteNotice = useDeleteNotice();

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteNotice.mutate(String(deleteTarget.id), {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  const notices = data ? sortNotices(data) : [];

  const columns: DataTableColumn<Notice>[] = [
    {
      key: "title",
      header: "제목",
      render: (notice) => (
        <Link
          to={`/notices/${notice.id}/edit`}
          className="font-medium text-slate-900 hover:underline"
        >
          {notice.pinned && (
            <span className="mr-2 inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
              고정
            </span>
          )}
          {notice.title}
        </Link>
      ),
    },
    {
      key: "createdAt",
      header: "작성일",
      render: (notice) =>
        new Date(notice.createdAt).toLocaleDateString("ko-KR"),
    },
    {
      key: "actions",
      header: "관리",
      render: (notice) => (
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs hover:bg-slate-100"
            onClick={() => togglePin.mutate(String(notice.id))}
            disabled={togglePin.isPending}
          >
            {notice.pinned ? "고정 해제" : "상단 고정"}
          </button>
          <Link
            to={`/notices/${notice.id}/edit`}
            className="rounded border px-2 py-1 text-xs hover:bg-slate-100"
          >
            수정
          </Link>
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
            onClick={() => setDeleteTarget(notice)}
          >
            삭제
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">공지사항</h1>
        <Link to="/notices/new">
          <Button type="button">공지 작성</Button>
        </Link>
      </div>
      {isLoading && <p className="text-sm text-slate-500">불러오는 중...</p>}
      {isError && (
        <p className="text-sm text-red-600">공지사항을 불러오지 못했습니다.</p>
      )}
      {data && (
        <DataTable
          columns={columns}
          data={notices}
          rowKey={(notice) => notice.id}
        />
      )}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="공지사항을 삭제하시겠습니까?"
        description={deleteTarget?.title}
        isLoading={deleteNotice.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: NoticeFormPage 변경 (isPinned 체크박스 제거)**

`src/pages/notices/NoticeFormPage.tsx` 전체 교체:

```tsx
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  useCreateNotice,
  useNotice,
  useUpdateNotice,
} from "../../features/notices/hooks";

export function NoticeFormPage() {
  const { noticeId } = useParams<{ noticeId: string }>();
  const isEditMode = Boolean(noticeId);
  const navigate = useNavigate();

  const { data: notice, isLoading } = useNotice(noticeId ?? "");
  const createNotice = useCreateNotice();
  const updateNotice = useUpdateNotice();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (notice) {
      setTitle(notice.title);
      setContent(notice.content);
    }
  }, [notice]);

  const isSaving = createNotice.isPending || updateNotice.isPending;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const input = { title, content };
    if (isEditMode && noticeId) {
      updateNotice.mutate(
        { id: noticeId, input },
        { onSuccess: () => navigate("/notices") }
      );
    } else {
      createNotice.mutate(input, {
        onSuccess: () => navigate("/notices"),
      });
    }
  }

  if (isEditMode && isLoading) {
    return <p className="text-sm text-slate-500">불러오는 중...</p>;
  }

  return (
    <div className="max-w-xl space-y-4">
      <Link to="/notices" className="text-sm text-slate-500 hover:underline">
        ← 공지사항 목록으로
      </Link>
      <h1 className="text-lg font-semibold">
        {isEditMode ? "공지 수정" : "공지 작성"}
      </h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="notice-title"
          >
            제목
          </label>
          <Input
            id="notice-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="notice-content"
          >
            내용
          </label>
          <textarea
            id="notice-content"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={isSaving}>
            {isEditMode ? "수정" : "작성"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/notices")}
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: 테스트 갱신**

`src/pages/notices/NoticesListPage.test.tsx`와 `src/pages/notices/NoticeFormPage.test.tsx`를 읽고, 옛 계약을 참조하는 부분(페이지네이션, `isPinned` 체크박스 상호작용, `content/totalPages` 응답 목킹)을 위 컴포넌트에 맞게 고친다. 특히 `NoticeFormPage.test.tsx`에서 "상단 고정" 체크박스를 클릭하는 테스트가 있다면 제거하고, `useCreateNotice`/`useUpdateNotice` 목이 `{title, content}`만 받는지 검증하도록 바꾼다.

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `npm test -- src/pages/notices`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/notices
git commit -m "feat: update notices pages for pin-toggle endpoint and no pagination"
```

---

### Task 7: faq 도메인 (types/api/mock/hooks)

**Files:**
- Modify: `src/features/faq/types.ts`, `src/features/faq/api.ts`, `src/features/faq/mock.ts`, `src/features/faq/hooks.ts`
- Test: `src/features/faq/api.test.ts`, `src/features/faq/hooks.test.tsx`

- [ ] **Step 1: 타입 변경 (id: number)**

`src/features/faq/types.ts` 전체 교체:

```ts
export type FaqDirection = "UP" | "DOWN";

export interface Faq {
  id: number;
  question: string;
  answer: string;
  orderNum: number;
}

export interface FaqInput {
  question: string;
  answer: string;
}
```

- [ ] **Step 2: api.ts 변경 (경로 `/api/admin/faq` 단수, order는 orderNum PUT)**

`src/features/faq/api.ts` 전체 교체:

```ts
import { apiClient } from "../../lib/apiClient";
import {
  mockCreateFaq,
  mockDeleteFaq,
  mockFetchFaqs,
  mockMoveFaqOrder,
  mockUpdateFaq,
} from "./mock";
import type { Faq, FaqDirection, FaqInput } from "./types";

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";

export async function fetchFaqs(): Promise<Faq[]> {
  if (USE_MOCK_API) {
    return mockFetchFaqs();
  }
  const { data } = await apiClient.get<Faq[]>("/api/admin/faq");
  return data;
}

export async function fetchFaq(id: string): Promise<Faq> {
  const faqs = await fetchFaqs();
  const faq = faqs.find((f) => String(f.id) === id);
  if (!faq) {
    throw new Error(`Faq not found: ${id}`);
  }
  return faq;
}

export async function createFaq(input: FaqInput): Promise<Faq> {
  if (USE_MOCK_API) {
    return mockCreateFaq(input);
  }
  const { data } = await apiClient.post<Faq>("/api/admin/faq", input);
  return data;
}

export async function updateFaq(id: string, input: FaqInput): Promise<Faq> {
  if (USE_MOCK_API) {
    return mockUpdateFaq(id, input);
  }
  const { data } = await apiClient.put<Faq>(`/api/admin/faq/${id}`, input);
  return data;
}

export async function deleteFaq(id: string): Promise<void> {
  if (USE_MOCK_API) {
    return mockDeleteFaq(id);
  }
  await apiClient.delete(`/api/admin/faq/${id}`);
}

export async function setFaqOrder(id: string, orderNum: number): Promise<Faq> {
  const { data } = await apiClient.put<Faq>(`/api/admin/faq/${id}/order`, {
    orderNum,
  });
  return data;
}

export async function moveFaqOrder(
  id: string,
  direction: FaqDirection
): Promise<Faq[]> {
  if (USE_MOCK_API) {
    return mockMoveFaqOrder(id, direction);
  }
  const faqs = (await fetchFaqs()).sort((a, b) => a.orderNum - b.orderNum);
  const index = faqs.findIndex((f) => String(f.id) === id);
  if (index === -1) {
    throw new Error(`Faq not found: ${id}`);
  }
  const targetIndex = direction === "UP" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= faqs.length) {
    return [faqs[index]];
  }
  const current = faqs[index];
  const target = faqs[targetIndex];
  const [updatedCurrent, updatedTarget] = await Promise.all([
    setFaqOrder(String(current.id), target.orderNum),
    setFaqOrder(String(target.id), current.orderNum),
  ]);
  return [updatedCurrent, updatedTarget];
}
```

- [ ] **Step 3: mock.ts 변경 (id: number, moveFaqOrder는 기존 로직 유지)**

`src/features/faq/mock.ts` 전체 교체:

```ts
import type { Faq, FaqDirection, FaqInput } from "./types";

let mockFaqs: Faq[] = [
  {
    id: 1,
    question: "회원가입은 어떻게 하나요?",
    answer: "앱 실행 후 이메일 또는 소셜 계정으로 가입할 수 있습니다.",
    orderNum: 1,
  },
  {
    id: 2,
    question: "구독은 어떻게 취소하나요?",
    answer: "마이페이지 > 구독 관리에서 언제든 해지할 수 있습니다.",
    orderNum: 2,
  },
  {
    id: 3,
    question: "학습 데이터는 어떻게 저장되나요?",
    answer: "대화 기록은 암호화되어 서버에 저장됩니다.",
    orderNum: 3,
  },
];

let nextId = 4;

function sortFaqs(faqs: Faq[]): Faq[] {
  return [...faqs].sort((a, b) => a.orderNum - b.orderNum);
}

export async function mockFetchFaqs(): Promise<Faq[]> {
  await delay(200);
  return sortFaqs(mockFaqs);
}

export async function mockCreateFaq(input: FaqInput): Promise<Faq> {
  await delay(200);
  const maxOrderNum = mockFaqs.reduce((max, f) => Math.max(max, f.orderNum), 0);
  const faq: Faq = {
    id: nextId++,
    question: input.question,
    answer: input.answer,
    orderNum: maxOrderNum + 1,
  };
  mockFaqs = [...mockFaqs, faq];
  return faq;
}

export async function mockUpdateFaq(id: string, input: FaqInput): Promise<Faq> {
  await delay(200);
  const index = mockFaqs.findIndex((f) => String(f.id) === id);
  if (index === -1) {
    throw new Error(`Faq not found: ${id}`);
  }
  const updated: Faq = { ...mockFaqs[index], ...input };
  mockFaqs[index] = updated;
  return updated;
}

export async function mockDeleteFaq(id: string): Promise<void> {
  await delay(200);
  mockFaqs = mockFaqs.filter((f) => String(f.id) !== id);
}

export async function mockMoveFaqOrder(
  id: string,
  direction: FaqDirection
): Promise<Faq[]> {
  await delay(200);
  const sorted = sortFaqs(mockFaqs);
  const index = sorted.findIndex((f) => String(f.id) === id);
  if (index === -1) {
    throw new Error(`Faq not found: ${id}`);
  }
  const targetIndex = direction === "UP" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= sorted.length) {
    return [sorted[index]];
  }

  const current = sorted[index];
  const target = sorted[targetIndex];
  const swappedCurrent = { ...current, orderNum: target.orderNum };
  const swappedTarget = { ...target, orderNum: current.orderNum };

  mockFaqs = mockFaqs.map((f) => {
    if (f.id === swappedCurrent.id) return swappedCurrent;
    if (f.id === swappedTarget.id) return swappedTarget;
    return f;
  });

  return [swappedCurrent, swappedTarget];
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

- [ ] **Step 4: hooks.ts — 변경 없음, id 타입만 확인**

`src/features/faq/hooks.ts`는 이미 `Faq`/`FaqDirection` 타입만 사용하고 id를 직접 다루지 않으므로 수정 불필요. 파일을 열어서 `queryClient.setQueryData<Faq[]>` 관련 로직이 `Faq.id: number`와 호환되는지 확인만 한다 (제네릭이라 문제 없음).

- [ ] **Step 5: 테스트 갱신 — api.test.ts**

`src/features/faq/api.test.ts` 전체 교체:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "../../lib/apiClient";
import { createFaq, deleteFaq, fetchFaqs, moveFaqOrder, updateFaq } from "./api";

vi.mock("../../lib/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("faq api", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.put).mockReset();
    vi.mocked(apiClient.delete).mockReset();
  });

  it("fetchFaqs requests the faq list", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    const result = await fetchFaqs();
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/faq");
    expect(result).toEqual([]);
  });

  it("createFaq posts the faq input", async () => {
    const input = { question: "q", answer: "a" };
    const faq = { id: 1, ...input, orderNum: 1 };
    vi.mocked(apiClient.post).mockResolvedValue({ data: faq });
    const result = await createFaq(input);
    expect(apiClient.post).toHaveBeenCalledWith("/api/admin/faq", input);
    expect(result).toEqual(faq);
  });

  it("updateFaq puts the faq input", async () => {
    const input = { question: "q2", answer: "a2" };
    const faq = { id: 1, ...input, orderNum: 1 };
    vi.mocked(apiClient.put).mockResolvedValue({ data: faq });
    const result = await updateFaq("1", input);
    expect(apiClient.put).toHaveBeenCalledWith("/api/admin/faq/1", input);
    expect(result).toEqual(faq);
  });

  it("deleteFaq deletes the faq", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });
    await deleteFaq("1");
    expect(apiClient.delete).toHaveBeenCalledWith("/api/admin/faq/1");
  });

  it("moveFaqOrder swaps orderNum between the item and its UP neighbor via two PUT calls", async () => {
    const faqs = [
      { id: 1, question: "q1", answer: "a1", orderNum: 1 },
      { id: 2, question: "q2", answer: "a2", orderNum: 2 },
    ];
    vi.mocked(apiClient.get).mockResolvedValue({ data: faqs });
    vi.mocked(apiClient.put)
      .mockResolvedValueOnce({ data: { ...faqs[1], orderNum: 1 } })
      .mockResolvedValueOnce({ data: { ...faqs[0], orderNum: 2 } });

    const result = await moveFaqOrder("2", "UP");

    expect(apiClient.put).toHaveBeenCalledWith("/api/admin/faq/2/order", {
      orderNum: 1,
    });
    expect(apiClient.put).toHaveBeenCalledWith("/api/admin/faq/1/order", {
      orderNum: 2,
    });
    expect(result).toHaveLength(2);
  });
});
```

- [ ] **Step 6: hooks.test.tsx 확인**

`src/features/faq/hooks.test.tsx`은 `Faq` 픽스처의 `id`를 문자열(`"1"`, `"2"`)로 쓰고 있다. 이 태스크에서 `Faq.id`가 `number`가 되므로, 픽스처를 다음처럼 숫자로 바꾼다 (다른 로직은 그대로):

```ts
const faqs: Faq[] = [
  { id: 1, question: "q1", answer: "a1", orderNum: 1 },
  { id: 2, question: "q2", answer: "a2", orderNum: 2 },
];
```

그리고 `mutationResult.current.mutate({ id: "2", direction: "UP" })` 호출부는 `useMoveFaqOrder`의 mutationFn이 여전히 `moveFaqOrder(id: string, ...)`를 받으므로 문자열 `"2"`를 그대로 유지한다 (변경 없음). `cached?.[0].id`에 대한 assertion만 숫자(`2`, `1`)로 바꾼다.

- [ ] **Step 7: 테스트 실행 → 통과 확인**

Run: `npm test -- src/features/faq/api.test.ts src/features/faq/hooks.test.tsx`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/features/faq/types.ts src/features/faq/api.ts src/features/faq/mock.ts src/features/faq/api.test.ts src/features/faq/hooks.test.tsx
git commit -m "feat: connect faq domain to /api/admin/faq with orderNum-based ordering"
```

---

### Task 8: faq 페이지 (id 비교 수정)

**Files:**
- Modify: `src/pages/faq/FaqListPage.tsx`, `src/pages/faq/FaqFormPage.tsx`
- Test: `src/pages/faq/FaqListPage.test.tsx`, `src/pages/faq/FaqFormPage.test.tsx`

`Faq.id`가 `string`에서 `number`로 바뀌었으므로, `useParams`에서 얻는 문자열 `faqId`와 비교하는 곳을 `String(faq.id) === faqId`로 고치고, mutation에 넘기는 id는 `String(faq.id)`로 변환한다.

- [ ] **Step 1: FaqListPage 변경**

`src/pages/faq/FaqListPage.tsx`에서 `onClick` 핸들러 두 곳을 다음으로 교체 (나머지는 동일):

```tsx
              onClick={() =>
                moveFaqOrder.mutate({ id: String(faq.id), direction: "UP" })
              }
```
```tsx
              onClick={() =>
                moveFaqOrder.mutate({ id: String(faq.id), direction: "DOWN" })
              }
```

그리고 `handleConfirmDelete` 내부 호출을 교체:

```tsx
  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteFaq.mutate(String(deleteTarget.id), {
      onSuccess: () => setDeleteTarget(null),
    });
  }
```

- [ ] **Step 2: FaqFormPage 변경**

`src/pages/faq/FaqFormPage.tsx`에서 다음 줄:
```tsx
  const faq = faqs?.find((f) => f.id === faqId);
```
을 다음으로 교체:
```tsx
  const faq = faqs?.find((f) => String(f.id) === faqId);
```

- [ ] **Step 3: 테스트 확인**

`src/pages/faq/FaqListPage.test.tsx`, `src/pages/faq/FaqFormPage.test.tsx`를 열어 `Faq` 픽스처의 `id`가 문자열로 되어 있으면 숫자로 바꾼다 (예: `id: "1"` → `id: 1`).

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `npm test -- src/pages/faq`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/faq
git commit -m "fix: compare faq ids as strings against route params after id:number change"
```

---

### Task 9: payments 도메인 (types/api/mock/hooks)

**Files:**
- Modify: `src/features/payments/types.ts`, `src/features/payments/api.ts`, `src/features/payments/mock.ts`, `src/features/payments/hooks.ts`
- Test: `src/features/payments/api.test.ts`, `src/features/payments/hooks.test.tsx`

- [ ] **Step 1: 타입 변경**

`src/features/payments/types.ts` 전체 교체:

```ts
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";

export interface Payment {
  id: number;
  userId: number;
  planId: number;
  amount: number;
  status: PaymentStatus;
  paymentMethod: string;
  paidAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface FetchPaymentsParams {
  status?: PaymentStatus;
}
```

- [ ] **Step 2: api.ts 변경 (memberId는 별도 엔드포인트, 페이지네이션 제거)**

`src/features/payments/api.ts` 전체 교체:

```ts
import { apiClient } from "../../lib/apiClient";
import { mockFetchMemberPayments, mockFetchPayments } from "./mock";
import type { FetchPaymentsParams, Payment } from "./types";

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";

export async function fetchMemberPayments(userId: string): Promise<Payment[]> {
  if (USE_MOCK_API) {
    return mockFetchMemberPayments(userId);
  }
  const { data } = await apiClient.get<Payment[]>(
    `/api/admin/payments/user/${userId}`
  );
  return data;
}

export async function fetchPayments(
  params: FetchPaymentsParams
): Promise<Payment[]> {
  if (USE_MOCK_API) {
    return mockFetchPayments(params);
  }
  const { data } = await apiClient.get<Payment[]>("/api/admin/payments", {
    params: { status: params.status },
  });
  return data;
}
```

- [ ] **Step 3: mock.ts 변경**

`src/features/payments/mock.ts` 전체 교체:

```ts
import type { FetchPaymentsParams, Payment } from "./types";

const mockPayments: Payment[] = [
  {
    id: 1,
    userId: 1,
    planId: 1,
    amount: 9900,
    status: "SUCCESS",
    paymentMethod: "CARD",
    paidAt: "2026-01-06T00:00:00Z",
    expiresAt: "2026-02-06T00:00:00Z",
    createdAt: "2026-01-06T00:00:00Z",
  },
  {
    id: 2,
    userId: 2,
    planId: 1,
    amount: 9900,
    status: "PENDING",
    paymentMethod: "CARD",
    paidAt: "2026-02-11T00:00:00Z",
    expiresAt: "2026-03-11T00:00:00Z",
    createdAt: "2026-02-11T00:00:00Z",
  },
  {
    id: 3,
    userId: 4,
    planId: 2,
    amount: 19900,
    status: "FAILED",
    paymentMethod: "CARD",
    paidAt: "2026-03-16T00:00:00Z",
    expiresAt: "2026-04-16T00:00:00Z",
    createdAt: "2026-03-16T00:00:00Z",
  },
  {
    id: 4,
    userId: 4,
    planId: 2,
    amount: 19900,
    status: "SUCCESS",
    paymentMethod: "CARD",
    paidAt: "2026-03-17T00:00:00Z",
    expiresAt: "2026-04-17T00:00:00Z",
    createdAt: "2026-03-17T00:00:00Z",
  },
  {
    id: 5,
    userId: 6,
    planId: 1,
    amount: 9900,
    status: "CANCELLED",
    paymentMethod: "CARD",
    paidAt: "2026-04-21T00:00:00Z",
    expiresAt: "2026-05-21T00:00:00Z",
    createdAt: "2026-04-21T00:00:00Z",
  },
];

export async function mockFetchPayments(
  params: FetchPaymentsParams
): Promise<Payment[]> {
  await delay(200);
  const filtered = params.status
    ? mockPayments.filter((payment) => payment.status === params.status)
    : mockPayments;
  return [...filtered].sort(
    (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
  );
}

export async function mockFetchMemberPayments(userId: string): Promise<Payment[]> {
  await delay(200);
  return mockPayments.filter((payment) => String(payment.userId) === userId);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

- [ ] **Step 4: hooks.ts 변경 (usePayments는 memberId가 있으면 fetchMemberPayments 위임, 페이지네이션 제거)**

`src/features/payments/hooks.ts` 전체 교체:

```ts
import { useQuery } from "@tanstack/react-query";
import { fetchMemberPayments, fetchPayments } from "./api";
import type { PaymentStatus } from "./types";

export function useMemberPayments(memberId: string) {
  return useQuery({
    queryKey: ["member-payments", memberId],
    queryFn: () => fetchMemberPayments(memberId),
    enabled: Boolean(memberId),
  });
}

export function usePayments(
  status: PaymentStatus | undefined,
  memberId: string | undefined
) {
  return useQuery({
    queryKey: ["payments", status ?? "", memberId ?? ""],
    queryFn: () =>
      memberId ? fetchMemberPayments(memberId) : fetchPayments({ status }),
  });
}
```

> `memberId`로 필터링할 때는 `/api/admin/payments/user/{userId}`를 호출하므로 `status` 필터는 클라이언트에는 적용되지 않는다 (백엔드가 지원하지 않음). 회원별 화면에서는 상태 필터 UI 자체를 노출하지 않는 것으로 Task 10에서 처리한다.

- [ ] **Step 5: 테스트 갱신 — api.test.ts**

`src/features/payments/api.test.ts` 전체 교체:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "../../lib/apiClient";
import { fetchMemberPayments, fetchPayments } from "./api";

vi.mock("../../lib/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("payments api", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it("fetches payments for a member", async () => {
    const payments = [
      {
        id: 1,
        userId: 1,
        planId: 1,
        amount: 9900,
        status: "SUCCESS",
        paymentMethod: "CARD",
        paidAt: "2026-01-01",
        expiresAt: "2026-02-01",
        createdAt: "2026-01-01",
      },
    ];
    vi.mocked(apiClient.get).mockResolvedValue({ data: payments });
    const result = await fetchMemberPayments("1");
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/payments/user/1");
    expect(result).toEqual(payments);
  });

  it("fetches the payments list with a status filter", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    const result = await fetchPayments({ status: "SUCCESS" });
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/payments", {
      params: { status: "SUCCESS" },
    });
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 6: 테스트 갱신 — hooks.test.tsx**

`src/features/payments/hooks.test.tsx` 전체 교체:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useMemberPayments, usePayments } from "./hooks";
import * as api from "./api";

vi.mock("./api");

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useMemberPayments", () => {
  beforeEach(() => {
    vi.mocked(api.fetchMemberPayments).mockReset();
    vi.mocked(api.fetchPayments).mockReset();
  });

  it("does not fetch when memberId is empty", () => {
    renderHook(() => useMemberPayments(""), { wrapper });
    expect(api.fetchMemberPayments).not.toHaveBeenCalled();
  });

  it("fetches payments when memberId is provided", async () => {
    vi.mocked(api.fetchMemberPayments).mockResolvedValue([]);
    const { result } = renderHook(() => useMemberPayments("1"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.fetchMemberPayments).toHaveBeenCalledWith("1");
  });
});

describe("usePayments", () => {
  beforeEach(() => {
    vi.mocked(api.fetchPayments).mockReset();
    vi.mocked(api.fetchMemberPayments).mockReset();
  });

  it("fetches payments with the given status when no memberId is set", async () => {
    vi.mocked(api.fetchPayments).mockResolvedValue([]);
    const { result } = renderHook(() => usePayments("SUCCESS", undefined), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.fetchPayments).toHaveBeenCalledWith({ status: "SUCCESS" });
  });

  it("delegates to fetchMemberPayments when memberId is set", async () => {
    vi.mocked(api.fetchMemberPayments).mockResolvedValue([]);
    const { result } = renderHook(() => usePayments(undefined, "1"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.fetchMemberPayments).toHaveBeenCalledWith("1");
    expect(api.fetchPayments).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 7: 테스트 실행 → 통과 확인**

Run: `npm test -- src/features/payments/api.test.ts src/features/payments/hooks.test.tsx`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/features/payments/types.ts src/features/payments/api.ts src/features/payments/mock.ts src/features/payments/hooks.ts src/features/payments/api.test.ts src/features/payments/hooks.test.tsx
git commit -m "feat: connect payments domain to /api/admin/payments, no join fields"
```

---

### Task 10: payments 페이지

**Files:**
- Modify: `src/pages/payments/PaymentsListPage.tsx`
- Test: `src/pages/payments/PaymentsListPage.test.tsx`

MemberDetailPage의 결제 섹션은 Task 4에서 이미 `planId`/`amount`/`status`/`paidAt` 컬럼으로 갱신했으므로 이 태스크에서는 손대지 않는다.

- [ ] **Step 1: PaymentsListPage 변경 (userId/planId 표시, 페이지네이션 제거)**

`src/pages/payments/PaymentsListPage.tsx` 전체 교체:

```tsx
import { Link, useSearchParams } from "react-router-dom";
import {
  DataTable,
  type DataTableColumn,
} from "../../components/common/DataTable";
import { StatusBadge } from "../../components/common/StatusBadge";
import { usePayments } from "../../features/payments/hooks";
import type { Payment, PaymentStatus } from "../../features/payments/types";

const STATUS_OPTIONS: { value: PaymentStatus | ""; label: string }[] = [
  { value: "", label: "전체" },
  { value: "PENDING", label: "대기" },
  { value: "SUCCESS", label: "성공" },
  { value: "FAILED", label: "실패" },
  { value: "CANCELLED", label: "취소" },
];

function parseStatus(raw: string | null): PaymentStatus | undefined {
  return raw === "PENDING" ||
    raw === "SUCCESS" ||
    raw === "FAILED" ||
    raw === "CANCELLED"
    ? raw
    : undefined;
}

export function PaymentsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = parseStatus(searchParams.get("status"));
  const memberId = searchParams.get("memberId") ?? undefined;

  const { data, isLoading, isError } = usePayments(status, memberId);

  function handleStatusChange(nextStatus: string) {
    const next: Record<string, string> = {};
    if (nextStatus) next.status = nextStatus;
    if (memberId) next.memberId = memberId;
    setSearchParams(next);
  }

  function clearMemberFilter() {
    const next: Record<string, string> = {};
    if (status) next.status = status;
    setSearchParams(next);
  }

  const columns: DataTableColumn<Payment>[] = [
    {
      key: "userId",
      header: "회원",
      render: (payment) => (
        <Link
          to={`/members/${payment.userId}`}
          className="font-medium text-slate-900 hover:underline"
        >
          회원 #{payment.userId}
        </Link>
      ),
    },
    { key: "planId", header: "플랜 ID", render: (payment) => payment.planId },
    {
      key: "amount",
      header: "금액",
      render: (payment) => `${payment.amount.toLocaleString("ko-KR")}원`,
    },
    {
      key: "status",
      header: "상태",
      render: (payment) => <StatusBadge status={payment.status} kind="payment" />,
    },
    {
      key: "paidAt",
      header: "결제일",
      render: (payment) => new Date(payment.paidAt).toLocaleDateString("ko-KR"),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">결제 내역</h1>
      <div className="flex items-center gap-3">
        {!memberId && (
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            value={status ?? ""}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        {memberId && (
          <span className="flex items-center gap-2 text-sm text-slate-600">
            회원 ID: {memberId} 로 필터링 중
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs hover:bg-slate-100"
              onClick={clearMemberFilter}
            >
              필터 해제
            </button>
          </span>
        )}
      </div>
      {isLoading && <p className="text-sm text-slate-500">불러오는 중...</p>}
      {isError && (
        <p className="text-sm text-red-600">결제 내역을 불러오지 못했습니다.</p>
      )}
      {data && (
        <DataTable
          columns={columns}
          data={data}
          rowKey={(payment) => payment.id}
          emptyMessage="결제 내역이 없습니다."
        />
      )}
    </div>
  );
}
```

> `memberId` 필터가 걸려있을 때는 백엔드가 상태 필터를 지원하지 않는 회원별 엔드포인트를 쓰므로 상태 드롭다운을 숨긴다.

- [ ] **Step 2: 테스트 갱신**

`src/pages/payments/PaymentsListPage.test.tsx`를 열어 `usePayments`/`data.content`/`totalPages`를 참조하는 부분을 배열 응답 기준으로 고치고, `memberEmail`/`memberNickname`/`planName` 텍스트를 검증하는 부분을 `payment.userId`/`payment.planId` 기준으로 바꾼다.

- [ ] **Step 3: 테스트 실행 → 통과 확인**

Run: `npm test -- src/pages/payments`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/payments
git commit -m "feat: update payments list page to show raw userId/planId, no pagination"
```

---

### Task 11: 정리 — 미사용 Pagination 제거 및 전체 검증

**Files:**
- Delete (조건부): `src/components/common/Pagination.tsx`, `src/components/common/Pagination.test.tsx`
- Modify: `.env.development.local` (필요 시 `VITE_API_BASE_URL` 확인)

- [ ] **Step 1: Pagination 사용처 확인**

Run: `grep -rl "Pagination" src --include=*.tsx | grep -v Pagination.tsx`
Expected: 결과 없음 (Task 4/6/10에서 모든 목록 페이지가 이미 `Pagination`을 제거했으므로)

- [ ] **Step 2: 미사용이면 삭제**

결과가 없으면:
```bash
git rm src/components/common/Pagination.tsx src/components/common/Pagination.test.tsx
```

- [ ] **Step 3: 전체 테스트 실행**

Run: `npm test`
Expected: 모든 테스트 PASS

- [ ] **Step 4: 타입체크 및 빌드**

Run: `npm run build`
Expected: 빌드 성공 (타입 에러 없음)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove unused Pagination component after pagination removal"
```

---

## Self-Review Notes

- **Spec coverage:** Task 1은 스펙 §1(응답 언래핑/403), Task 2는 §1(로그인/ADMIN 체크), Task 3~4는 §3.1, Task 5~6은 §3.2, Task 7~8은 §3.3, Task 9~10은 §3.4, Task 11은 §2(페이지네이션 제거 후 정리)를 각각 커버한다. §4(Mock 모드)는 각 도메인 태스크의 mock.ts 스텝에 포함, §5(테스트)는 각 태스크의 테스트 스텝에 포함.
- **Placeholder scan:** 모든 스텝에 실제 코드/커맨드 포함. Task 5 Step 2와 Task 9 hooks.ts 뒤에만 설계상 가정(단건 공지 조회 엔드포인트 존재 여부, memberId 필터 시 status 미지원)을 명시적으로 남겨뒀고, 둘 다 "왜 그렇게 했는지"와 "확인되면 무엇을 바꾸면 되는지"를 구체적으로 적어뒀다.
- **Type consistency:** `Member.id`/`Faq.id`/`Notice.id`/`Payment.id`를 모두 `number`로 통일했고, URL 조립용 함수 파라미터는 전부 `string`으로 유지하면서 호출부(Task 4, 8, 10)에서 `String(x.id)` 변환을 명시적으로 넣었다. `moveFaqOrder(id: string, direction): Promise<Faq[]>` 시그니처는 mock/실제 구현 모두 동일하게 유지.
