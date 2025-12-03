const API = import.meta.env.VITE_API_URL;

export type LoginResponse = {
  token: string;
  user: { id: number; email: string; name: string; role: string; is_paid: boolean | number };
};

// 🔧 versión mejorada: muestra errores reales del backend
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  // intenta parsear respuesta (aunque haya error)
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data; // { token, user }
}

export async function register(email: string, password: string, name: string) {
  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

// Helpers simples (sin contexto todavía)
export function saveSession(data: LoginResponse) {
  localStorage.setItem("auth_token", data.token);
  localStorage.setItem("auth_user", JSON.stringify(data.user));
}

export function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

export function getUser():
  | { id: number; email: string; name: string; role: string }
  | null {
  const raw = localStorage.getItem("auth_user");
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
}
