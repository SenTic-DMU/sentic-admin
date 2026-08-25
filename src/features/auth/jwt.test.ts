import { describe, expect, it } from "vitest";
import { decodeJwt } from "./jwt";

function encode(value: unknown): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_");
}

describe("decodeJwt", () => {
  it("decodes the claims from a JWT's payload segment", () => {
    const token = `${encode({ alg: "none" })}.${encode({
      sub: "17",
      role: "ADMIN",
      exp: 1787642014,
    })}.signature`;
    expect(decodeJwt(token)).toEqual({
      sub: "17",
      role: "ADMIN",
      exp: 1787642014,
    });
  });

  it("throws for a malformed token", () => {
    expect(() => decodeJwt("not-a-jwt")).toThrow("Invalid token");
  });
});
