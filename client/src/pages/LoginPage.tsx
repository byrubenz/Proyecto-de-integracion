// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { login } from "../api/auth";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: setSession } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);

      const data = await login(email, password);

      // normalizamos is_paid (0/1, "0"/"1", boolean, etc.)
      const rawPaid = (data.user as any).is_paid;
      const isPaid = rawPaid === true || rawPaid === 1 || rawPaid === "1";

      const normalizedUser = { ...data.user, is_paid: isPaid };
      // guardamos en el contexto
      setSession({ ...data, user: normalizedUser } as any);

      // 🔹 redirección según rol + pago
      if (normalizedUser.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (normalizedUser.role === "student" && normalizedUser.is_paid) {
        navigate("/inicio", { replace: true });
      } else {
        // student sin pago → landing
        navigate("/", { replace: true });
      }

      toast.success(`Bienvenido, ${normalizedUser.name}`);
      // ⚠️ IMPORTANTE: NADA DE window.location.reload()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      console.error("Error al iniciar sesión:", msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div
        className="container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 160px)",
          padding: "40px 0",
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: 420,
            width: "100%",
            padding: 32,
            boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
          }}
        >
          <h2 style={{ marginTop: 0, textAlign: "center" }}>Iniciar sesión</h2>
          <p className="muted" style={{ textAlign: "center", marginBottom: 24 }}>
            Accede a tu cuenta para continuar con tu preparación PAES
          </p>

          <form onSubmit={handleSubmit} className="grid" style={{ gap: 12 }}>
            <div>
              <label>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="tucorreo@dominio.com"
              />
            </div>

            <div>
              <label>Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Entrar"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 16 }}>
            ¿No tienes cuenta?{" "}
            <Link to="/registro" className="link">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
