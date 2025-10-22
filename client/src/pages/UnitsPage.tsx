// src/pages/UnitsPage.tsx
import { useEffect, useState } from "react";
import { getUnits, type Unit } from "../api/units";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUnits()
      .then((data) => setUnits(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <AppLayout>
        <div className="container" style={{ textAlign: "center", padding: "60px 0" }}>
          <p className="muted">Cargando unidades...</p>
        </div>
      </AppLayout>
    );

  return (
    <AppLayout>
      <div className="container" style={{ padding: "40px 0" }}>
        <h1 style={{ marginBottom: 10 }}>📚 Unidades</h1>
        <p className="muted" style={{ marginBottom: 28 }}>
          Explora las unidades del temario PAES Matemáticas. Elige un tema para practicar.
        </p>

        <div
          className="grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {units.map((u) => (
            <div
              key={u.id}
              className="card"
              style={{
                borderRadius: 14,
                padding: 20,
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.06)",
                backdropFilter: "blur(8px)",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  fontSize: 20,
                  marginBottom: 12,
                  color: "var(--text-100)",
                }}
              >
                {u.name}
              </h2>

              {u.topics.length === 0 ? (
                <p className="muted">Sin temas aún</p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
                  {u.topics.map((t) => (
                    <li key={t.id}>
                      <Link
                        to={`/temas/${t.id}`}
                        className="btn btn-ghost"
                        style={{
                          width: "100%",
                          textAlign: "left",
                          justifyContent: "flex-start",
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,.06)",
                          background: "rgba(255,255,255,.02)",
                        }}
                      >
                        {t.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

