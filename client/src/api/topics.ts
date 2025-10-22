// client/src/api/topics.ts
import { getToken } from "./auth";

const base = import.meta.env.VITE_API_URL;

export type TopicLite = {
  id: number;
  name: string;
  unit_id?: number | null;
  unit_name?: string | null;
};

export async function fetchAllTopics(): Promise<TopicLite[]> {
  const token = getToken();

  // Intenta un endpoint "all" (recomendado); si no existe, cae a /api/topics
  const tryFetch = async (path: string) => {
    const res = await fetch(`${base}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  // Esperamos un payload { ok: true, topics: TopicLite[] } o directamente TopicLite[]
  const coerce = (data: any): TopicLite[] =>
    Array.isArray(data) ? data :
    Array.isArray(data?.topics) ? data.topics : [];

  try {
    const data = await tryFetch(`/api/topics/all`);
    return coerce(data);
  } catch {
    const data = await tryFetch(`/api/topics`);
    return coerce(data);
  }
}
