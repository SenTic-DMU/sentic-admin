import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { login as loginRequest } from "./api";
import { decodeJwt } from "./jwt";
import type { AdminUser } from "./types";
import { REFRESH_TOKEN_STORAGE_KEY, TOKEN_STORAGE_KEY } from "../../lib/tokenStorage";

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
    const claims = decodeJwt(response.accessToken);
    if (claims.role !== "ADMIN") {
      throw new Error("관리자 권한이 없습니다.");
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, response.refreshToken);
    setAdmin({ id: claims.sub, role: claims.role });
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
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
