// client/src/pages/AttemptDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import type { AttemptDetailResponse, AttemptItem } from "../api/attempts";
import { fetchAttemptDetail } from "../api/attempts";
import AppLayout from "../components/AppLayout";

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function AttemptDetailPage() {
  const { attemptId } = useParams();
  const [data, setData] = useState<AttemptDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    (async () => {
      try {
        setLoading(true);
        const resp = await fetchAttemptDetail(Number(attemptId));
        setData(resp);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    })();
  }, [attemptId]);

  return (
    <AppLayout>
      <div className="container" style={{ padding: "28px 0" }}>
        <div className="row" style={{ marginBottom: 12 }}>
          <Link to="/progreso" className="btn btn-ghost">← Volver a Mi progreso</Link>
        </div>

        {loading && <p className="muted">Cargando…</p>}
        {err && <p style={{ color: "#ff8a8a" }}>{err}</p>}

        {data && (
          <>
            <header className="card" style={{ marginBottom: 20 }}>
              <h2 style={{ margin: "0 0 6px" }}>
                Detalle del intento #{data.attempt.id} — {data.attempt.topic_name}
              </h2>
              <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
                <span className="muted"><strong>Fecha:</strong> {fmtDate(data.attempt.submitted_at || data.attempt.started_at)}</span>
                <span className="muted"><strong>Puntaje:</strong> {data.attempt.score} / {data.attempt.total}</span>
                <span className="muted"><strong>Precisión:</strong> {data.attempt.accuracy_pct}%</span>
                <span className="muted"><strong>Modo:</strong> {data.attempt.mode}</span>
              </div>
              {/* Barra de progreso */}
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 10, background: "rgba(255,255,255,.08)", borderRadius: 999 }}>
                  <div
                    style={{
                      width: `${data.attempt.accuracy_pct}%`,
                      height: "100%",
                      background: "linear-gradient(135deg,#7C3AED,#6B2EDB)",
                      borderRadius: 999,
                      transition: "width 300ms",
                    }}
                  />
                </div>
              </div>
            </header>

            {/* Lista de preguntas */}
            <div className="grid" style={{ gap: 16 }}>
              {data.items.map((item, idx) => (
                <QuestionCard key={item.question_id} index={idx + 1} item={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function QuestionCard({ index, item }: { index: number; item: AttemptItem }) {
  const state =
    item.is_correct === true ? "ok" :
    item.is_correct === false ? "bad" :
    "none";

  const badgeStyles = {
    ok:   { bg: "rgba(46, 204, 113, .18)",  text: "Correcta"   },
    bad:  { bg: "rgba(231, 76, 60, .18)",   text: "Incorrecta" },
    none: { bg: "rgba(255,255,255,.06)",    text: "Sin responder" },
  } as const;

  return (
    <section className="card" style={{ overflow: "hidden", padding: 0 }}>
      <div
        style={{
          background: "rgba(255,255,255,.04)",
          padding: "12px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--card-border)"
        }}
      >
        <h3 style={{ margin: 0 }}>Pregunta {index}</h3>
        <span
          style={{
            background: badgeStyles[state].bg,
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 12,
            border: "1px solid var(--card-border)"
          }}
        >
          {badgeStyles[state].text}
        </span>
      </div>

      <div style={{ padding: 14 }}>
        <p style={{ margin: "0 0 10px" }}>{item.stem}</p>

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {item.options.map(opt => {
            const isSelected = opt.is_selected;
            const isCorrect = opt.is_correct;

            let bg = "rgba(255,255,255,.04)";
            if (isCorrect) bg = "rgba(46, 204, 113, .18)";
            if (isSelected && !isCorrect) bg = "rgba(231, 76, 60, .18)";
            if (isSelected && isCorrect) bg = "rgba(46, 204, 113, .28)";

            return (
              <li
                key={opt.id}
                style={{
                  margin: "8px 0",
                  padding: "10px 12px",
                  border: "1px solid var(--card-border)",
                  borderRadius: 10,
                  background: bg,
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <strong>{opt.label}.</strong>
                <span style={{ flex: 1 }}>{opt.text}</span>

                {/* etiquetas */}
                {isCorrect && (
                  <span
                    style={{
                      fontSize: 12,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "#16a34a",
                      color: "white"
                    }}
                  >
                    Correcta
                  </span>
                )}
                {isSelected && (
                  <span
                    style={{
                      fontSize: 12,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "#334155",
                      color: "white"
                    }}
                  >
                    Tu respuesta
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {item.explanation && (
          <details style={{ marginTop: 10 }}>
            <summary style={{ cursor: "pointer" }}>Ver explicación</summary>
            <div className="muted" style={{ marginTop: 8 }}>{item.explanation}</div>
          </details>
        )}
      </div>
    </section>
  );
}
