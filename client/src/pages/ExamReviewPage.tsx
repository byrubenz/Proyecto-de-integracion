import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchExamDetail, type ExamDetailResponse } from "../api/exams";

export default function ExamReviewPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [data, setData] = useState<ExamDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnlyIncorrect, setShowOnlyIncorrect] = useState(false);

  // refs para scroll a pregunta
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    (async () => {
      try {
        const id = Number(attemptId);
        if (!attemptId || !Number.isFinite(id) || id <= 0) {
          toast.error("attemptId inválido");
          setLoading(false);
          return;
        }
        const resp = await fetchExamDetail(id);
        setData(resp);
      } catch {
        toast.error("No se pudo cargar la revisión del examen");
      } finally {
        setLoading(false);
      }
    })();
  }, [attemptId]);

  const filteredItems = useMemo(() => {
    if (!data) return [];
    return showOnlyIncorrect
      ? data.items.filter((it) => it.is_correct === false)
      : data.items;
  }, [data, showOnlyIncorrect]);

  if (loading) return <p style={{ textAlign: "center" }}>Cargando revisión…</p>;
  if (!data) return <p style={{ textAlign: "center" }}>No hay datos.</p>;

  const a = data.attempt;

  const scrollTo = (qid: number) => {
    const el = itemRefs.current.get(qid);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="container" style={{ maxWidth: 980, margin: "28px auto" }}>
      {/* Header + acciones */}
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Revisión del ensayo</h2>
          <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>
            Intento #{a.id} • {a.title ?? "Ensayo"}
          </div>
        </div>

        <div className="row" style={{ gap: 8 }}>
          <Link className="btn btn-ghost" to="/">Inicio</Link>
          <Link className="btn btn-ghost" to="/progreso">Mi progreso</Link>
        </div>
      </div>

      {/* Resumen compacto */}
      <div
        className="card"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 12,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <Kpi label="Puntaje" value={`${a.score}/${a.total}`} />
        <Kpi label="Precisión" value={`${a.accuracy_pct}%`} />
        <Kpi label="Preguntas" value={data.items.length} />

        <div style={{ gridColumn: "1 / -1" }}>
          <div
            style={{
              height: 10,
              borderRadius: 999,
              background: "rgba(255,255,255,.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${a.accuracy_pct}%`,
                height: "100%",
                borderRadius: 999,
                background:
                  "linear-gradient(135deg,var(--primary-500),var(--primary-600))",
                transition: "width 300ms",
              }}
            />
          </div>
        </div>
      </div>

      {/* Índice de preguntas + filtro */}
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          padding: 12,
          marginBottom: 12,
        }}
      >
        {/* Botones de índice */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {data.items.map((it, i) => {
            const tone =
              it.is_correct === true
                ? "rgba(34,197,94,.15)" // verde
                : it.is_correct === false
                ? "rgba(239,68,68,.15)" // rojo
                : "rgba(255,255,255,.06)";
            const border =
              it.is_correct === true
                ? "rgba(34,197,94,.35)"
                : it.is_correct === false
                ? "rgba(239,68,68,.35)"
                : "var(--card-border)";
            return (
              <button
                key={it.question_id}
                onClick={() => scrollTo(it.question_id)}
                title={`Ir a la pregunta ${i + 1}`}
                className="btn btn-ghost"
                style={{
                  width: 38,
                  height: 38,
                  padding: 0,
                  background: tone,
                  borderColor: border,
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Filtro */}
        <label
          style={{
            marginLeft: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
          }}
        >
          <input
            type="checkbox"
            checked={showOnlyIncorrect}
            onChange={(e) => setShowOnlyIncorrect(e.target.checked)}
          />
          <span className="muted">Mostrar solo incorrectas</span>
        </label>
        <small className="muted">
          {filteredItems.length}/{data.items.length} visibles
        </small>
      </div>

      {/* Lista de preguntas */}
      <div className="grid" style={{ gap: 12 }}>
        {filteredItems.map((item, idx) => {
          const wasCorrect = item.is_correct === true;
          const wasWrong = item.is_correct === false;

          const bg =
            wasCorrect
              ? "rgba(34,197,94,.12)"
              : wasWrong
              ? "rgba(239,68,68,.12)"
              : "rgba(255,255,255,.03)";
          const border =
            wasCorrect
              ? "rgba(34,197,94,.35)"
              : wasWrong
              ? "rgba(239,68,68,.35)"
              : "var(--card-border)";

          return (
            <section
              key={item.question_id}
              ref={(el) => {
                if (el) itemRefs.current.set(item.question_id, el);
              }}
              className="card"
              style={{ background: bg, borderColor: border, padding: 16 }}
            >
              <header
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <h4 style={{ margin: 0 }}>
                  {idx + 1}. {item.stem}
                </h4>
                <span
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: "1px solid var(--card-border)",
                    background: "rgba(255,255,255,.06)",
                    fontWeight: 700,
                  }}
                >
                  {wasCorrect ? "Correcta" : wasWrong ? "Incorrecta" : "Sin responder"}
                </span>
              </header>

              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {item.options.map((opt) => {
                  const optBg = opt.is_correct
                    ? "rgba(59,130,246,.14)" // azul tenue
                    : opt.is_selected && !opt.is_correct
                    ? "rgba(234,179,8,.14)" // amarillo tenue
                    : "rgba(255,255,255,.03)";
                  const optBorder = opt.is_correct
                    ? "rgba(59,130,246,.45)"
                    : opt.is_selected && !opt.is_correct
                    ? "rgba(234,179,8,.45)"
                    : "var(--card-border)";
                  return (
                    <li
                      key={opt.id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: `1px solid ${optBorder}`,
                        marginBottom: 8,
                        background: optBg,
                      }}
                    >
                      <strong style={{ marginRight: 6 }}>{opt.label}.</strong>
                      {opt.text}
                      {opt.is_correct && (
                        <span className="muted" style={{ marginLeft: 10 }}>
                          ✔ correcta
                        </span>
                      )}
                      {opt.is_selected && !opt.is_correct && (
                        <span className="muted" style={{ marginLeft: 10 }}>
                          ✖ tu respuesta
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>

              {item.explanation && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: "pointer" }}>Ver explicación</summary>
                  <div className="muted" style={{ marginTop: 6 }}>{item.explanation}</div>
                </details>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Subcomponentes ---------- */

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="card"
      style={{
        padding: 14,
        background: "rgba(255,255,255,.03)",
      }}
    >
      <div className="muted" style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
