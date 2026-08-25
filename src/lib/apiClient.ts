import axios from "axios";
import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { REFRESH_TOKEN_STORAGE_KEY, TOKEN_STORAGE_KEY } from "./tokenStorage";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

const baseURL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({ baseURL });

// ngrok 무료 티어는 브라우저 요청에 경고 인터스티셜 페이지를 끼워넣는데,
// 그 페이지에는 CORS 헤더가 없어서 브라우저에는 CORS 에러로 보인다.
// 이 헤더를 실어 보내면 인터스티셜 없이 바로 실제 응답을 받는다.
const NGROK_SKIP_WARNING_HEADERS = baseURL?.includes("ngrok")
  ? { "ngrok-skip-browser-warning": "true" }
  : {};

Object.assign(apiClient.defaults.headers.common, NGROK_SKIP_WARNING_HEADERS);

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

let refreshPromise: Promise<string> | null = null;

async function performTokenRefresh(): Promise<string> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  if (!refreshToken) {
    throw new Error("리프레시 토큰이 없습니다.");
  }
  const response = await axios.post<
    ApiEnvelope<{ accessToken: string; refreshToken: string }>
  >(`${baseURL}/api/auth/refresh`, undefined, {
    headers: { "Refresh-Token": refreshToken, ...NGROK_SKIP_WARNING_HEADERS },
  });
  if (!response.data.success) {
    throw new Error(response.data.message ?? "토큰 재발급에 실패했습니다.");
  }
  const { accessToken, refreshToken: nextRefreshToken } = response.data.data;
  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, nextRefreshToken);
  return accessToken;
}

// 동시에 여러 요청이 401을 맞아도 refresh 호출은 한 번만 나가도록 진행 중인 프로미스를 공유한다.
export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export interface HandleAuthErrorDeps {
  redirect?: () => void;
  refresh?: () => Promise<string>;
  retryRequest?: (
    config: InternalAxiosRequestConfig
  ) => Promise<AxiosResponse>;
}

export async function handleAuthError(
  error: AxiosError,
  deps: HandleAuthErrorDeps = {}
): Promise<unknown> {
  const {
    redirect = () => {
      window.location.href = "/login";
    },
    refresh = refreshAccessToken,
    retryRequest = (config) => apiClient.request(config),
  } = deps;

  // 이 백엔드는 토큰이 없거나 만료됐을 때도(뿐 아니라 ADMIN 권한이 없을 때도)
  // Spring Security 필터 단에서 401이 아니라 403(바디 없음)으로 막는다.
  // 로그인 시점에 이미 ADMIN인지 확인하므로, 로그인 이후의 403은 사실상
  // "토큰이 유효하지 않음"으로 보고 401과 동일하게 재발급을 시도한다.
  const status = error.response?.status;
  if (status !== 401 && status !== 403) {
    return Promise.reject(error);
  }

  const config = error.config as RetryableRequestConfig | undefined;

  if (config && !config._retried) {
    config._retried = true;
    try {
      await refresh();
      return await retryRequest(config);
    } catch {
      // refresh도 실패했으면 진짜 로그아웃 처리로 넘어간다.
    }
  }

  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  redirect();
  return Promise.reject(error);
}

apiClient.interceptors.request.use(attachAuthHeader);
apiClient.interceptors.response.use(unwrapEnvelope, (error: AxiosError) =>
  handleAuthError(error)
);
