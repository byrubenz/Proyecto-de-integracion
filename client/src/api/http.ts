export const API_URL = import.meta.env.VITE_API_URL as string;

export async function apiGet(path: string) {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
