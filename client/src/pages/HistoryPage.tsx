// client/src/pages/HistoryPage.tsx
import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  fetchHistory,
  type HistoryAttempt,
  fetchSummary,
  type SummaryResponse,
} from "../api/attempts";
import AppLayout from "../components/AppLayout";

export default function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState<HistoryAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [hasMore, setHasMore] = useState(false);

  // KPIs
  const [summary, setSummary] = useState<SummaryResponse | null>(null);

  // Query params
  const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") || 10)));
  const offset = Math.max(0, Number(searchParams.get("offset") || 0));

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [hist, sum] = await Promise.all([
          fetchHistory(limit, offset),
          fetchSummary().catch(() => null),
        ]);

        setAttempts(hist.attempts);
        setTotal(hist.total_attempts);
        setPageSize(hist.page_size);
        setHasMore(hist.has_more);
        if (sum) setSummary(sum);
      } catch {
        toast.error("No se pudo cargar el historial/resumen");
      } finally {
        setLoading(false);
      }
    })();
  }, [limit, offset]);

  const goNext = () => setSearchParams({ limit: String(limit), offset: String(offset + limit) });
  const goPrev = () => setSearchParams({ limit: String(limit), offset: String(Math.max(0, offset - limit)) });

  const currentStart = total === 0 ? 0 : offset + 1;
  const currentEnd = Math.min(offset + limit, total);

  if (loading) {
    return (
      <AppLayout>
        <div className="container" style={{ padding: "60px 0", textAlign: "center" }}>
          <p className="muted">Cargando historial...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container" style={{ padding: "32px 0" }}>
        <h2 style={{ margin: 0 }}>📊 Mi progreso</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          Revisa tus intentos por tema y navega al detalle.
        </p>

        {/* KPIs */}
        {summary && (
          <div className="grid" style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginTop: 12, marginBottom: 16 }}>
            <div className="card">
              <div className="muted" style={{ fontSize: 12 }}>Intentos totales</div>
              <div style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>{summary.total_attempts}</div>
            </div>

            <div className="card">
              <div className="muted" style={{ fontSize: 12 }}>Precisión promedio</div>
              <div style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>{summary.avg_accuracy}%</div>
              <div style={{ marginTop: 8, height: 8, background: "rgba(255,255,255,.08)", borderRadius: 999 }}>
                <div
                  style={{
                    width: `${summary.avg_accuracy}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: "linear-gradient(135deg,#7C3AED,#6B2EDB)",
                    transition: "width 300ms",
                  }}
                />
              </div>
            </div>

            <div className="card">
              <div className="muted" style={{ fontSize: 12 }}>Temas practicados</div>
              <div style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>{summary.topics_practiced}</div>
            </div>

            <div className="card">
              <div className="row" style={{ gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div className="muted" style={{ fontSize: 12 }}>Mejor tema</div>
                  {summary.best_topic ? (
                    <>
                      <div style={{ fontWeight: 700 }}>{summary.best_topic.name}</div>
                      <div className="muted" style={{ fontSize: 14 }}>{summary.best_topic.accuracy}%</div>
                      <button
                        onClick={() => navigate(`/temas/${summary.best_topic!.topic_id}`)}
                        className="btn btn-ghost"
                        style={{ marginTop: 6 }}
                      >
                        Practicar
                      </button>
                    </>
                  ) : (
                    <div className="muted">—</div>
                  )}
                </div>
                <div style={{ width: 1, background: "var(--card-border)" }} />
                <div style={{ flex: 1 }}>
                  <div className="muted" style={{ fontSize: 12 }}>Peor tema</div>
                  {summary.worst_topic ? (
                    <>
                      <div style={{ fontWeight: 700 }}>{summary.worst_topic.name}</div>
                      <div className="muted" style={{ fontSize: 14 }}>{summary.worst_topic.accuracy}%</div>
                      <button
                        onClick={() => navigate(`/temas/${summary.worst_topic!.topic_id}`)}
                        className="btn btn-primary"
                        style={{ marginTop: 6 }}
                      >
                        Reforzar
                      </button>
                    </>
                  ) : (
                    <div className="muted">—</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabla historial */}
        {attempts.length === 0 ? (
          <div className="card"><p className="muted" style={{ margin: 0 }}>No tienes intentos registrados aún.</p></div>
        ) : (
          <>
            <div className="card" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ padding: 10, textAlign: "left" }} className="muted">Tema</th>
                    <th style={{ padding: 10 }} className="muted">Puntaje</th>
                    <th style={{ padding: 10 }} className="muted">Precisión</th>
                    <th style={{ padding: 10 }} className="muted">Fecha</th>
                    <th style={{ padding: 10 }} className="muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a) => (
                    <tr key={a.attempt_id} style={{ borderTop: "1px solid var(--card-border)" }}>
                      <td style={{ padding: 10 }}>{a.topic_name}</td>
                      <td style={{ padding: 10, textAlign: "center" }}>
                        {a.score} / {a.total_questions}
                      </td>
                      <td style={{ padding: 10, textAlign: "center" }}>{a.accuracy_pct}%</td>
                      <td style={{ padding: 10, whiteSpace: "nowrap" }}>
                        {new Date(a.submitted_at ?? a.started_at).toLocaleString("es-CL", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td style={{ padding: 10, textAlign: "right" }}>
                        <Link to={`/progreso/${a.attempt_id}`} className="btn btn-primary">
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="row" style={{ marginTop: 12, justifyContent: "space-between", alignItems: "center" }}>
              <div className="muted">
                Mostrando {currentStart}–{currentEnd} de {total}
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button onClick={goPrev} disabled={offset === 0} className="btn btn-ghost" style={{ opacity: offset === 0 ? 0.6 : 1 }}>
                  ← Anterior
                </button>
                <button onClick={goNext} disabled={!hasMore} className="btn btn-primary" style={{ opacity: !hasMore ? 0.6 : 1 }}>
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
