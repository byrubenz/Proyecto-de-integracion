// src/components/AppLayout.tsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/theme.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const isStudent = user?.role === "student";
  const isPaid = Boolean(user?.is_paid);
  const brandHref = isAdmin ? "/admin" : user ? (isPaid ? "/inicio" : "/pago") : "/";

  return (
    <div className="app-shell">
      <nav className="nav">
        <div className="container inner" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div className="brand" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="dot" />
            <Link
              to={brandHref}
              style={{ color: "white", textDecoration: "none", fontWeight: "bold", fontSize: "1.2rem" }}
            >
              Preu<span style={{ color: "var(--accent-500)" }}>+</span>
            </Link>
          </div>

          <div className="row" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {!user && (
              <>
                <Link className="btn btn-ghost" to="/login">Iniciar sesion</Link>
                <Link className="btn btn-primary" to="/registro">Registrarse</Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link className="btn btn-ghost" to="/admin">Panel de administrador</Link>
                <span className="muted" style={{ color: "#ccc" }}>Hola, {user?.name}</span>
                <button
                  onClick={logout}
                  className="btn btn-ghost"
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Cerrar sesion
                </button>
              </>
            )}

            {isStudent && isPaid && (
              <>
                <Link className="btn btn-ghost" to="/inicio">Inicio</Link>
                <Link className="btn btn-ghost" to="/unidades">Unidades</Link>
                <Link className="btn btn-ghost" to="/progreso">Progreso</Link>
                <Link className="btn btn-ghost" to="/ensayos">Ensayos</Link>
                <Link className="btn-link" to="/nem-ranking">📊 NEM & Ranking</Link>
                <Link className="btn btn-ghost" to="/amigos">Amigos</Link>
                <Link className="btn btn-ghost" to="/perfil">Perfil</Link>
                <span className="muted" style={{ color: "#ccc" }}>Hola, {user?.name}</span>
                <button
                  onClick={logout}
                  className="btn btn-ghost"
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Cerrar sesion
                </button>
              </>
            )}

            {isStudent && !isPaid && (
              <>
                <Link className="btn btn-primary" to="/pago">Activar plan</Link>
                <Link className="btn btn-ghost" to="/amigos">Amigos</Link>
                <Link className="btn btn-ghost" to="/perfil">Perfil</Link>
                <button
                  onClick={logout}
                  className="btn btn-ghost"
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Cerrar sesion
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="app-main">{children}</main>

      <footer className="footer">
        <div className="container" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{new Date().getFullYear()} Preu+</span>
          <span className="muted">Soporte - Terminos - Privacidad</span>
        </div>
      </footer>
    </div>
  );
}
