import { describe, expect, it, vi, beforeEach } from "vitest";
import { AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig, AxiosError } from "axios";
import { attachAuthHeader, handleAuthError } from "./apiClient";

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
