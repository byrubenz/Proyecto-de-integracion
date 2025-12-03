import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";

export default function PaywallPage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <section className="container" style={{ maxWidth: 960, margin: "0 auto", padding: "32px 0 40px" }}>
        <div className="card" style={{ padding: 30, display: "grid", gap: 18 }}>
          <div>
            <p className="muted" style={{ fontWeight: 700, letterSpacing: 0.2 }}>
              Plan Preu+ PAES
            </p>
            <h1 style={{ margin: "6px 0 10px" }}>Aún no tienes acceso completo.</h1>
            <p className="muted" style={{ margin: 0 }}>
              Activa tu plan para ver unidades, temas, ensayos y todo el contenido. {user?.email ? `Sesión: ${user.email}` : ""}
            </p>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
            <article className="card" style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 style={{ margin: "0 0 6px" }}>Plan completo</h2>
              <p style={{ fontSize: 28, margin: "0 0 4px" }}>$19.990 CLP</p>
              <p className="muted" style={{ margin: "0 0 14px" }}>Pago único por acceso total durante 1 mes.</p>
              <ul style={{ paddingLeft: 18, lineHeight: 1.6, margin: "0 0 16px" }}>
                <li>Simulacros PAES y revisión detallada</li>
                <li>Práctica por unidades y temas</li>
                <li>Analítica de progreso con velocidad y precisión</li>
                <li>Soporte y tutoría para dudas</li>
              </ul>
              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={() => alert("Este botón es de ejemplo. Contacta al admin para activar tu acceso.")}
              >
                Pagar ahora
              </button>
              <p className="muted" style={{ marginTop: 12 }}>
                ¿Tienes código de acceso o quieres pagar por transferencia? Escribe al administrador para activarlo.
              </p>
            </article>

            <article className="card">
              <h3 style={{ margin: "0 0 8px" }}>¿Qué incluye?</h3>
              <ul style={{ paddingLeft: 18, lineHeight: 1.6, margin: 0 }}>
                <li>Ensayos cronometrados con puntaje estimado</li>
                <li>Plan de estudio semanal y rutas guiadas</li>
                <li>Reportes de avance y temas a reforzar</li>
                <li>Acceso a clases y soporte cuando lo necesites</li>
              </ul>
              <div className="card" style={{ marginTop: 16, background: "rgba(255,255,255,.03)" }}>
                <p style={{ margin: "0 0 6px" }}>¿Dudas?</p>
                <p className="muted" style={{ margin: 0 }}>Escríbenos para activar tu plan o solicitar beca.</p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
