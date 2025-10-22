// client/src/api/exams.ts
import { getToken } from "./auth";

const base = import.meta.env.VITE_API_URL;

/* ========== Tipos base ========== */
export type ExamSection = { topic_id: number; count: number };

export type StartExamResp = {
  ok: boolean;
  attempt_id: number;
  title: string;
  time_limit_seconds: number | null;
  total_questions: number;
};

export type ExamProgress = {
  ok: boolean;
  attempt: {
    id: number;
    title: string | null;
    time_limit_seconds: number | null;
    started_at: string;
    submitted_at: string | null;
  };
  items: Array<{
    question_id: number;
    stem: string;
    options: Array<{ id: number; label: string; text: string }>;
    selected_option_id: number | null;
  }>;
  answered: number;
  total: number;

  // 🆕 añadidos para temporizador/reanudación
  server_now: string;       // NOW() del servidor (ISO)
  elapsed_seconds: number;  // segundos transcurridos desde started_at
  expired: boolean;         // true si ya pasó el límite y no se ha enviado
};

export type ExamResult = {
  ok: boolean;
  attempt: {
    id: number;
    title: string | null;
    score: number;
    started_at: string;
    submitted_at: string | null;
    duration_seconds: number | null;
    time_limit_seconds: number | null;
    total: number;
    accuracy_pct: number;
  };
  items: Array<{
    question_id: number;
    stem: string;
    explanation: string | null;
    selected_option_id: number | null;
    is_correct: boolean | null;
    options: Array<{
      id: number;
      label: string;
      text: string;
      is_correct: boolean;
      is_selected: boolean;
    }>;
  }>;
};

/* ========== NUEVO: tipos para detalle (review) ========== */
export type ExamDetailAttempt = {
  id: number;
  mode: "exam";
  title: string | null;
  score: number;
  started_at: string;
  submitted_at: string | null;
  time_limit_seconds: number | null;
  total: number;
  accuracy_pct: number;
};

export type ExamDetailItem = {
  question_id: number;
  stem: string;
  explanation: string | null;
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

export type ExamDetailResponse = {
  ok: boolean;
  attempt: ExamDetailAttempt;
  items: ExamDetailItem[];
};

/* ========== Requests ========== */
export async function startExam(payload: {
  title?: string;
  time_limit_seconds?: number | null;
  sections: ExamSection[];
}): Promise<StartExamResp> {
  const token = getToken();
  const res = await fetch(`${base}/api/exams/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "No se pudo iniciar el ensayo");
  return data;
}

export async function fetchExamProgress(attemptId: number): Promise<ExamProgress> {
  const token = getToken();
  const res = await fetch(`${base}/api/exams/${attemptId}/progress`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "No se pudo cargar el progreso");
  return data as ExamProgress; // 👈 asegura los nuevos campos
}

export async function answerExam(
  attemptId: number,
  payload: { question_id: number; option_id: number | null }
) {
  const token = getToken();
  const res = await fetch(`${base}/api/exams/${attemptId}/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "No se pudo guardar la respuesta");
  return data as { ok: true; question_id: number; option_id: number | null };
}

export async function finishExam(attemptId: number, duration_seconds?: number) {
  const token = getToken();
  const res = await fetch(`${base}/api/exams/${attemptId}/finish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ duration_seconds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "No se pudo finalizar el examen");
  return data as { ok: true; attempt_id: number; score: number; total: number; accuracy_pct: number };
}

export async function fetchExamResult(attemptId: number): Promise<ExamResult> {
  const token = getToken();
  const res = await fetch(`${base}/api/exams/${attemptId}/result`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "No se pudo cargar el resultado");
  return data;
}

/* ========== NUEVO: detalle/revisión del examen ========== */
export async function fetchExamDetail(attemptId: number): Promise<ExamDetailResponse> {
  const token = getToken();
  const res = await fetch(`${base}/api/exams/${attemptId}/detail`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "No se pudo cargar el detalle del examen");
  return data;
}

/* ================== NUEVO: ensayos activos ================== */
export type ActiveExam = {
  id: number;
  title: string | null;
  started_at: string;
  time_limit_seconds: number | null;
};
export type ActiveExamsResponse = { ok: boolean; active: ActiveExam[] };

export async function fetchActiveExams(): Promise<ActiveExamsResponse> {
  const token = getToken();
  const res = await fetch(`${base}/api/exams/active`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "No se pudo cargar ensayos activos");
  return data;
}

/* ================== NUEVO: historial de ensayos ================== */
export type ExamHistoryItem = {
  attempt_id: number;
  title: string | null;
  score: number;
  total_questions: number;
  accuracy_pct: number;
  started_at: string;
  submitted_at: string;
  duration_seconds: number | null;
  time_limit_seconds: number | null;
};

export type ExamHistoryResponse = {
  ok: boolean;
  exams: ExamHistoryItem[];
  total_exams: number;
  page: number;
  page_size: number;
  has_more: boolean;
};

export async function fetchExamHistory(limit = 10, offset = 0): Promise<ExamHistoryResponse> {
  const token = getToken();
  const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const res = await fetch(`${base}/api/exams/history?${qs.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "No se pudo cargar el historial de ensayos");
  return data;
}

/* ================== NUEVO: rehacer ensayo ================== */
export async function retakeExam(
  attemptId: number
): Promise<{ ok: true; attempt_id: number; title?: string; time_limit_seconds?: number | null; total_questions?: number }> {
  const token = getToken();
  const res = await fetch(`${base}/api/exams/${attemptId}/retake`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "No se pudo rehacer el ensayo");
  return data;
}
