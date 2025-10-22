import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getQuestionsByTopic, type Question } from "../api/questions";
import { saveAnswers } from "../api/answers";
import toast from "react-hot-toast";
import AppLayout from "../components/AppLayout";

// 🆕 Respuesta esperada del backend (campos obligatorios)
type SaveResp = {
  ok: boolean;
  attempt_id: number;
  score: number;
  total: number;
  accuracy_pct: number;
};

export default function TopicsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);

  // NUEVO: estados de envío/errores
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NUEVO: resumen del intento (viene del backend)
  const [attemptResult, setAttemptResult] = useState<{
    attempt_id: number;
    score: number;
    total: number;
    accuracy_pct: number;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    getQuestionsByTopic(id).then(setQuestions);
  }, [id]);

  const handleSelect = (questionId: number, optionLabel: string) => {
    if (showResults) return;
    setSelected((prev) => ({ ...prev, [questionId]: optionLabel }));
  };

  // Submit: confía SOLO en lo que devuelve el backend
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!id) return;

    setIsSaving(true);
    setError(null);

    const answers = questions.map((q) => {
      const selectedOption = q.options.find((o) => o.label === selected[q.id]);
      return {
        question_id: q.id,
        option_id: selectedOption?.id,
        is_correct: selectedOption?.is_correct === 1, // el backend recalcula igualmente
      };
    });

    try {
      const resp = (await saveAnswers(String(id), answers)) as SaveResp;

      if (
        resp == null ||
        typeof resp.attempt_id !== "number" ||
        typeof resp.score !== "number" ||
        typeof resp.total !== "number" ||
        typeof resp.accuracy_pct !== "number"
      ) {
        throw new Error("Respuesta del servidor incompleta");
      }

      setAttemptResult({
        attempt_id: resp.attempt_id,
        score: resp.score,
        total: resp.total,
        accuracy_pct: resp.accuracy_pct,
      });

      toast.success("¡Respuestas guardadas correctamente!");
      setShowResults(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      if (msg.includes("401") || /no token|no autorizado|inválido|expirado/i.test(msg)) {
        toast.error("Tu sesión no es válida. Inicia sesión nuevamente.");
        setError("No autorizado. Inicia sesión nuevamente.");
      } else {
        toast.error(msg);
        setError(msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const totalSeleccionadas = Object.keys(selected).length;
  const todasRespondidas =
    totalSeleccionadas === questions.length && questions.length > 0;

  return (
    <AppLayout>
      <div className="container" style={{ padding: "28px 0" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0 }}>Práctica — Tema #{id}</h1>
            <p className="muted" style={{ marginTop: 6 }}>
              Responde todas las preguntas y envía para ver tu resultado.
            </p>
          </div>
          {!showResults && questions.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={isSaving || !todasRespondidas}
              className="btn btn-primary"
              style={{ opacity: isSaving || !todasRespondidas ? 0.7 : 1 }}
            >
              {isSaving ? "Guardando..." : "Enviar respuestas"}
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          {questions.map((q) => (
            <div key={q.id} className="card" style={{ marginBottom: 18 }}>
              <h3 style={{ marginTop: 0 }}>{q.stem}</h3>
              <ul style={{ listStyle: "none", padding: 0, marginTop: 10 }}>
                {q.options.map((opt) => {
                  const isSelected = selected[q.id] === opt.label;
                  const isCorrect = showResults && opt.is_correct === 1;
                  const isWrong = showResults && isSelected && opt.is_correct === 0;

                  return (
                    <li
                      key={opt.id}
                      onClick={() => handleSelect(q.id, opt.label)}
                      style={{
                        margin: "8px 0",
                        cursor: showResults ? "default" : "pointer",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: isSelected ? "2px solid var(--accent-500)" : "1px solid var(--card-border)",
                        background: isCorrect
                          ? "rgba(46, 204, 113, .18)"
                          : isWrong
                          ? "rgba(231, 76, 60, .18)"
                          : "rgba(255,255,255,.04)",
                        transition: "background .15s, border-color .15s",
                      }}
                    >
                      <strong>{opt.label}.</strong> {opt.text}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Botón inferior (duplicado) para UX en móviles */}
          {questions.length > 0 && !showResults && (
            <div className="row" style={{ gap: 12, alignItems: "center", marginTop: 10 }}>
              <button
                type="submit"
                disabled={isSaving || !todasRespondidas}
                className="btn btn-primary"
                style={{ opacity: isSaving || !todasRespondidas ? 0.7 : 1 }}
              >
                {isSaving ? "Guardando..." : "Enviar respuestas"}
              </button>
              {!todasRespondidas && (
                <small className="muted">
                  {totalSeleccionadas}/{questions.length} respondidas
                </small>
              )}
            </div>
          )}
        </form>

        {error && (
          <div className="card" role="alert" style={{ marginTop: 12, border: "1px solid rgba(255,0,0,.25)", color: "#ffbcbc" }}>
            {error}
          </div>
        )}

        {showResults && (
          <div className="card" style={{ marginTop: 18 }}>
            <h2 style={{ marginTop: 0 }}>Resultados</h2>
            <p>
              Correctas:{" "}
              {
                questions.filter(
                  (q) =>
                    q.options.find(
                      (o) => o.label === selected[q.id] && o.is_correct === 1
                    ) !== undefined
                ).length
              }{" "}
              de {questions.length}
            </p>

            {attemptResult && (
              <div className="card" style={{ background: "rgba(255,255,255,.03)", marginTop: 12 }}>
                <h3 style={{ marginTop: 0 }}>Resumen del intento</h3>
                <p style={{ margin: "6px 0" }}>
                  <strong>Puntaje:</strong> {attemptResult.score} / {attemptResult.total}
                </p>
                <p style={{ margin: "6px 0" }}>
                  <strong>Precisión:</strong> {attemptResult.accuracy_pct}%
                </p>
                <p className="muted" style={{ margin: "6px 0" }}>
                  <small>Intento #{attemptResult.attempt_id}</small>
                </p>

                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 10, background: "rgba(255,255,255,.08)", borderRadius: 999 }}>
                    <div
                      style={{
                        width: `${attemptResult.accuracy_pct}%`,
                        height: "100%",
                        borderRadius: 999,
                        background: "linear-gradient(135deg,#7C3AED,#6B2EDB)",
                        transition: "width 300ms",
                      }}
                    />
                  </div>
                </div>

                <div className="row" style={{ marginTop: 12 }}>
                  <button
                    onClick={() => navigate(`/progreso/${attemptResult.attempt_id}`)}
                    className="btn btn-primary"
                  >
                    Ver detalle del intento
                  </button>
                  <button
                    onClick={() => navigate(`/temas/${id}`)}
                    className="btn btn-ghost"
                  >
                    Repetir tema
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
