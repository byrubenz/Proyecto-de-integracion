// src/pages/RegisterPage.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { register, login, saveSession } from "../api/auth";
import AppLayout from "../components/AppLayout";

/**
 * Vista de Registro conectada al backend
 * - Captura nombre, email y contraseña
 * - Llama a /api/auth/register
 * - Autologin: /api/auth/login, guarda sesión y redirige a /unidades
 */
export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Ingresa tu nombre");
      return;
    }

    try {
      setLoading(true);
      // 1) Registrar usuario
      await register(email, password, name);

      // 2) Autologin
      const data = await login(email, password);
      saveSession(data);

      toast.success(`Cuenta creada. ¡Bienvenido, ${data.user.name}!`);
      navigate("/unidades");
    } catch (err) {
      console.error("❌ Error en registro:", err);
      toast.error("No se pudo registrar. Prueba con otro correo o revisa los datos.");
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
          <h2 style={{ marginTop: 0, textAlign: "center" }}>Crear cuenta</h2>
          <p className="muted" style={{ textAlign: "center", marginBottom: 24 }}>
            Regístrate para comenzar a preparar la PAES Matemáticas
          </p>

          <form onSubmit={handleSubmit} className="grid" style={{ gap: 12 }}>
            {/* Nombre */}
            <div>
              <label>Nombre</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Tu nombre"
              />
            </div>

            {/* Email */}
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

            {/* Contraseña */}
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
              style={{ marginTop: 8 }}
              disabled={loading}
            >
              {loading ? "Creando cuenta..." : "Registrarme"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 16 }}>
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="link">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
