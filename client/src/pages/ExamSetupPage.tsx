import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { startExam, type ExamSection } from "../api/exams";
import { fetchSummary } from "../api/attempts";
import { fetchAllTopics, type TopicLite } from "../api/topics";
import AppLayout from "../components/AppLayout";

const DRAFT_KEY = "exam_setup_draft_v1";

type Grouped = { unitLabel: string; items: TopicLite[] };

export default function ExamSetupPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("Ensayo full");
  const [timeLimit, setTimeLimit] = useState<number | "">("");
  const [sections, setSections] = useState<ExamSection[]>([
    { topic_id: 1, count: 5 },
    { topic_id: 2, count: 5 },
  ]);
  const [loading, setLoading] = useState(false);

  // Temas
  const [topics, setTopics] = useState<TopicLite[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);

  // Opcional: peor tema para “plantilla”
  const [weakTopicId, setWeakTopicId] = useState<number | null>(null);

  const [errors, setErrors] = useState<string[]>([]);

  // ---------- Helpers ----------
  const labelFor = (t: TopicLite) =>
    t.unit_name ? `${t.name}` : t.name;

  const groupByUnit = (list: TopicLite[]): Grouped[] => {
    // Ordenamos por unidad y luego por nombre
    const sorted = [...list].sort((a, b) => {
      const ua = (a.unit_name ?? "").localeCompare(b.unit_name ?? "");
      if (ua !== 0) return ua;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });

    const map = new Map<string, TopicLite[]>();
    for (const t of sorted) {
      const key = t.unit_name || "Otros temas";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    const groups: Grouped[] = [];
    for (const [unit, items] of map.entries()) {
      groups.push({
        unitLabel: `${unit} ${unit === "Otros temas" ? "" : `(${items.length})`}`.trim(),
        items,
      });
    }
    // “Otros temas” al final
    return groups.sort((a, b) =>
      a.unitLabel === "Otros temas" ? 1 : b.unitLabel === "Otros temas" ? -1 : a.unitLabel.localeCompare(b.unitLabel)
    );
  };

  const groupedTopics = useMemo(() => groupByUnit(topics), [topics]);

  const totalQuestions = useMemo(
    () => sections.reduce((acc, s) => acc + (Number(s.count) || 0), 0),
    [sections]
  );

  // ---------- Effects ----------
  useEffect(() => {
    // Cargar draft
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (typeof draft?.title === "string") setTitle(draft.title);
        if (draft?.timeLimit === "" || Number.isFinite(draft?.timeLimit)) {
          setTimeLimit(draft.timeLimit);
        }
        if (Array.isArray(draft?.sections) && draft.sections.length > 0) {
          setSections(
            draft.sections.map((s: any) => ({
              topic_id: Number(s.topic_id),
              count: Number(s.count),
            }))
          );
        }
      }
    } catch {}

    // Cargar “tema a reforzar”
    (async () => {
      try {
        const sum = await fetchSummary();
        if (sum?.worst_topic?.topic_id) {
          setWeakTopicId(Number(sum.worst_topic.topic_id));
        }
      } catch {}
    })();

    // Cargar temas
    (async () => {
      try {
        const list = await fetchAllTopics();
        setTopics(list);
      } catch {
        toast.error("No se pudieron cargar los temas");
      } finally {
        setLoadingTopics(false);
      }
    })();
  }, []);

  // Autosave
  useEffect(() => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ title, timeLimit, sections })
    );
  }, [title, timeLimit, sections]);

  // ---------- Actions ----------
  const updateSection = (idx: number, key: "topic_id" | "count", val: number) => {
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [key]: val } : s))
    );
  };

  const addSection = () =>
    setSections((prev) => [
      ...prev,
      { topic_id: topics[0]?.id ?? 1, count: 5 },
    ]);

  const removeSection = (idx: number) =>
    setSections((prev) => prev.filter((_, i) => i !== idx));

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!title.trim()) errs.push("El título no puede estar vacío.");
    if (timeLimit !== "" && (!Number.isFinite(timeLimit) || Number(timeLimit) < 60)) {
      errs.push("El límite de tiempo debe ser ≥ 60 segundos (o vacío).");
    }
    if (sections.length === 0) errs.push("Agrega al menos una sección.");

    const seen = new Set<number>();
    for (const [i, s] of sections.entries()) {
      if (!Number.isFinite(s.topic_id) || s.topic_id <= 0) {
        errs.push(`Sección #${i + 1}: tema inválido.`);
      } else if (!topics.some((t) => t.id === s.topic_id)) {
        errs.push(`Sección #${i + 1}: el tema seleccionado ya no existe.`);
      }
      if (!Number.isFinite(s.count) || s.count <= 0) {
        errs.push(`Sección #${i + 1}: cantidad debe ser > 0.`);
      }
      if (seen.has(s.topic_id)) {
        errs.push(`Sección #${i + 1}: tema repetido.`);
      }
      seen.add(s.topic_id);
    }
    return errs;
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (errs.length > 0) {
      toast.error("Revisa los campos.");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        title: title.trim(),
        time_limit_seconds: timeLimit === "" ? null : Number(timeLimit),
        sections: sections.map((s) => ({
          topic_id: Number(s.topic_id),
          count: Number(s.count),
        })),
      };
      const res = await startExam(payload);
      toast.success("Ensayo iniciado");
      localStorage.removeItem(DRAFT_KEY);
      navigate(`/ensayo/${res.attempt_id}`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al iniciar el ensayo";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
  return (
    <AppLayout>
      <div className="container" style={{ padding: "28px 0" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 0 }}>
          📝 Configurar ensayo
        </h2>

        {loadingTopics ? (
          <p className="muted">Cargando temas…</p>
        ) : (
          <form onSubmit={handleStart}>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Columna izquierda: opciones principales */}
              <div className="card">
                <div className="card" style={{ background: "rgba(255,255,255,.03)" }}>
                  <div className="muted" style={{ fontSize: 12 }}>Título</div>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Ensayo full"
                    style={{
                      width: "100%", height: 44, borderRadius: 10, marginTop: 6,
                      border: "1px solid var(--card-border)", background: "rgba(255,255,255,.06)",
                      color: "var(--text-100)", padding: "0 12px"
                    }}
                  />
                </div>

                <div className="row" style={{ marginTop: 12 }}>
                  <div className="card" style={{ flex: 1 }}>
                    <div className="muted" style={{ fontSize: 12 }}>Límite de tiempo (segundos) — opcional</div>
                    <input
                      type="number"
                      min={60}
                      placeholder="ej: 7200"
                      value={timeLimit}
                      onChange={(e) =>
                        setTimeLimit(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      style={{
                        width: "100%", height: 44, borderRadius: 10, marginTop: 6,
                        border: "1px solid var(--card-border)",
                        background: "rgba(255,255,255,.06)", color: "var(--text-100)", padding: "0 12px"
                      }}
                    />
                    <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                      <button type="button" className="btn btn-ghost" onClick={() => setTimeLimit(600)}>10 min</button>
                      <button type="button" className="btn btn-ghost" onClick={() => setTimeLimit(1800)}>30 min</button>
                      <button type="button" className="btn btn-ghost" onClick={() => setTimeLimit(3600)}>60 min</button>
                      <button type="button" className="btn btn-ghost" onClick={() => setTimeLimit("")}>Sin límite</button>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ marginTop: 12 }}>
                  <div className="muted" style={{ fontSize: 12 }}>Secciones (tema + cantidad)</div>

                  {sections.map((s, idx) => (
                    <div
                      key={idx}
                      className="row"
                      style={{ gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}
                    >
                      <select
                        value={s.topic_id}
                        onChange={(e) => updateSection(idx, "topic_id", Number(e.target.value))}
                        style={{
                          minWidth: 280, height: 44, borderRadius: 10, padding: "0 10px",
                          border: "1px solid var(--card-border)", background: "rgba(255,255,255,.06)",
                          color: "var(--text-100)"
                        }}
                      >
                        {groupedTopics.map((g) => (
                          <optgroup key={g.unitLabel} label={g.unitLabel}>
                            {g.items.map((t) => (
                              <option key={t.id} value={t.id}>
                                {labelFor(t)}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      <input
                        type="number"
                        min={1}
                        placeholder="cantidad"
                        value={s.count}
                        onChange={(e) => updateSection(idx, "count", Number(e.target.value))}
                        style={{
                          width: 120, height: 44, borderRadius: 10, padding: "0 10px",
                          border: "1px solid var(--card-border)", background: "rgba(255,255,255,.06)",
                          color: "var(--text-100)"
                        }}
                      />

                      <button type="button" className="btn btn-ghost" onClick={() => removeSection(idx)}>
                        Eliminar
                      </button>
                    </div>
                  ))}

                  <div className="row" style={{ gap: 8, alignItems: "center", marginTop: 12 }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={addSection}
                      disabled={topics.length === 0}
                    >
                      + Agregar sección
                    </button>
                    <div className="muted">
                      Total de preguntas: <strong>{totalQuestions}</strong>
                    </div>
                  </div>

                  {weakTopicId && topics.some((t) => t.id === weakTopicId) && (
                    <div style={{ marginTop: 10 }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setSections([{ topic_id: weakTopicId, count: 10 }])}
                      >
                        Usar “tema a reforzar” (10)
                      </button>
                    </div>
                  )}
                </div>

                {errors.length > 0 && (
                  <ul style={{ color: "#ffbcbc", margin: "12px 0 0 18px" }}>
                    {errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                )}

                <div className="row" style={{ marginTop: 14 }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || errors.length > 0 || topics.length === 0}
                    style={{ opacity: loading || errors.length > 0 || topics.length === 0 ? 0.7 : 1 }}
                  >
                    {loading ? "Creando..." : "Iniciar ensayo"}
                  </button>
                </div>
              </div>

              {/* Columna derecha: tips y estado */}
              <div className="card">
                <h3 style={{ marginTop: 0 }}>Consejos</h3>
                <ul className="muted" style={{ marginTop: 8 }}>
                  <li>Mini-ensayo rápido: 10–20 preguntas, 15–25 min.</li>
                  <li>Ensayo completo: 40–60 preguntas, 60–90 min.</li>
                  <li>Combina 2–4 temas para simular el mix PAES.</li>
                </ul>

                <div className="card" style={{ marginTop: 12, background: "rgba(255,255,255,.03)" }}>
                  <div className="muted" style={{ fontSize: 12 }}>Borrador</div>
                  <div className="row" style={{ gap: 8, marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        localStorage.removeItem(DRAFT_KEY);
                        toast.success("Borrador eliminado");
                      }}
                    >
                      Eliminar borrador
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, timeLimit, sections }));
                        toast.success("Borrador guardado");
                      }}
                    >
                      Guardar borrador
                    </button>
                  </div>
                </div>

                <div className="card" style={{ marginTop: 12, background: "rgba(255,255,255,.03)" }}>
                  <div className="muted" style={{ fontSize: 12 }}>Estado</div>
                  <div className="row" style={{ gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                    <span className="muted">Temas cargados: {topics.length}</span>
                    <span className="muted">Secciones: {sections.length}</span>
                    <span className="muted">Total preguntas: {totalQuestions}</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
