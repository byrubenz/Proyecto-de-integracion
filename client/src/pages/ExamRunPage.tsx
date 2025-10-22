import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { answerExam, fetchExamProgress, finishExam } from "../api/exams";

export default function ExamRunPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const aid = Number(attemptId);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Array<{
    question_id: number;
    stem: string;
    options: Array<{ id: number; label: string; text: string }>;
    selected_option_id: number | null;
  }>>([]);
  const [title, setTitle] = useState<string | null>(null);
  const [limit, setLimit] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<string>("");

  // Opcionales del backend (temporizador robusto)
  const [serverNow, setServerNow] = useState<string | null>(null);
  const [serverExpired, setServerExpired] = useState<boolean>(false);

  const [idx, setIdx] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const finishedOnce = useRef(false);

  // Drift cliente/servidor
  const driftMsRef = useRef<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const prog = await fetchExamProgress(aid);
        setItems(prog.items);
        setTitle(prog.attempt.title);
        setLimit(prog.attempt.time_limit_seconds);
        setStartedAt(prog.attempt.started_at);

        const anyProg = prog as any;
        if (anyProg.server_now) setServerNow(anyProg.server_now);
        if (typeof anyProg.expired === "boolean") setServerExpired(anyProg.expired);

        const serverMs = anyProg.server_now ? new Date(anyProg.server_now).getTime() : Date.now();
        driftMsRef.current = Date.now() - serverMs;

        const firstUnanswered = prog.items.findIndex(i => i.selected_option_id == null);
        if (firstUnanswered >= 0) setIdx(firstUnanswered);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "No se pudo cargar";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [aid]);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const remaining = useMemo(
    () => (limit != null ? Math.max(0, limit - elapsed) : null),
    [limit, elapsed]
  );

  useEffect(() => {
    if (!startedAt) return;
    const startedMs = new Date(startedAt).getTime();

    const tick = () => {
      const nowAdj = Date.now() - driftMsRef.current;
      const secs = Math.max(0, Math.floor((nowAdj - startedMs) / 1000));
      setElapsed(secs);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  // Auto-finalizar on timeout
  useEffect(() => {
    if (finishing || finishedOnce.current) return;
    if (limit == null) return;
    if (serverExpired || (remaining != null && remaining <= 0)) {
      finishedOnce.current = true;
      finish(true).catch(() => {
        finishedOnce.current = false;
      });
    }
  }, [remaining, serverExpired, limit, finishing]);

  // Guardar respuesta (optimista)
  const selectOption = async (qId: number, optionId: number) => {
    if (finishing || serverExpired) return;
    setItems(prev =>
      prev.map(it => (it.question_id === qId ? { ...it, selected_option_id: optionId } : it))
    );
    try {
      await answerExam(aid, { question_id: qId, option_id: optionId });
    } catch {
      toast.error("No se pudo guardar la respuesta");
      setItems(prev =>
        prev.map(it =>
          it.question_id === qId ? { ...it, selected_option_id: it.selected_option_id } : it
        )
      );
    }
  };

  // Salida protegida si hay pendientes
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (finishing) return;
      const answered = items.filter(i => i.selected_option_id != null).length;
      if (answered < items.length) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [items, finishing]);

  // Finalizar
  const finish = async (auto = false) => {
    try {
      setFinishing(true);
      const startedMs = startedAt ? new Date(startedAt).getTime() : Date.now();
      const nowAdj = Date.now() - driftMsRef.current;
      const durationSeconds = Math.max(0, Math.floor((nowAdj - startedMs) / 1000));

      const res = await finishExam(aid, durationSeconds);
      if (!auto) toast.success(`Enviado. Puntaje: ${res.score}/${res.total}`);
      navigate(`/ensayo/${aid}/resultado`);
    } catch (err) {
      finishedOnce.current = false;
      toast.error(err instanceof Error ? err.message : "No se pudo finalizar");
    } finally {
      setFinishing(false);
    }
  };

  if (loading) return <p style={{ textAlign: "center" }}>Cargando…</p>;
  if (items.length === 0) return <p style={{ textAlign: "center" }}>Sin preguntas.</p>;

  const q = items[idx];
  const answered = items.filter(i => i.selected_option_id != null).length;

  return (
    <div className="container" style={{ maxWidth: 980, margin: "28px auto" }}>
      {/* Aviso de expiración */}
      {serverExpired && (
        <div
          className="card"
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            borderColor: "rgba(255,230,156,.6)",
            background: "rgba(255,243,205,.1)",
            color: "#ffd27a",
          }}
        >
          ⏰ El tiempo de tu examen expiró. Estamos enviando tus respuestas…
        </div>
      )}

      {/* Header ensayo */}
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0 }}>{title ?? "Ensayo"}</h2>
          <div className="muted" style={{ marginTop: 4, fontSize: 14 }}>
            Pregunta {idx + 1} / {items.length} · Respondidas: {answered}
          </div>
        </div>

        {/* Timer pill */}
        <div
          style={{
            whiteSpace: "nowrap",
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid var(--card-border)",
            background: "rgba(255,255,255,.06)",
            fontWeight: 700,
          }}
        >
          {limit ? (
            <>⏳ {formatTime(remaining ?? 0)}</>
          ) : (
            <>⏱️ {formatTime(elapsed)}</>
          )}
        </div>
      </div>

      {/* Progreso lineal */}
      {limit != null && (
        <div className="card" style={{ padding: 12, marginBottom: 12 }}>
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
                width: `${limit ? (100 * (limit - (remaining ?? 0))) / limit : 0}%`,
                height: "100%",
                borderRadius: 999,
                background: "linear-gradient(135deg,var(--primary-500),var(--primary-600))",
                transition: "width 300ms",
              }}
            />
          </div>
        </div>
      )}

      {/* Tarjeta de pregunta */}
      <div
        className="card"
        style={{
          padding: 16,
          opacity: serverExpired ? 0.7 : 1,
        }}
      >
        <h3 style={{ marginTop: 0 }}>{q.stem}</h3>
        <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0" }}>
          {q.options.map((o) => {
            const selected = q.selected_option_id === o.id;
            return (
              <li
                key={o.id}
                onClick={() => selectOption(q.question_id, o.id)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: selected ? "2px solid var(--primary-500)" : "1px solid var(--card-border)",
                  cursor: finishing || serverExpired ? "not-allowed" : "pointer",
                  pointerEvents: finishing || serverExpired ? "none" : "auto",
                  marginBottom: 10,
                  background: selected ? "rgba(124,58,237,.12)" : "rgba(255,255,255,.03)",
                  transition: "transform .06s ease, border-color .2s ease, background .2s ease",
                }}
              >
                <strong style={{ marginRight: 6 }}>{o.label}.</strong> {o.text}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Navegación */}
      <div className="row" style={{ gap: 8, marginTop: 12 }}>
        <button
          className="btn btn-ghost"
          disabled={idx === 0 || finishing || serverExpired}
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          style={{ opacity: idx === 0 || finishing || serverExpired ? 0.6 : 1 }}
        >
          ← Anterior
        </button>
        <button
          className="btn btn-ghost"
          disabled={idx === items.length - 1 || finishing || serverExpired}
          onClick={() => setIdx((i) => Math.min(items.length - 1, i + 1))}
          style={{ opacity: idx === items.length - 1 || finishing || serverExpired ? 0.6 : 1 }}
        >
          Siguiente →
        </button>

        <div style={{ marginLeft: "auto" }}>
          <button
            className="btn btn-primary"
            onClick={() => finish(false)}
            disabled={finishing || serverExpired}
            style={{ opacity: finishing || serverExpired ? 0.8 : 1 }}
          >
            {finishing ? "Enviando..." : serverExpired ? "Tiempo expirado" : "Finalizar examen"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
