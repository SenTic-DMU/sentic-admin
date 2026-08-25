import { describe, expect, it, vi, beforeEach } from "vitest";
import { AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig, AxiosError, AxiosResponse } from "axios";
import { attachAuthHeader, handleAuthError, unwrapEnvelope } from "./apiClient";

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

  it("clears the token and redirects on a 401 response", async () => {
    localStorage.setItem("admin_access_token", "test-token");
    const redirect = vi.fn();
    const error = { response: { status: 401 } } as AxiosError;
    await expect(handleAuthError(error, redirect)).rejects.toBe(error);
    expect(localStorage.getItem("admin_access_token")).toBeNull();
    expect(redirect).toHaveBeenCalled();
  });

  it("keeps the token and does not redirect for non-401 errors", async () => {
    localStorage.setItem("admin_access_token", "test-token");
    const redirect = vi.fn();
    const error = { response: { status: 500 } } as AxiosError;
    await expect(handleAuthError(error, redirect)).rejects.toBe(error);
    expect(localStorage.getItem("admin_access_token")).toBe("test-token");
    expect(redirect).not.toHaveBeenCalled();
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
