// src/App.tsx
import { useEffect, useState } from "react";
import { Link, Routes, Route } from "react-router-dom";
import { getUnits, type Unit } from "./api/units";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import "./styles/theme.css"; // Importa el CSS global una sola vez

// ✅ nuevas páginas
import ProfilePage from "./pages/ProfilePage";
import ExamHistoryPage from "./pages/ExamHistoryPage";
import ExamSetupPage from "./pages/ExamSetupPage";
import ExamRunPage from "./pages/ExamRunPage";
import ExamResultPage from "./pages/ExamResultPage";
import ExamReviewPage from "./pages/ExamReviewPage";

function UnitsList({ units }: { units: Unit[] }) {
  return (
    <div className="grid grid-4" style={{ marginTop: 16 }}>
      {units.map((u) => (
        <div key={u.id} className="card">
          <h3 style={{ marginTop: 0 }}>{u.name}</h3>
          {u.topics.length === 0 ? (
            <div className="muted">Sin temas aún</div>
          ) : (
            <ul style={{ margin: "8px 0 12px" }}>
              {u.topics.slice(0, 6).map((t) => (
                <li key={t.id}>{t.name}</li>
              ))}
            </ul>
          )}
          <Link to={`/units/${u.id}`} className="btn btn-primary">
            Ver unidad
          </Link>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    getUnits()
      .then(setUnits)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      {/* 🔝 Navbar ligera */}
      <nav
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e5e7eb",
          padding: "10px 0",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link to="/" className="btn-link">🏠 Inicio</Link>
          <Link to="/units" className="btn-link">📚 Unidades</Link>
          <Link to="/progreso" className="btn-link">🕓 Historial</Link>
          <Link to="/ensayo/nuevo" className="btn-link">🧪 Nuevo ensayo</Link>
        </div>
        <div>
          <Link to="/perfil" className="btn-link">👤 Mi perfil</Link>
        </div>
      </nav>

      <div className="container" style={{ padding: "16px 0 28px" }}>
        <Routes>
          {/* Home → Dashboard estilizado */}
          <Route path="/" element={<DashboardPage />} />

          {/* Listado de Unidades (mantiene tu lógica original) */}
          <Route
            path="/units"
            element={
              <>
                <h1 style={{ margin: 0 }}>Unidades</h1>
                <p className="muted">Listado de Unidades y Temas (desde el backend)</p>
                {loading && <p className="muted">Cargando…</p>}
                {err && <p style={{ color: "#FF8A8A" }}>Error: {err}</p>}
                {!loading && !err && <UnitsList units={units} />}
              </>
            }
          />

          {/* ✅ Nuevas rutas */}
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/progreso" element={<ExamHistoryPage />} />

          {/* Flujo de ensayos */}
          <Route path="/ensayo/nuevo" element={<ExamSetupPage />} />
          <Route path="/ensayo/:attemptId" element={<ExamRunPage />} />
          <Route path="/ensayo/:attemptId/resultado" element={<ExamResultPage />} />
          <Route path="/ensayo/:attemptId/revision" element={<ExamReviewPage />} />
        </Routes>
      </div>
    </AppLayout>
  );
}
