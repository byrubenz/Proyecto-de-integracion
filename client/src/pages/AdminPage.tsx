
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AppLayout from "../components/AppLayout";
import { Card } from "../components/ui/Card";
import {
  fetchAdminSummary,
  fetchAdminUsers,
  updateUserRole,
  fetchAdminUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  fetchAdminTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  fetchAdminQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  fetchAdminExams,
  createExam,
  updateExam,
  deleteExam,
  fetchExamQuestionsAdmin,
  setExamQuestions,
  fetchAdminAttempts,
  getAdminAttempt,
  fetchAdminEvents,
  type AdminUnit,
  type AdminTopic,
  type AdminQuestion,
  type AdminOption,
  type AdminExam,
  type AdminExamQuestion,
  type AdminAttempt,
  type AttemptDetail,
  type AdminEvent,
} from "../api/admin";

type Tab = "dashboard" | "users" | "content" | "questions" | "exams" | "attempts" | "events";
const tabs: Array<{ id: Tab; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "users", label: "Usuarios" },
  { id: "content", label: "Unidades y temas" },
  { id: "questions", label: "Preguntas" },
  { id: "exams", label: "Exámenes" },
  { id: "attempts", label: "Intentos" },
  { id: "events", label: "Eventos" },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  console.log("ADMIN PAGE MOUNTED");
  return (
    <AppLayout>
      <div className="container" style={{ padding: "24px 0 40px" }}>
        <h1 style={{ margin: "0 0 6px" }}>Panel de administrador</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Gestiona usuarios, contenidos, evaluaciones y analítica.
        </p>

        <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`btn ${t.id === tab ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          {tab === "dashboard" && <AdminDashboardSection />}
          {tab === "users" && <UsersSection />}
          {tab === "content" && <ContentSection />}
          {tab === "questions" && <QuestionsSection />}
          {tab === "exams" && <ExamsSection />}
          {tab === "attempts" && <AttemptsSection />}
          {tab === "events" && <EventsSection />}
        </div>
      </div>
    </AppLayout>
  );
}
/* ================= Dashboard ================= */
function AdminDashboardSection() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchAdminSummary>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminSummary()
      .then(setData)
      .catch(() => toast.error("No se pudo cargar el dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="muted">Cargando resumen...</p>;
  if (!data) return <p className="muted">Sin datos</p>;

  const counts = data.counts || {};

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
        <Card><Kpi label="Usuarios" value={counts.users} /></Card>
        <Card><Kpi label="Unidades" value={counts.units} /></Card>
        <Card><Kpi label="Temas" value={counts.topics} /></Card>
        <Card><Kpi label="Preguntas" value={counts.questions} /></Card>
        <Card><Kpi label="Exámenes" value={counts.exams} /></Card>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 12 }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Últimos intentos</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th className="muted" style={{ textAlign: "left", padding: 6 }}>Usuario</th>
                  <th className="muted" style={{ padding: 6 }}>Modo</th>
                  <th className="muted" style={{ padding: 6 }}>Score</th>
                  <th className="muted" style={{ padding: 6 }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {data.last_attempts.map((a) => (
                  <tr key={a.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                    <td style={{ padding: 6 }}>
                      <div style={{ fontWeight: 600 }}>{a.user_name || "Sin nombre"}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{a.user_email}</div>
                    </td>
                    <td style={{ textAlign: "center" }}>{a.mode}</td>
                    <td style={{ textAlign: "center" }}>{a.score}</td>
                    <td style={{ whiteSpace: "nowrap", padding: 6 }}>
                      {new Date(a.submitted_at ?? a.started_at).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Eventos recientes</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th className="muted" style={{ padding: 6, textAlign: "left" }}>Evento</th>
                  <th className="muted" style={{ padding: 6 }}>Usuario</th>
                  <th className="muted" style={{ padding: 6 }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {data.last_events.map((e) => (
                  <tr key={e.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                    <td style={{ padding: 6 }}>{e.event_type}</td>
                    <td style={{ padding: 6 }}>{e.user_email ?? "—"}</td>
                    <td style={{ whiteSpace: "nowrap", padding: 6 }}>
                      {new Date(e.created_at).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ================= Usuarios ================= */
type AdminUsersResponse = Awaited<ReturnType<typeof fetchAdminUsers>>;

function UsersSection() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [users, setUsers] = useState<AdminUsersResponse["users"]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    fetchAdminUsers({ search, limit, offset: page * limit })
      .then((resp) => {
        setUsers(resp.users);
        setTotal(resp.total);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [search, page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const changeRole = async (id: number, role: "admin" | "student") => {
    try {
      await updateUserRole(id, role);
      toast.success("Rol actualizado");
      fetchAdminUsers({ search, limit, offset: page * limit }).then((resp) => {
        setUsers(resp.users);
        setTotal(resp.total);
      });
    } catch (err: any) {
      toast.error(err?.message || "No se pudo actualizar");
    }
  };

  return (
    <Card>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Usuarios</h3>
        <input
          className="input"
          placeholder="Buscar por nombre o email"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          style={{ maxWidth: 240 }}
        />
      </div>

      {loading ? (
        <p className="muted">Cargando usuarios...</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th className="muted" style={{ padding: 8, textAlign: "left" }}>ID</th>
                <th className="muted" style={{ textAlign: "left", padding: 8 }}>Nombre</th>
                <th className="muted" style={{ padding: 8 }}>Email</th>
                <th className="muted" style={{ padding: 8 }}>Rol</th>
                <th className="muted" style={{ padding: 8 }}>Creado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                  <td style={{ padding: 8 }}>{u.id}</td>
                  <td style={{ padding: 8 }}>{u.name}</td>
                  <td style={{ padding: 8 }}>{u.email}</td>
                  <td style={{ padding: 8, textAlign: "center" }}>
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value as "admin" | "student")}
                      className="input"
                      style={{ height: 36, width: 140 }}
                    >
                      <option value="student">student</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td style={{ padding: 8 }}>
                    {new Date(u.created_at).toLocaleDateString("es-CL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="row" style={{ marginTop: 12, justifyContent: "space-between" }}>
        <div className="muted">Total: {total}</div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-ghost" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>◀</button>
          <span className="muted">Página {page + 1} / {totalPages}</span>
          <button className="btn btn-ghost" disabled={(page + 1) >= totalPages} onClick={() => setPage((p) => p + 1)}>▶</button>
        </div>
      </div>
    </Card>
  );
}
/* ================= Unidades y temas ================= */
function ContentSection() {
  const [units, setUnits] = useState<AdminUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUnit, setNewUnit] = useState({ name: "", order_idx: 1 });
  const [topicForm, setTopicForm] = useState({ unit_id: 0, name: "", order_idx: 1 });

  const load = () => {
    setLoading(true);
    fetchAdminUnits()
      .then((resp) => setUnits(resp.units))
      .catch(() => toast.error("No se pudieron cargar las unidades"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUnit(newUnit);
      toast.success("Unidad creada");
      setNewUnit({ name: "", order_idx: 1 });
      load();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo crear la unidad");
    }
  };

  const handleUpdateUnit = async (unit: AdminUnit, changes: Partial<AdminUnit>) => {
    try {
      await updateUnit(unit.id, changes);
      toast.success("Unidad actualizada");
      load();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo actualizar");
    }
  };

  const handleDeleteUnit = async (id: number) => {
    if (!window.confirm("¿Eliminar unidad?")) return;
    try {
      await deleteUnit(id);
      load();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo eliminar");
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTopic(topicForm);
      toast.success("Topic creado");
      setTopicForm({ unit_id: topicForm.unit_id, name: "", order_idx: 1 });
      load();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo crear el topic");
    }
  };

  const handleUpdateTopic = async (topicId: number, payload: Partial<AdminTopic>) => {
    try {
      await updateTopic(topicId, payload);
      toast.success("Topic actualizado");
      load();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo actualizar");
    }
  };

  const handleDeleteTopic = async (id: number) => {
    if (!window.confirm("¿Eliminar topic?")) return;
    try {
      await deleteTopic(id);
      load();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo eliminar el topic");
    }
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <Card>
        <h3 style={{ marginTop: 0 }}>Crear unidad</h3>
        <form onSubmit={handleCreateUnit} className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <input className="input" placeholder="Nombre" required value={newUnit.name} onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })} style={{ minWidth: 200 }} />
          <input className="input" placeholder="order_idx" type="number" min={1} required value={newUnit.order_idx} onChange={(e) => setNewUnit({ ...newUnit, order_idx: Number(e.target.value) })} style={{ width: 120 }} />
          <button className="btn btn-primary" type="submit">Guardar</button>
        </form>
      </Card>

      <Card>
        <h3 style={{ marginTop: 0 }}>Crear topic</h3>
        <form onSubmit={handleCreateTopic} className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <select className="input" required value={topicForm.unit_id} onChange={(e) => setTopicForm({ ...topicForm, unit_id: Number(e.target.value) })} style={{ minWidth: 200 }}>
            <option value={0}>Selecciona unidad</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <input className="input" placeholder="Nombre del topic" required value={topicForm.name} onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })} style={{ minWidth: 200 }} />
          <input className="input" placeholder="order_idx" type="number" min={1} required value={topicForm.order_idx} onChange={(e) => setTopicForm({ ...topicForm, order_idx: Number(e.target.value) })} style={{ width: 120 }} />
          <button className="btn btn-primary" type="submit">Guardar</button>
        </form>
      </Card>

      {loading ? (
        <p className="muted">Cargando...</p>
      ) : (
        <div className="grid" style={{ gap: 12 }}>
          {units.map((u) => (
            <Card key={u.id}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div className="row" style={{ gap: 8 }}>
                  <input className="input" defaultValue={u.name} onBlur={(e) => e.target.value !== u.name && handleUpdateUnit(u, { name: e.target.value })} style={{ minWidth: 180 }} />
                  <input className="input" type="number" defaultValue={u.order_idx} onBlur={(e) => Number(e.target.value) !== u.order_idx && handleUpdateUnit(u, { order_idx: Number(e.target.value) })} style={{ width: 100 }} />
                </div>
                <button className="btn btn-ghost" onClick={() => handleDeleteUnit(u.id)}>Eliminar</button>
              </div>
              <div style={{ marginTop: 10 }}>
                <div className="muted" style={{ marginBottom: 4 }}>Topics</div>
                {u.topics.length === 0 ? (
                  <p className="muted">Sin topics</p>
                ) : (
                  <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 8 }}>
                    {u.topics.map((t) => (
                      <div key={t.id} className="card" style={{ background: "rgba(255,255,255,0.02)", borderColor: "var(--card-border)" }}>
                        <input className="input" defaultValue={t.name} onBlur={(e) => e.target.value !== t.name && handleUpdateTopic(t.id, { name: e.target.value })} style={{ width: "100%", marginBottom: 6 }} />
                        <div className="row" style={{ gap: 6 }}>
                          <input className="input" type="number" defaultValue={t.order_idx} onBlur={(e) => Number(e.target.value) !== t.order_idx && handleUpdateTopic(t.id, { order_idx: Number(e.target.value) })} style={{ width: 100 }} />
                          <button className="btn btn-ghost" onClick={() => handleDeleteTopic(t.id)} style={{ flex: 1 }}>Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
/* ================= Preguntas ================= */
type QuestionFormState = {
  id?: number;
  topic_id: number | null;
  stem: string;
  difficulty: number;
  explanation: string;
  options: AdminOption[];
};

const emptyQuestion = (topicId: number | null): QuestionFormState => ({
  topic_id: topicId,
  stem: "",
  difficulty: 1,
  explanation: "",
  options: [
    { label: "A", text: "", is_correct: true },
    { label: "B", text: "", is_correct: false },
  ],
});

function QuestionsSection() {
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [filters, setFilters] = useState<{ unit_id?: number; topic_id?: number; difficulty?: number; search?: string }>({});
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limit = 10;
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<QuestionFormState>(emptyQuestion(null));

  const loadTopics = () => {
    fetchAdminTopics()
      .then((resp) => setTopics(resp.topics))
      .catch(() => toast.error("No se pudieron cargar topics"));
  };

  useEffect(() => { loadTopics(); }, []);

  const loadQuestions = () => {
    setLoading(true);
    fetchAdminQuestions({ ...filters, limit, offset: page * limit })
      .then((resp) => {
        setQuestions(resp.questions);
        setTotal(resp.total);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadQuestions(); }, [filters, page]);

  const setCorrect = (idx: number) => {
    setForm((f) => ({
      ...f,
      options: f.options.map((o, i) => ({ ...o, is_correct: i === idx })),
    }));
  };

  const updateOptionField = (idx: number, field: keyof AdminOption, value: string | boolean) => {
    setForm((f) => ({
      ...f,
      options: f.options.map((o, i) => i === idx ? { ...o, [field]: value } : o),
    }));
  };

  const addOption = () => {
    const nextLabel = String.fromCharCode(65 + form.options.length);
    setForm((f) => ({ ...f, options: [...f.options, { label: nextLabel, text: "", is_correct: false }] }));
  };

  const removeOption = (idx: number) => {
    setForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topic_id) return toast.error("Selecciona un topic");
    try {
      const payload = {
        topic_id: form.topic_id,
        stem: form.stem,
        difficulty: form.difficulty,
        explanation: form.explanation,
        options: form.options,
      };
      if (form.id) {
        await updateQuestion(form.id, payload);
        toast.success("Pregunta actualizada");
      } else {
        await createQuestion(payload);
        toast.success("Pregunta creada");
      }
      setForm(emptyQuestion(form.topic_id));
      loadQuestions();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo guardar");
    }
  };

  const startEdit = (q: AdminQuestion) => {
    setForm({
      id: q.id,
      topic_id: q.topic_id,
      stem: q.stem,
      difficulty: q.difficulty,
      explanation: q.explanation || "",
      options: q.options,
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Eliminar pregunta?")) return;
    try {
      await deleteQuestion(id);
      loadQuestions();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo eliminar");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="grid" style={{ gap: 16 }}>
      <Card>
        <h3 style={{ marginTop: 0 }}>{form.id ? "Editar pregunta" : "Crear pregunta"}</h3>
        <form onSubmit={handleSubmit} className="grid" style={{ gap: 10 }}>
          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            <select className="input" required value={form.topic_id ?? ""} onChange={(e) => setForm({ ...form, topic_id: Number(e.target.value) })} style={{ minWidth: 200 }}>
              <option value="">Topic</option>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.unit_name} / {t.name}</option>)}
            </select>
            <select className="input" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })} style={{ width: 140 }}>
              <option value={1}>Dificultad 1</option>
              <option value={2}>Dificultad 2</option>
              <option value={3}>Dificultad 3</option>
            </select>
          </div>
          <textarea className="input" placeholder="Enunciado" required value={form.stem} onChange={(e) => setForm({ ...form, stem: e.target.value })} style={{ minHeight: 70 }} />
          <textarea className="input" placeholder="Explicación (opcional)" value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} style={{ minHeight: 60 }} />
          <div className="grid" style={{ gap: 8 }}>
            {form.options.map((opt, idx) => (
              <div key={idx} className="card" style={{ background: "rgba(255,255,255,0.02)", borderColor: "var(--card-border)" }}>
                <div className="row" style={{ gap: 8, alignItems: "center" }}>
                  <input className="input" value={opt.label} onChange={(e) => updateOptionField(idx, "label", e.target.value.toUpperCase())} style={{ width: 60 }} />
                  <input className="input" value={opt.text} onChange={(e) => updateOptionField(idx, "text", e.target.value)} placeholder="Texto" style={{ flex: 1 }} />
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="radio" checked={opt.is_correct} onChange={() => setCorrect(idx)} />
                    Correcta
                  </label>
                  <button type="button" className="btn btn-ghost" onClick={() => removeOption(idx)} disabled={form.options.length <= 2}>Eliminar</button>
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-ghost" onClick={addOption}>Agregar opción</button>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-primary" type="submit">{form.id ? "Actualizar" : "Crear"}</button>
            {form.id && <button className="btn btn-ghost" type="button" onClick={() => setForm(emptyQuestion(form.topic_id))}>Cancelar</button>}
          </div>
        </form>
      </Card>

      <Card>
        <h3 style={{ marginTop: 0 }}>Preguntas</h3>
        <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <select className="input" value={filters.unit_id ?? ""} onChange={(e) => { setFilters({ ...filters, unit_id: e.target.value ? Number(e.target.value) : undefined }); setPage(0); }} style={{ minWidth: 160 }}>
            <option value="">Unidad</option>
            {[...new Set(topics.map((t) => `${t.unit_id}|${t.unit_name}`))].map((key) => {
              const [id, name] = key.split("|");
              return <option key={id} value={id}>{name}</option>;
            })}
          </select>
          <select className="input" value={filters.topic_id ?? ""} onChange={(e) => { setFilters({ ...filters, topic_id: e.target.value ? Number(e.target.value) : undefined }); setPage(0); }} style={{ minWidth: 180 }}>
            <option value="">Topic</option>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.unit_name} / {t.name}</option>)}
          </select>
          <select className="input" value={filters.difficulty ?? ""} onChange={(e) => { setFilters({ ...filters, difficulty: e.target.value ? Number(e.target.value) : undefined }); setPage(0); }} style={{ width: 160 }}>
            <option value="">Dificultad</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
          <input className="input" placeholder="Buscar" value={filters.search ?? ""} onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(0); }} style={{ minWidth: 180 }} />
        </div>

        {loading ? (
          <p className="muted">Cargando preguntas...</p>
        ) : (
          <div className="grid" style={{ gap: 10 }}>
            {questions.map((q) => (
              <div key={q.id} className="card" style={{ borderColor: "var(--card-border)" }}>
                <div className="row" style={{ justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <div className="muted" style={{ fontSize: 12 }}>{q.unit_name} / {q.topic_name}</div>
                    <div style={{ fontWeight: 700 }}>{q.stem}</div>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <span className="muted">Dif: {q.difficulty}</span>
                    <button className="btn btn-ghost" onClick={() => startEdit(q)}>Editar</button>
                    <button className="btn btn-ghost" onClick={() => handleDelete(q.id)}>Eliminar</button>
                  </div>
                </div>
                <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                  {q.options.map((o) => (
                    <li key={o.id} style={{ color: o.is_correct ? "var(--accent-500)" : "var(--text-100)" }}>
                      <strong>{o.label}.</strong> {o.text} {o.is_correct ? "(correcta)" : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <div className="row" style={{ marginTop: 10, justifyContent: "space-between", alignItems: "center" }}>
          <div className="muted">Total: {total}</div>
          <div className="row" style={{ gap: 6 }}>
            <button className="btn btn-ghost" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>◀</button>
            <span className="muted">Página {page + 1} / {Math.max(1, totalPages)}</span>
            <button className="btn btn-ghost" disabled={(page + 1) >= totalPages} onClick={() => setPage((p) => p + 1)}>▶</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
/* ================= Examenes ================= */
function ExamsSection() {
  const [exams, setExams] = useState<AdminExam[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [examQuestions, setExamQuestionsState] = useState<AdminExamQuestion[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [examForm, setExamForm] = useState<{ name: string; duration_minutes: number }>({ name: "", duration_minutes: 60 });
  const [assignForm, setAssignForm] = useState<{ question_id: number | null; order_idx: number }>({ question_id: null, order_idx: 1 });

  const loadExams = () => {
    setLoading(true);
    fetchAdminExams()
      .then((resp) => setExams(resp.exams))
      .catch(() => toast.error("No se pudieron cargar exámenes"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadExams(); fetchAdminQuestions({ limit: 100 }).then((r) => setAvailableQuestions(r.questions)).catch(() => null); }, []);

  const selectExam = (exam: AdminExam) => {
    setSelected(exam.id);
    setExamForm({ name: exam.name, duration_minutes: exam.duration_minutes });
    fetchExamQuestionsAdmin(exam.id)
      .then((resp) => setExamQuestionsState(resp.questions))
      .catch(() => toast.error("No se pudieron cargar preguntas del examen"));
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createExam(examForm);
      toast.success("Examen creado");
      setExamForm({ name: "", duration_minutes: 60 });
      loadExams();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo crear");
    }
  };

  const handleUpdateExam = async () => {
    if (!selected) return;
    try {
      await updateExam(selected, examForm);
      toast.success("Examen actualizado");
      loadExams();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo actualizar");
    }
  };

  const handleDeleteExam = async (id: number) => {
    if (!window.confirm("¿Eliminar examen?")) return;
    try {
      await deleteExam(id);
      if (selected === id) { setSelected(null); setExamQuestionsState([]); }
      loadExams();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo eliminar");
    }
  };

  const addQuestionToExam = () => {
    if (!assignForm.question_id) return;
    if (examQuestions.some((q) => q.question_id === assignForm.question_id)) {
      return toast.error("Ya está asignada");
    }
    const q = availableQuestions.find((qq) => qq.id === assignForm.question_id);
    if (!q) return;
    setExamQuestionsState((prev) => [...prev, {
      question_id: q.id,
      order_idx: assignForm.order_idx || prev.length + 1,
      stem: q.stem,
      difficulty: q.difficulty,
      topic_name: q.topic_name,
      unit_name: q.unit_name,
    }]);
    setAssignForm({ question_id: null, order_idx: examQuestions.length + 2 });
  };

  const saveComposition = async () => {
    if (!selected) return;
    try {
      await setExamQuestions(selected, examQuestions.map((q, idx) => ({
        question_id: q.question_id,
        order_idx: Number.isFinite(q.order_idx) ? Number(q.order_idx) : idx + 1,
      })));
      toast.success("Preguntas asignadas");
      const ex = exams.find((e) => e.id === selected);
      if (ex) selectExam(ex);
    } catch (err: any) {
      toast.error(err?.message || "No se pudo asignar");
    }
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <Card>
        <h3 style={{ marginTop: 0 }}>Nuevo examen</h3>
        <form onSubmit={handleCreateExam} className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <input className="input" placeholder="Nombre" required value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} style={{ minWidth: 220 }} />
          <input className="input" type="number" min={1} required value={examForm.duration_minutes} onChange={(e) => setExamForm({ ...examForm, duration_minutes: Number(e.target.value) })} style={{ width: 180 }} />
          <button className="btn btn-primary" type="submit">Crear</button>
        </form>
      </Card>

      <Card>
        <h3 style={{ marginTop: 0 }}>Exámenes</h3>
        {loading ? (
          <p className="muted">Cargando...</p>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
            {exams.map((ex) => (
              <div key={ex.id} className="card" style={{ border: selected === ex.id ? "1px solid var(--accent-500)" : "1px solid var(--card-border)" }}>
                <div style={{ fontWeight: 700 }}>{ex.name}</div>
                <div className="muted">Duración: {ex.duration_minutes} min</div>
                <div className="muted">Preguntas: {ex.questions_count}</div>
                <div className="row" style={{ gap: 6, marginTop: 8 }}>
                  <button className="btn btn-primary" onClick={() => selectExam(ex)}>Editar</button>
                  <button className="btn btn-ghost" onClick={() => handleDeleteExam(ex.id)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {selected && (
        <Card>
          <div className="row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0 }}>Editar examen</h3>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-primary" onClick={handleUpdateExam}>Guardar examen</button>
              <button className="btn btn-ghost" onClick={saveComposition}>Guardar preguntas</button>
            </div>
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <input className="input" value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} style={{ minWidth: 240 }} />
            <input className="input" type="number" value={examForm.duration_minutes} onChange={(e) => setExamForm({ ...examForm, duration_minutes: Number(e.target.value) })} style={{ width: 160 }} />
          </div>
          <div className="grid" style={{ gridTemplateColumns: "1.2fr 0.8fr", gap: 12, marginTop: 12 }}>
            <div className="card" style={{ borderColor: "var(--card-border)" }}>
              <h4 style={{ marginTop: 0 }}>Preguntas asignadas</h4>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th className="muted" style={{ padding: 6 }}>Orden</th>
                      <th className="muted" style={{ padding: 6, textAlign: "left" }}>Pregunta</th>
                      <th className="muted" style={{ padding: 6 }}>Tema</th>
                      <th className="muted" style={{ padding: 6 }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examQuestions.map((q, idx) => (
                      <tr key={q.question_id} style={{ borderTop: "1px solid var(--card-border)" }}>
                        <td style={{ padding: 6, textAlign: "center" }}>
                          <input className="input" type="number" value={q.order_idx} onChange={(e) => setExamQuestionsState((prev) => prev.map((item, i) => i === idx ? { ...item, order_idx: Number(e.target.value) } : item))} style={{ width: 80 }} />
                        </td>
                        <td style={{ padding: 6 }}>{q.stem.slice(0, 80)}...</td>
                        <td style={{ padding: 6 }}>{q.unit_name} / {q.topic_name}</td>
                        <td style={{ padding: 6, textAlign: "right" }}>
                          <button className="btn btn-ghost" onClick={() => setExamQuestionsState((prev) => prev.filter((_, i) => i !== idx))}>Quitar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card" style={{ borderColor: "var(--card-border)" }}>
              <h4 style={{ marginTop: 0 }}>Agregar pregunta</h4>
              <select className="input" value={assignForm.question_id ?? ""} onChange={(e) => setAssignForm({ ...assignForm, question_id: Number(e.target.value) })} style={{ width: "100%", marginBottom: 8 }}>
                <option value="">Seleccionar</option>
                {availableQuestions.map((q) => (
                  <option key={q.id} value={q.id}>{q.unit_name} / {q.topic_name} / Dif {q.difficulty} / #{q.id}</option>
                ))}
              </select>
              <input className="input" type="number" value={assignForm.order_idx} onChange={(e) => setAssignForm({ ...assignForm, order_idx: Number(e.target.value) })} />
              <button className="btn btn-primary" style={{ marginTop: 8, width: "100%" }} onClick={addQuestionToExam}>Agregar</button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
/* ================= Intentos ================= */
function AttemptsSection() {
  const [filters, setFilters] = useState<{ user_id?: number; mode?: "practice" | "exam"; exam_id?: number }>({});
  const [attempts, setAttempts] = useState<AdminAttempt[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limit = 15;
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AttemptDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchAdminAttempts({ ...filters, limit, offset: page * limit })
      .then((resp) => { setAttempts(resp.attempts); setTotal(resp.total); })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filters, page]);

  const viewDetail = async (id: number) => {
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);
    setDetailOpen(true);
    try {
      const data = await getAdminAttempt(id);
      setDetail(data);
    } catch (err: any) {
      const msg = err?.message || "No se pudo cargar el detalle";
      setDetailError(msg);
      toast.error(msg);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="grid" style={{ gap: 16 }}>
      <Card>
        <h3 style={{ marginTop: 0 }}>Intentos</h3>
        <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <input className="input" type="number" placeholder="user_id" value={filters.user_id ?? ""} onChange={(e) => { setFilters({ ...filters, user_id: e.target.value ? Number(e.target.value) : undefined }); setPage(0); }} style={{ width: 120 }} />
          <select className="input" value={filters.mode ?? ""} onChange={(e) => { setFilters({ ...filters, mode: e.target.value ? e.target.value as "practice" | "exam" : undefined }); setPage(0); }} style={{ width: 160 }}>
            <option value="">Modo</option>
            <option value="practice">practice</option>
            <option value="exam">exam</option>
          </select>
          <input className="input" type="number" placeholder="exam_id" value={filters.exam_id ?? ""} onChange={(e) => { setFilters({ ...filters, exam_id: e.target.value ? Number(e.target.value) : undefined }); setPage(0); }} style={{ width: 120 }} />
        </div>

        {loading ? (
          <p className="muted">Cargando intentos...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th className="muted" style={{ padding: 6 }}>ID</th>
                  <th className="muted" style={{ padding: 6 }}>Usuario</th>
                  <th className="muted" style={{ padding: 6 }}>Modo</th>
                  <th className="muted" style={{ padding: 6 }}>Score</th>
                  <th className="muted" style={{ padding: 6 }}>Fecha</th>
                  <th className="muted" style={{ padding: 6 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                    <td style={{ padding: 6 }}>{a.id}</td>
                    <td style={{ padding: 6 }}>
                      <div>{a.user_name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{a.user_email}</div>
                    </td>
                    <td style={{ padding: 6, textAlign: "center" }}>{a.mode}</td>
                    <td style={{ padding: 6, textAlign: "center" }}>{a.score}</td>
                    <td style={{ padding: 6, whiteSpace: "nowrap" }}>{new Date(a.submitted_at ?? a.started_at).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}</td>
                    <td style={{ padding: 6, textAlign: "right" }}>
                      <button className="btn btn-ghost" onClick={() => viewDetail(a.id)}>Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="row" style={{ marginTop: 10, justifyContent: "space-between" }}>
          <div className="muted">Total: {total}</div>
          <div className="row" style={{ gap: 6 }}>
            <button className="btn btn-ghost" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>◀</button>
            <span className="muted">Página {page + 1} / {totalPages}</span>
            <button className="btn btn-ghost" disabled={(page + 1) >= totalPages} onClick={() => setPage((p) => p + 1)}>▶</button>
          </div>
        </div>
      </Card>

      {detailOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          padding: 16,
        }}>
          <div className="card" style={{ maxWidth: 900, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Detalle intento {detail?.attempt.id ? `#${detail.attempt.id}` : ""}</h3>
              <button className="btn btn-ghost" onClick={() => { setDetailOpen(false); setDetail(null); setDetailError(null); }}>Cerrar</button>
            </div>

            {detailLoading && <p className="muted" style={{ marginTop: 8 }}>Cargando detalle...</p>}
            {detailError && <p className="muted" style={{ color: "var(--accent-500)", marginTop: 8 }}>{detailError}</p>}

            {detail && !detailLoading && !detailError && (
              <>
                <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8, marginTop: 8 }}>
                  <Kpi label="Usuario" value={detail.attempt.user?.email || "Sin email"} />
                  <Kpi label="Nombre" value={detail.attempt.user?.name || "-"} />
                  <Kpi label="Modo" value={detail.attempt.mode} />
                  <Kpi label="Score" value={detail.attempt.score} />
                  <Kpi label="Duración" value={detail.attempt.duration_seconds ?? 0} sub="segundos" />
                  {detail.attempt.exam && <Kpi label="Examen" value={detail.attempt.exam.name} />}
                </div>

                <div style={{ marginTop: 12, overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th className="muted" style={{ padding: 6 }}>Pregunta</th>
                        <th className="muted" style={{ padding: 6 }}>Elegida</th>
                        <th className="muted" style={{ padding: 6 }}>Texto elegido</th>
                        <th className="muted" style={{ padding: 6 }}>Correcta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.answers.map((ans) => (
                        <tr key={ans.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                          <td style={{ padding: 6 }}>{ans.stem}</td>
                          <td style={{ padding: 6, textAlign: "center" }}>{ans.selected_label ?? "-"}</td>
                          <td style={{ padding: 6 }}>{ans.selected_option?.text ?? "-"}</td>
                          <td style={{ padding: 6, color: ans.is_correct === false ? "#e86c6c" : "var(--accent-500)" }}>
                            {ans.is_correct === null ? "-" : ans.is_correct ? "Sí" : "No"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= Eventos ================= */
function EventsSection() {
  const [filters, setFilters] = useState<{ user_id?: number; event_type?: string; from?: string; to?: string }>({});
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limit = 20;
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchAdminEvents({ ...filters, limit, offset: page * limit })
      .then((resp) => { setEvents(resp.events); setTotal(resp.total); })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filters, page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>Eventos</h3>
      <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <input className="input" type="number" placeholder="user_id" value={filters.user_id ?? ""} onChange={(e) => { setFilters({ ...filters, user_id: e.target.value ? Number(e.target.value) : undefined }); setPage(0); }} style={{ width: 120 }} />
        <input className="input" placeholder="event_type" value={filters.event_type ?? ""} onChange={(e) => { setFilters({ ...filters, event_type: e.target.value || undefined }); setPage(0); }} style={{ minWidth: 180 }} />
        <input className="input" type="date" value={filters.from ?? ""} onChange={(e) => { setFilters({ ...filters, from: e.target.value || undefined }); setPage(0); }} />
        <input className="input" type="date" value={filters.to ?? ""} onChange={(e) => { setFilters({ ...filters, to: e.target.value || undefined }); setPage(0); }} />
      </div>

      {loading ? (
        <p className="muted">Cargando eventos...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th className="muted" style={{ padding: 6 }}>Tipo</th>
                <th className="muted" style={{ padding: 6 }}>Usuario</th>
                <th className="muted" style={{ padding: 6 }}>Fecha</th>
                <th className="muted" style={{ padding: 6 }}>Payload</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                  <td style={{ padding: 6 }}>{ev.event_type}</td>
                  <td style={{ padding: 6 }}>{ev.user_email ?? "—"}</td>
                  <td style={{ padding: 6, whiteSpace: "nowrap" }}>{new Date(ev.created_at).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td style={{ padding: 6 }}>
                    <pre style={{ whiteSpace: "pre-wrap", maxHeight: 140, overflow: "auto", margin: 0, fontSize: 12 }}>
                      {ev.payload ? JSON.stringify(ev.payload, null, 2) : "—"}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="row" style={{ marginTop: 10, justifyContent: "space-between" }}>
        <div className="muted">Total: {total}</div>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn btn-ghost" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>◀</button>
          <span className="muted">Página {page + 1} / {totalPages}</span>
          <button className="btn btn-ghost" disabled={(page + 1) >= totalPages} onClick={() => setPage((p) => p + 1)}>▶</button>
        </div>
      </div>
    </Card>
  );
}

/* ================= Utilidades ================= */
function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div>
      <div className="muted" style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 900, fontSize: 26 }}>{value}</div>
      {sub && <div className="muted" style={{ fontSize: 12 }}>{sub}</div>}
    </div>
  );
}
