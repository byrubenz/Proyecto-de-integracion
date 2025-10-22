import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function HomePortal() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const goPrimary = () => {
    // Logueado → Dashboard (/inicio); no logueado → Registro
    navigate(user ? "/inicio" : "/registro");
  };

  return (
    <>
      {/* HERO */}
      <section className="container" style={{ padding: "36px 0 14px" }}>
        <div
          className="card"
          style={{
            padding: 26,
            background:
              "radial-gradient(1200px 500px at 70% -10%, rgba(124,58,237,.25), transparent 60%), radial-gradient(800px 400px at 20% 120%, rgba(56,189,248,.18), transparent 60%), rgba(255,255,255,.03)",
          }}
        >
          <span className="muted" style={{ display: "inline-block" }}>
            Preparación PAES Matemática 1 y 2
          </span>

          <h1 style={{ margin: "8px 0 6px", lineHeight: 1.15 }}>
            Aprende matemáticas con práctica inteligente y rutas guiadas
          </h1>

          <p className="muted" style={{ fontSize: 16, marginTop: 6, maxWidth: 760 }}>
            Ejercicios tipo PAES por unidades y capítulos. Retroalimentación inmediata,
            historial, precisión por tema y ensayos simulados.
          </p>

          <div className="row" style={{ gap: 12, flexWrap: "wrap", marginTop: 14 }}>
            <button className="btn btn-primary" onClick={goPrimary}>
              {user ? "Ir a mi inicio" : "Crear cuenta"}
            </button>
            {!user && (
              <Link className="btn btn-ghost" to="/login">
                Ingresar
              </Link>
            )}
          </div>

          {/* Roles */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 12,
              marginTop: 18,
            }}
          >
            <article className="card" style={{ background: "rgba(255,255,255,.03)" }}>
              <h3 style={{ margin: "6px 0 4px", fontSize: 18 }}>Estudiante</h3>
              <p className="muted" style={{ margin: 0 }}>
                Práctica por habilidades, miniensayos y seguimiento de rapidez y precisión.
              </p>
            </article>
            <article className="card" style={{ background: "rgba(255,255,255,.03)" }}>
              <h3 style={{ margin: "6px 0 4px", fontSize: 18 }}>Profesor</h3>
              <p className="muted" style={{ margin: 0 }}>
                Panel con estadísticas, listas y materiales por curso y unidad.
              </p>
            </article>
            <article className="card" style={{ background: "rgba(255,255,255,.03)" }}>
              <h3 style={{ margin: "6px 0 4px", fontSize: 18 }}>Preuniversitario</h3>
              <p className="muted" style={{ margin: 0 }}>
                Ensayos a leads y analytics por cohorte.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ACCESOS RÁPIDOS (muestran más si estás logueado) */}
      <section className="container" style={{ padding: "8px 0 0" }}>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <Link to="/unidades" className="btn btn-ghost">Unidades</Link>
          <Link to="/ensayos" className="btn btn-ghost">Ensayos</Link>
          <Link to="/progreso" className="btn btn-ghost">Mi progreso</Link>
          {user && <Link to="/perfil" className="btn btn-ghost">Mi perfil</Link>}
        </div>
      </section>

      {/* FEATURES */}
      <section className="container" style={{ padding: "18px 0 32px" }}>
        <h2 style={{ margin: "0 0 8px" }}>Lo esencial para subir puntaje</h2>
        <p className="muted" style={{ margin: "0 0 16px" }}>
          Diseñado para PAES en Chile: Números, Álgebra, Estadística y Geometría.
        </p>

        <div
          className="grid"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}
        >
          <article className="card">
            <h3 style={{ margin: "4px 0 6px", fontSize: 18 }}>Rutas guiadas</h3>
            <p className="muted">Capítulos con dificultad progresiva y práctica guiada.</p>
          </article>
          <article className="card">
            <h3 style={{ margin: "4px 0 6px", fontSize: 18 }}>Miniensayos y simulaciones</h3>
            <p className="muted">Entrena con tiempo real y reportes por habilidad.</p>
          </article>
          <article className="card">
            <h3 style={{ margin: "4px 0 6px", fontSize: 18 }}>Panel para docentes</h3>
            <p className="muted">Progreso por estudiante y curso, filtros por unidad.</p>
          </article>
          <article className="card">
            <h3 style={{ margin: "4px 0 6px", fontSize: 18 }}>Velocidad y precisión</h3>
            <p className="muted">Drills de cálculo básico con métricas por sesión.</p>
          </article>
          <article className="card">
            <h3 style={{ margin: "4px 0 6px", fontSize: 18 }}>Banco de preguntas</h3>
            <p className="muted">Ítems tipo PAES etiquetados por habilidad y unidad.</p>
          </article>
          <article className="card">
            <h3 style={{ margin: "4px 0 6px", fontSize: 18 }}>Integraciones</h3>
            <p className="muted">Materiales, intranet y opciones para clases online.</p>
          </article>
        </div>
      </section>

      {/* CTA FINAL (más aire antes del footer, sin fondo propio) */}
      <section className="container" style={{ padding: "0 0 56px" }}>
        <div
          className="card"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) auto",
            gap: 16,
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Comienza gratis hoy</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              Plan gratuito con rutas base. Plan Pro con simulaciones y panel docente.
            </p>
          </div>
          <div className="row" style={{ gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
            {!user ? (
              <>
                <Link className="btn btn-ghost" to="/login">Ingresar</Link>
                <Link className="btn btn-primary" to="/registro">Crear cuenta</Link>
              </>
            ) : (
              <Link className="btn btn-primary" to="/inicio">Ir a mi inicio</Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
