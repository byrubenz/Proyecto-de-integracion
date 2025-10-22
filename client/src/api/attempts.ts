// client/src/api/attempts.ts
import { getToken } from "./auth";

export type AttemptMeta = {
  id: number;
  mode: "practice" | "exam";
  topic_id: number;
  topic_name: string;
  score: number;
  started_at: string;
  submitted_at: string;
  total: number;
  accuracy_pct: number;
};

export type AttemptItem = {
  question_id: number;
  stem: string;
  explanation?: string | null;
  selected_option_id: number | null;
  is_correct: boolean | null;
  options: Array<{
    id: number;
    label: string;
    text: string;
    is_correct: boolean;
    is_selected: boolean;
  }>;
};

export type AttemptDetailResponse = {
  ok: boolean;
  attempt: AttemptMeta;
  items: AttemptItem[];
};

export async function fetchAttemptDetail(attemptId: number): Promise<AttemptDetailResponse> {
  const base = import.meta.env.VITE_API_URL;
  const token = getToken();
  const res = await fetch(`${base}/api/answers/${attemptId}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "No se pudo cargar el detalle del intento");
  }
  return data;
}

/* 🆕 Historial con paginación */
export type HistoryAttempt = {
  attempt_id: number;
  mode: "practice" | "exam";
  topic_id: number;
  topic_name: string;
  score: number;
  started_at: string;
  submitted_at: string;
  total_questions: number;
  accuracy_pct: number;
};

export type HistoryResponse = {
  ok: boolean;
  attempts: HistoryAttempt[];
  total_attempts: number;
  page: number;
  page_size: number;
  has_more: boolean;
};

export async function fetchHistory(limit = 10, offset = 0): Promise<HistoryResponse> {
  const base = import.meta.env.VITE_API_URL;
  const token = getToken();

  const qs = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  const res = await fetch(`${base}/api/answers/history?${qs.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "No se pudo cargar el historial");
  return data;
}

/* 🆕 Resumen (KPIs) */
export type SummaryResponse = {
  ok: boolean;
  total_attempts: number;
  avg_accuracy: number;
  topics_practiced: number;
  best_topic?: { topic_id: number; name: string; accuracy: number } | null;
  worst_topic?: { topic_id: number; name: string; accuracy: number } | null;
};

export async function fetchSummary(): Promise<SummaryResponse> {
  const base = import.meta.env.VITE_API_URL;
  const token = getToken();

  const res = await fetch(`${base}/api/answers/summary`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "No se pudo cargar el resumen");
  return data;
}

/* 🆕 Stats por tema (para Dashboard) — (única definición) */
export type TopicStat = {
  topic_id: number;
  topic_name: string;
  attempts: number;
  total_questions: number;
  correct_answers: number;
  accuracy_pct: number;
  last_practiced?: string | null; // puede venir null desde el backend
};

export type TopicStatsResponse = {
  ok: boolean;
  stats: TopicStat[];
  limit: number;
};

export async function fetchTopicStats(limit = 8): Promise<TopicStatsResponse> {
  const base = import.meta.env.VITE_API_URL;
  const token = getToken();

  const qs = new URLSearchParams({ limit: String(limit) });
  const res = await fetch(`${base}/api/answers/stats/topics?${qs.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "No se pudo cargar stats por tema");
  return data;
}
