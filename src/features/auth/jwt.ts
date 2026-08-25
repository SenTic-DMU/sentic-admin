export interface JwtClaims {
  sub: string;
  role: string;
  exp: number;
}

export function decodeJwt(token: string): JwtClaims {
  const payload = token.split(".")[1];
  if (!payload) {
    throw new Error("Invalid token");
  }
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );
  return JSON.parse(atob(padded)) as JwtClaims;
}
