import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchExamResult, type ExamResult } from "../api/exams";
import AppLayout from "../components/AppLayout";

function fmtTime(s?: number | null) {
  if (!Number.isFinite(Number(s))) return "—";
  const m = Math.floor(Number(s) / 60);
  const r = Number(s) % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function ExamResultPage() {
  const { attemptId } = useParams();
  const aid = Number(attemptId);
  const [data, setData] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchExamResult(aid);
        setData(res);
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "No se pudo cargar el resultado"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [aid]);

  if (loading) return <p style={{ textAlign: "center" }}>Cargando…</p>;
  if (!data) return <p style={{ textAlign: "center" }}>Sin datos.</p>;

  const a = data.attempt;

  return (
    <AppLayout>
      <div className="container" style={{ padding: "28px 0" }}>
        {/* Header resultado */}
        <header className="card" style={{ marginBottom: 12 }}>
          <div
            className="row"
            style={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <div>
              <h2 style={{ margin: 0 }}>Resultado del ensayo</h2>
              <div className="muted" style={{ marginTop: 4 }}>
                {a.title ?? "Ensayo"} · Intento #{a.id ?? aid}
              </div>
            </div>

            <div className="row" style={{ gap: 8 }}>
              <Link className="btn btn-ghost" to="/ensayo/nuevo">
                Nuevo ensayo
              </Link>
              <Link className="btn btn-ghost" to={`/ensayo/${aid}/revision`}>
                Revisar preguntas
              </Link>
            </div>
          </div>

          {/* KPIs */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
              gap: 10,
              marginTop: 12,
            }}
          >
            <Kpi label="Puntaje" value={`${a.score}/${a.total}`} />
            <Kpi label="Precisión" value={`${a.accuracy_pct}%`} />
            <Kpi label="Duración" value={fmtTime(a.duration_seconds)} />
          </div>

          {/* Barra de precisión */}
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                height: 10,
                background: "rgba(255,255,255,.08)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${a.accuracy_pct}%`,
                  height: "100%",
                  background:
                    "linear-gradient(135deg,var(--primary-500),var(--primary-600))",
                  borderRadius: 999,
                  transition: "width 300ms",
                }}
              />
            </div>
          </div>
        </header>

        {/* Detalle por pregunta */}
        <div className="grid" style={{ gap: 12 }}>
          {data.items.map((item) => (
            <section
              key={item.question_id}
              className="card"
              style={{ padding: 14 }}
            >
              <div style={{ marginBottom: 8, fontWeight: 700 }}>{item.stem}</div>

              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {item.options.map((o) => {
                  const correct = o.is_correct;
                  const selected = o.is_selected;
                  const bg = correct
                    ? "rgba(46,204,113,.18)"
                    : selected && !correct
                    ? "rgba(231,76,60,.18)"
                    : "rgba(255,255,255,.04)";
                  const border = correct
                    ? "rgba(46,204,113,.35)"
                    : selected && !correct
                    ? "rgba(231,76,60,.35)"
                    : "var(--card-border)";
                  return (
                    <li
                      key={o.id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: `1px solid ${border}`,
                        background: bg,
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <strong>{o.label}.</strong> {o.text}
                      {selected && (
                        <span className="muted" style={{ marginLeft: 8 }}>
                          (tu respuesta)
                        </span>
                      )}
                      {correct && (
                        <span className="muted" style={{ marginLeft: 8 }}>
                          (correcta)
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>

              {item.explanation && (
                <div className="muted" style={{ marginTop: 6 }}>
                  <em>Explicación: </em>
                  {item.explanation}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Acciones inferiores */}
        <div
          className="row"
          style={{ gap: 8, marginTop: 12, alignItems: "center" }}
        >
          <Link to="/ensayos" className="btn btn-ghost">
            ← Ir al historial de ensayos
          </Link>
          <div style={{ marginLeft: "auto" }} />
          <Link to="/progreso" className="btn btn-ghost">
            Ver mi progreso
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="card"
      style={{
        padding: 12,
        background: "rgba(255,255,255,.03)",
      }}
    >
      <div className="muted" style={{ fontSize: 12 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
