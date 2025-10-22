import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchExamHistory, type ExamHistoryItem, retakeExam } from "../api/exams";
import AppLayout from "../components/AppLayout";

export default function ExamHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") || 10)));
  const offset = Math.max(0, Number(searchParams.get("offset") || 0));

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ExamHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchExamHistory(limit, offset);
        setRows(data.exams);
        setTotal(data.total_exams);
        setHasMore(data.has_more);
      } catch {
        toast.error("No se pudo cargar el historial de ensayos");
      } finally {
        setLoading(false);
      }
    })();
  }, [limit, offset]);

  const goNext = () => setSearchParams({ limit: String(limit), offset: String(offset + limit) });
  const goPrev = () => setSearchParams({ limit: String(limit), offset: String(Math.max(0, offset - limit)) });

  const currentStart = total === 0 ? 0 : offset + 1;
  const currentEnd = Math.min(offset + limit, total);

  if (loading) return (
    <AppLayout>
      <div className="container" style={{ padding: "28px 0" }}>
        <p className="muted" style={{ textAlign: "center" }}>Cargando…</p>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="container" style={{ padding: "28px 0" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0 }}>🧪 Historial de ensayos</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              Revisa tus intentos anteriores, resultados y vuelve a intentarlo.
            </p>
          </div>
          <Link to="/exams/setup" className="btn btn-primary">Nuevo ensayo</Link>
        </div>

        {rows.length === 0 ? (
          <div className="card" style={{ marginTop: 16 }}>
            <p className="muted" style={{ margin: 0 }}>Aún no tienes ensayos finalizados.</p>
          </div>
        ) : (
          <>
            <div className="card" style={{ marginTop: 16, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 10 }} className="muted">Título</th>
                    <th style={{ padding: 10 }} className="muted">Puntaje</th>
                    <th style={{ padding: 10 }} className="muted">Precisión</th>
                    <th style={{ padding: 10 }} className="muted">Duración</th>
                    <th style={{ padding: 10 }} className="muted">Fecha</th>
                    <th style={{ padding: 10 }} className="muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.attempt_id} style={{ borderTop: "1px solid var(--card-border)" }}>
                      <td style={{ padding: 10 }}>{r.title ?? "Ensayo"}</td>
                      <td style={{ padding: 10, textAlign: "center" }}>{r.score} / {r.total_questions}</td>
                      <td style={{ padding: 10, textAlign: "center" }}>{r.accuracy_pct}%</td>
                      <td style={{ padding: 10, textAlign: "center" }}>
                        {r.duration_seconds != null ? formatTime(r.duration_seconds) : "—"}
                      </td>
                      <td style={{ padding: 10, whiteSpace: "nowrap" }}>
                        {new Date(r.submitted_at ?? r.started_at).toLocaleString("es-CL", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td style={{ padding: 10 }}>
                        <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
                          <Link to={`/ensayo/${r.attempt_id}/resultado`} className="btn btn-ghost">
                            Ver resultado
                          </Link>
                          <Link to={`/ensayo/${r.attempt_id}/revision`} className="btn btn-ghost">
                            Revisar preguntas
                          </Link>
                          <button
                            onClick={async () => {
                              try {
                                const resp = await retakeExam(r.attempt_id);
                                toast.success("Reintentando ensayo…");
                                navigate(`/ensayo/${resp.attempt_id}`);
                              } catch (e) {
                                toast.error(e instanceof Error ? e.message : "No se pudo rehacer");
                              }
                            }}
                            className="btn btn-primary"
                          >
                            Rehacer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="row" style={{ marginTop: 12, justifyContent: "space-between", alignItems: "center" }}>
              <div className="muted">
                Mostrando {currentStart}–{currentEnd} de {total}
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button
                  onClick={goPrev}
                  disabled={offset === 0}
                  className="btn btn-ghost"
                  style={{ opacity: offset === 0 ? 0.6 : 1 }}
                >
                  ← Anterior
                </button>
                <button
                  onClick={goNext}
                  disabled={!hasMore}
                  className="btn btn-primary"
                  style={{ opacity: !hasMore ? 0.6 : 1 }}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
