import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

// Tipos
type User = { id: number; email: string; name: string; role: string; is_paid: boolean | number };
type RawUser = User | (Omit<User, "is_paid"> & { is_paid?: boolean | number | string });
type AuthLoginPayload = { token: string; user: RawUser };
type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (data: AuthLoginPayload) => void;
  logout: () => void;
};

// Util: decodificar JWT (sin validar firma) para revisar expiración
function decodeJwt(token: string) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as { exp?: number; [k: string]: any };
  } catch {
    return {};
  }
}

// Util: ¿expiró?
function isExpired(token: string | null) {
  if (!token) return true;
  const payload = decodeJwt(token);
  if (!payload.exp) return false; // si no tiene exp, lo dejamos pasar
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
}

function normalizeUser(user: RawUser): User {
  const paid = (user as any)?.is_paid;
  const isPaid = paid === true || paid === 1 || paid === "1";
  return { ...(user as any), is_paid: isPaid };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Hidratar desde localStorage al cargar la app
  useEffect(() => {
    const t = localStorage.getItem("auth_token");
    const u = localStorage.getItem("auth_user");
    if (t && u && !isExpired(t)) {
      setToken(t);
      const parsed = JSON.parse(u);
      setUser(normalizeUser(parsed));
    } else {
      // Si no hay token o expiró, limpiar por si acaso
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
  }, []);

  const login = (data: AuthLoginPayload) => {
    const normalizedUser = normalizeUser(data.user);
    setToken(data.token);
    setUser(normalizedUser);
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(normalizedUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    toast.success("Sesión cerrada");
  };

  const value = useMemo(() => ({ user, token, login, logout }), [user, token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
