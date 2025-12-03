import { Link, Navigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";

export default function HomePortal() {
  const { user } = useAuth();
  const paid = user?.is_paid;
  const isPaid = paid === true || paid === 1 || paid === "1";

  if (user) {
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === "student") {
      if (isPaid) {
        return <Navigate to="/inicio" replace />;
      }
    }
  }

  return (
    <AppLayout>
      <section className="container" style={{ padding: "48px 0 28px" }}>
        <div
          className="card"
          style={{
            padding: 32,
            background:
              "radial-gradient(1200px 520px at 80% -10%, rgba(124,58,237,.22), transparent 60%), radial-gradient(840px 420px at 15% 120%, rgba(56,189,248,.18), transparent 60%), rgba(255,255,255,.03)",
          }}
        >
          <p className="muted" style={{ fontWeight: 700, letterSpacing: 0.4 }}>
            Preu+ para PAES
          </p>
          <h1 style={{ margin: "10px 0 12px", lineHeight: 1.1 }}>
            Simulacros, práctica guiada y analítica para subir tu puntaje.
          </h1>
          <p className="muted" style={{ fontSize: 16, maxWidth: 780, marginBottom: 18 }}>
            Entrena con ensayos cronometrados, práctica por unidades y reportes de avance que te muestran
            qué reforzar cada semana.
          </p>

          <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
            <Link className="btn btn-primary" to="/login">
              Iniciar sesión
            </Link>
            <Link className="btn btn-ghost" to="/registro">
              Registrarse
            </Link>
            {user && (
              <Link className="btn btn-ghost" to="/inicio">
                Ir a mi inicio
              </Link>
            )}
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 12,
              marginTop: 18,
            }}
          >
            <article className="card" style={{ background: "rgba(255,255,255,.03)" }}>
              <h3 style={{ margin: "6px 0 4px", fontSize: 18 }}>Simulacros PAES</h3>
              <p className="muted" style={{ margin: 0 }}>
                Ensayos cronometrados con retroalimentación y revisión por pregunta.
              </p>
            </article>
            <article className="card" style={{ background: "rgba(255,255,255,.03)" }}>
              <h3 style={{ margin: "6px 0 4px", fontSize: 18 }}>Práctica por unidades</h3>
              <p className="muted" style={{ margin: 0 }}>
                Rutas guiadas con ejercicios tipo PAES por habilidad y nivel.
              </p>
            </article>
            <article className="card" style={{ background: "rgba(255,255,255,.03)" }}>
              <h3 style={{ margin: "6px 0 4px", fontSize: 18 }}>Analítica de progreso</h3>
              <p className="muted" style={{ margin: 0 }}>
                Reportes de precisión, velocidad y temas a reforzar semana a semana.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: "6px 0 52px" }}>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
          <article className="card">
            <h3 style={{ margin: "4px 0 6px" }}>Plan de estudio claro</h3>
            <p className="muted" style={{ margin: 0 }}>
              Unidades y temas ordenados por dificultad con práctica diaria y miniensayos.
            </p>
          </article>
          <article className="card">
            <h3 style={{ margin: "4px 0 6px" }}>Feedback accionable</h3>
            <p className="muted" style={{ margin: 0 }}>
              Indicadores por habilidad y recomendaciones concretas para tu siguiente sesión.
            </p>
          </article>
          <article className="card">
            <h3 style={{ margin: "4px 0 6px" }}>Acompañamiento</h3>
            <p className="muted" style={{ margin: 0 }}>
              Tutoría y soporte para que no pierdas el ritmo de preparación.
            </p>
          </article>
        </div>
      </section>
    </AppLayout>
  );
}
