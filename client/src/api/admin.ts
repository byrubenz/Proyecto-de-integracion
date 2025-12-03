import { getToken } from "./auth";

const base = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${base}${path}`, options);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/* ================= Dashboard ================= */
export type AdminSummary = {
  counts: { users: number; units: number; topics: number; questions: number; exams: number };
  last_attempts: Array<{
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    mode: string;
    score: number;
    started_at: string;
    submitted_at: string | null;
    exam_id: number | null;
    exam_name: string | null;
    topic_id: number | null;
    topic_name: string | null;
  }>;
  last_events: Array<{
    id: number;
    user_id: number | null;
    user_email: string | null;
    event_type: string;
    created_at: string;
  }>;
};

export async function fetchAdminSummary(): Promise<AdminSummary & { ok: boolean }> {
  return request("/api/admin/summary", { headers: authHeaders() });
}

/* ================= Usuarios ================= */
export type AdminUsersResponse = {
  ok: boolean;
  users: Array<{ id: number; name: string; email: string; role: string; created_at: string; updated_at: string | null }>;
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
};

export async function fetchAdminUsers(params: { search?: string; limit?: number; offset?: number } = {}): Promise<AdminUsersResponse> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  return request(`/api/admin/users?${qs.toString()}`, { headers: authHeaders() });
}

export async function updateUserRole(id: number, role: "admin" | "student") {
  return request(`/api/admin/users/${id}/role`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ role }),
  });
}

/* ================= Unidades y topics ================= */
export type AdminUnit = { id: number; name: string; order_idx: number; topics: Array<{ id: number; name: string; order_idx: number }> };
export async function fetchAdminUnits(): Promise<{ ok: boolean; units: AdminUnit[] }> {
  return request("/api/admin/units", { headers: authHeaders() });
}

export function createUnit(payload: { name: string; order_idx: number }) {
  return request("/api/admin/units", { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
}

export function updateUnit(id: number, payload: Partial<{ name: string; order_idx: number }>) {
  return request(`/api/admin/units/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(payload) });
}

export function deleteUnit(id: number) {
  return request(`/api/admin/units/${id}`, { method: "DELETE", headers: authHeaders() });
}

export type AdminTopic = { id: number; unit_id: number; name: string; order_idx: number; unit_name: string };
export async function fetchAdminTopics(unit_id?: number): Promise<{ ok: boolean; topics: AdminTopic[] }> {
  const qs = unit_id ? `?unit_id=${unit_id}` : "";
  return request(`/api/admin/topics${qs}`, { headers: authHeaders() });
}

