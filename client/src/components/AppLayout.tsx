// src/components/AppLayout.tsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/theme.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <nav className="nav">
        <div className="container inner" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div className="brand" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="dot" />
            <Link to="/" style={{ color: "white", textDecoration: "none", fontWeight: "bold", fontSize: "1.2rem" }}>
              Preu<span style={{ color: "var(--accent-500)" }}>+</span>
            </Link>
          </div>

          <div className="row" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {user ? (
              <>
                <Link className="btn btn-ghost" to="/">Inicio</Link>
                <Link className="btn btn-ghost" to="/unidades">Unidades</Link>
                <Link className="btn btn-ghost" to="/progreso">Mi progreso</Link>
                <Link className="btn btn-ghost" to="/ensayos">Ensayos</Link>
                <Link className="btn btn-primary" to="/ensayo/nuevo">Nuevo ensayo</Link>
                <Link className="btn btn-ghost" to="/perfil">Mi perfil</Link>
                <span className="muted" style={{ color: "#ccc" }}>Hola, {user.name}</span>
                <button onClick={logout} className="btn btn-ghost" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-ghost" to="/login">Iniciar sesión</Link>
                <Link className="btn btn-primary" to="/registro">Registrarse</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="app-main">{children}</main>

      <footer className="footer">
        <div className="container" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>© {new Date().getFullYear()} Preu+</span>
          <span className="muted">Soporte · Términos · Privacidad</span>
        </div>
      </footer>
    </div>
  );
}
