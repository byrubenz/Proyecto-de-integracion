// client/src/api/profile.ts
import { getToken } from "./auth";
const base = import.meta.env.VITE_API_URL;

export type UserProfile = {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export async function fetchProfile(): Promise<{ ok: boolean; profile: UserProfile }> {
  const token = getToken();
  const res = await fetch(`${base}/api/profile`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "No se pudo cargar el perfil");
  return data;
}

export async function updateProfile(payload: { name?: string; email?: string }) {
  const token = getToken();
  const res = await fetch(`${base}/api/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "No se pudo actualizar el perfil");
  return data as { ok: boolean; profile: UserProfile };
}

export async function changePassword(payload: { current_password: string; new_password: string }) {
  const token = getToken();
  const res = await fetch(`${base}/api/profile/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "No se pudo cambiar la contraseña");
  return data as { ok: boolean };
}