export function createTopic(payload: { unit_id: number; name: string; order_idx: number }) {
  return request("/api/admin/topics", { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
}
export function updateTopic(id: number, payload: Partial<{ unit_id: number; name: string; order_idx: number }>) {
  return request(`/api/admin/topics/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(payload) });
}
export function deleteTopic(id: number) {
  return request(`/api/admin/topics/${id}`, { method: "DELETE", headers: authHeaders() });
}

/* ================= Preguntas ================= */
export type AdminOption = { id?: number; label: string; text: string; is_correct: boolean };
export type AdminQuestion = {
  id: number;
  topic_id: number;
  stem: string;
  difficulty: number;
  explanation: string | null;
  topic_name: string;
  unit_id: number;
  unit_name: string;
  options: AdminOption[];
};
export type AdminQuestionsResponse = {
  ok: boolean;
  questions: AdminQuestion[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
};

export async function fetchAdminQuestions(params: {
  unit_id?: number;
  topic_id?: number;
  difficulty?: number;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<AdminQuestionsResponse> {
  const qs = new URLSearchParams();
  if (params.unit_id) qs.set("unit_id", String(params.unit_id));
  if (params.topic_id) qs.set("topic_id", String(params.topic_id));
  if (params.difficulty) qs.set("difficulty", String(params.difficulty));
  if (params.search) qs.set("search", params.search);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  return request(`/api/admin/questions?${qs.toString()}`, { headers: authHeaders() });
}

export function createQuestion(payload: {
  topic_id: number;
  stem: string;
  difficulty: number;
  explanation?: string | null;
  options: AdminOption[];
}) {
  return request("/api/admin/questions", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export function updateQuestion(id: number, payload: Partial<{ topic_id: number; stem: string; difficulty: number; explanation: string | null; options: AdminOption[] }>) {
  return request(`/api/admin/questions/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export function deleteQuestion(id: number) {
  return request(`/api/admin/questions/${id}`, { method: "DELETE", headers: authHeaders() });
}

export function addOption(questionId: number, payload: { label: string; text: string; is_correct?: boolean }) {
  return request(`/api/admin/questions/${questionId}/options`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
}

export function updateOption(optionId: number, payload: Partial<{ label: string; text: string; is_correct: boolean }>) {
  return request(`/api/admin/options/${optionId}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(payload) });
}

export function deleteOption(optionId: number) {
  return request(`/api/admin/options/${optionId}`, { method: "DELETE", headers: authHeaders() });
}

/* ================= Examenes ================= */
export type AdminExam = { id: number; name: string; duration_minutes: number; questions_count: number };
export async function fetchAdminExams(): Promise<{ ok: boolean; exams: AdminExam[] }> {
  return request("/api/admin/exams", { headers: authHeaders() });
}

export function createExam(payload: { name: string; duration_minutes: number }) {
  return request("/api/admin/exams", { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
}

export function updateExam(id: number, payload: Partial<{ name: string; duration_minutes: number }>) {
  return request(`/api/admin/exams/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(payload) });
}

export function deleteExam(id: number) {
  return request(`/api/admin/exams/${id}`, { method: "DELETE", headers: authHeaders() });
}

export type AdminExamQuestion = { question_id: number; order_idx: number; stem: string; difficulty: number; topic_name: string; unit_name: string };
export async function fetchExamQuestionsAdmin(examId: number): Promise<{ ok: boolean; questions: AdminExamQuestion[] }> {
  return request(`/api/admin/exams/${examId}/questions`, { headers: authHeaders() });
}

export function setExamQuestions(examId: number, questions: Array<{ question_id: number; order_idx: number }>) {
  return request(`/api/admin/exams/${examId}/questions`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ questions }),
  });
}

/* ================= Intentos ================= */
export type AdminAttempt = {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  mode: "practice" | "exam";
  exam_id: number | null;
  exam_name: string | null;
  topic_id: number | null;
  topic_name: string | null;
  score: number;
  started_at: string;
  submitted_at: string | null;
  duration_seconds: number | null;
  time_limit_seconds: number | null;
};

export type AdminAttemptsResponse = {
  ok: boolean;
  attempts: AdminAttempt[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
};

export async function fetchAdminAttempts(params: {
  user_id?: number;
  mode?: "practice" | "exam";
  exam_id?: number;
  limit?: number;
  offset?: number;
} = {}): Promise<AdminAttemptsResponse> {
  const qs = new URLSearchParams();
  if (params.user_id) qs.set("user_id", String(params.user_id));
  if (params.mode) qs.set("mode", params.mode);
  if (params.exam_id) qs.set("exam_id", String(params.exam_id));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  return request(`/api/admin/attempts?${qs.toString()}`, { headers: authHeaders() });
}

export type AttemptDetailAnswer = {
  id: number;
  question_id: number;
  option_id: number | null;
  selected_label: string | null;
  selected_option: { id: number; label: string | null; text: string | null } | null;
  is_correct: boolean | null;
  stem: string;
  options: AdminOption[];
};

export type AttemptDetail = {
  ok: boolean;
  attempt: {
    id: number;
    mode: "practice" | "exam";
    score: number;
    started_at: string;
    submitted_at: string | null;
    duration_seconds: number | null;
    time_limit_seconds: number | null;
    user: { id: number | null; name: string | null; email: string | null };
    exam: { id: number; name: string } | null;
    topic: { id: number; name: string } | null;
  };
  answers: AttemptDetailAnswer[];
};

export async function getAdminAttempt(id: number): Promise<AttemptDetail> {
  return request(`/api/admin/attempts/${id}`, { headers: authHeaders() });
}

/* ================= Eventos ================= */
export type AdminEvent = {
  id: number;
  user_id: number | null;
  user_email: string | null;
  event_type: string;
  payload: any;
  created_at: string;
};

export type AdminEventsResponse = {
  ok: boolean;
  events: AdminEvent[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
};

export async function fetchAdminEvents(params: {
  user_id?: number;
  event_type?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<AdminEventsResponse> {
  const qs = new URLSearchParams();
  if (params.user_id) qs.set("user_id", String(params.user_id));
  if (params.event_type) qs.set("event_type", params.event_type);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  return request(`/api/admin/events?${qs.toString()}`, { headers: authHeaders() });
}
