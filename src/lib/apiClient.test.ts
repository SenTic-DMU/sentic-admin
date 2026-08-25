import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import axios, { AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig, AxiosError, AxiosResponse } from "axios";
import {
  attachAuthHeader,
  handleAuthError,
  refreshAccessToken,
  unwrapEnvelope,
} from "./apiClient";

describe("attachAuthHeader", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("attaches the Authorization header when a token exists", () => {
    localStorage.setItem("admin_access_token", "test-token");
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    const result = attachAuthHeader(config);
    expect(result.headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("does not attach a header when no token exists", () => {
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    const result = attachAuthHeader(config);
    expect(result.headers.get("Authorization")).toBeUndefined();
  });
});

describe("handleAuthError", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("clears the token and redirects on a 401 with no request config to retry", async () => {
    localStorage.setItem("admin_access_token", "test-token");
    const redirect = vi.fn();
    const error = { response: { status: 401 } } as AxiosError;
    await expect(handleAuthError(error, { redirect })).rejects.toBe(error);
    expect(localStorage.getItem("admin_access_token")).toBeNull();
    expect(redirect).toHaveBeenCalled();
  });

  it("keeps the token and does not redirect for non-401/403 errors", async () => {
    localStorage.setItem("admin_access_token", "test-token");
    const redirect = vi.fn();
    const error = { response: { status: 500 } } as AxiosError;
    await expect(handleAuthError(error, { redirect })).rejects.toBe(error);
    expect(localStorage.getItem("admin_access_token")).toBe("test-token");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("refreshes the token and retries the original request on a 401", async () => {
    const redirect = vi.fn();
    const refresh = vi.fn().mockResolvedValue("new-access-token");
    const retriedResponse = { data: { ok: true } } as AxiosResponse;
    const retryRequest = vi.fn().mockResolvedValue(retriedResponse);
    const config = {
      headers: new AxiosHeaders(),
      _retried: false,
    } as InternalAxiosRequestConfig;
    const error = { response: { status: 401 }, config } as AxiosError;

    const result = await handleAuthError(error, { redirect, refresh, retryRequest });

    expect(refresh).toHaveBeenCalled();
    expect(retryRequest).toHaveBeenCalledWith(
      expect.objectContaining({ _retried: true })
    );
    expect(result).toBe(retriedResponse);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("also refreshes and retries on a 403 (this backend uses 403 for expired/missing tokens)", async () => {
    const redirect = vi.fn();
    const refresh = vi.fn().mockResolvedValue("new-access-token");
    const retriedResponse = { data: { ok: true } } as AxiosResponse;
    const retryRequest = vi.fn().mockResolvedValue(retriedResponse);
    const config = {
      headers: new AxiosHeaders(),
      _retried: false,
    } as InternalAxiosRequestConfig;
    const error = { response: { status: 403 }, config } as AxiosError;

    const result = await handleAuthError(error, { redirect, refresh, retryRequest });

    expect(refresh).toHaveBeenCalled();
    expect(result).toBe(retriedResponse);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("logs out when the refresh call itself fails", async () => {
    localStorage.setItem("admin_access_token", "test-token");
    const redirect = vi.fn();
    const refresh = vi.fn().mockRejectedValue(new Error("refresh failed"));
    const retryRequest = vi.fn();
    const config = {
      headers: new AxiosHeaders(),
      _retried: false,
    } as InternalAxiosRequestConfig;
    const error = { response: { status: 401 }, config } as AxiosError;

    await expect(
      handleAuthError(error, { redirect, refresh, retryRequest })
    ).rejects.toBe(error);

    expect(retryRequest).not.toHaveBeenCalled();
    expect(localStorage.getItem("admin_access_token")).toBeNull();
    expect(redirect).toHaveBeenCalled();
  });

  it("does not retry a request more than once", async () => {
    const redirect = vi.fn();
    const refresh = vi.fn();
    const retryRequest = vi.fn();
    const config = {
      headers: new AxiosHeaders(),
      _retried: true,
    } as InternalAxiosRequestConfig;
    const error = { response: { status: 401 }, config } as AxiosError;

    await expect(
      handleAuthError(error, { redirect, refresh, retryRequest })
    ).rejects.toBe(error);

    expect(refresh).not.toHaveBeenCalled();
    expect(retryRequest).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalled();
  });
});

describe("refreshAccessToken", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends the refresh token in the Refresh-Token header and stores the new tokens", async () => {
    localStorage.setItem("admin_refresh_token", "old-refresh-token");
    vi.spyOn(axios, "post").mockResolvedValue({
      data: {
        success: true,
        data: { accessToken: "new-access", refreshToken: "new-refresh" },
      },
    } as AxiosResponse);

    const accessToken = await refreshAccessToken();

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/refresh"),
      undefined,
      { headers: { "Refresh-Token": "old-refresh-token" } }
    );
    expect(accessToken).toBe("new-access");
    expect(localStorage.getItem("admin_access_token")).toBe("new-access");
    expect(localStorage.getItem("admin_refresh_token")).toBe("new-refresh");
  });

  it("throws when there is no stored refresh token", async () => {
    await expect(refreshAccessToken()).rejects.toThrow(
      "리프레시 토큰이 없습니다."
    );
  });

  it("dedupes concurrent calls into a single refresh request", async () => {
    localStorage.setItem("admin_refresh_token", "old-refresh-token");
    const postSpy = vi.spyOn(axios, "post").mockResolvedValue({
      data: {
        success: true,
        data: { accessToken: "new-access", refreshToken: "new-refresh" },
      },
    } as AxiosResponse);

    const [first, second] = await Promise.all([
      refreshAccessToken(),
      refreshAccessToken(),
    ]);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(first).toBe("new-access");
    expect(second).toBe("new-access");
  });
});

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
