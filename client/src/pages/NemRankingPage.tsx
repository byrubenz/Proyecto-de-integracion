import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import AppLayout from "../components/AppLayout";
import {
  previewNemRanking,
  type NemRankingResult,
  type NemRankingCareerInput,
} from "../api/nemRanking";

type CareerRow = {
  id: string;
  name: string;
  ponderacion_nem: string;
  ponderacion_ranking: string;
  puntaje_corte: string;
};

const newCareerRow = (): CareerRow => ({
  id: Math.random().toString(36).slice(2),
  name: "",
  ponderacion_nem: "",
  ponderacion_ranking: "",
  puntaje_corte: "",
});

export default function NemRankingPage() {
  const [nemScore, setNemScore] = useState<string>("");
  const [rankingScore, setRankingScore] = useState<string>("");
  const [careers, setCareers] = useState<CareerRow[]>([newCareerRow()]);
  const [results, setResults] = useState<NemRankingResult[]>([]);
  const [loading, setLoading] = useState(false);

  const sortedResults = useMemo(
    () => [...results].sort((a, b) => b.puntaje_ponderado - a.puntaje_ponderado),
    [results]
  );

  const updateCareer = (id: string, key: keyof CareerRow, value: string) => {
    setCareers((prev) => prev.map((c) => (c.id === id ? { ...c, [key]: value } : c)));
  };

  const addCareer = () => setCareers((prev) => [...prev, newCareerRow()]);

  const removeCareer = (id: string) =>
    setCareers((prev) => (prev.length === 1 ? prev : prev.filter((c) => c.id !== id)));

  const validate = () => {
    const nem = Number(nemScore);
    if (!Number.isFinite(nem)) {
      toast.error("Ingresa tu puntaje NEM");
      return null;
    }
    if (nem < 150 || nem > 850) {
      toast.error("El puntaje NEM debe estar entre 150 y 850");
      return null;
    }

    const ranking = Number(rankingScore);
    if (!Number.isFinite(ranking)) {
      toast.error("Ingresa tu puntaje Ranking");
      return null;
    }
    if (ranking < 150 || ranking > 850) {
      toast.error("El puntaje Ranking debe estar entre 150 y 850");
      return null;
    }

    if (!Array.isArray(careers) || careers.length === 0) {
      toast.error("Agrega al menos una carrera");
      return null;
    }

    const normalizedCareers: NemRankingCareerInput[] = [];
    for (const c of careers) {
      const name = c.name.trim();
      if (!name) {
        toast.error("Alguna carrera no tiene nombre");
        return null;
      }
      const pNem = Number(c.ponderacion_nem);
      const pRanking = Number(c.ponderacion_ranking);
      const corte = Number(c.puntaje_corte);

      if (
        !Number.isFinite(pNem) ||
        !Number.isFinite(pRanking) ||
        pNem < 0 ||
        pNem > 1 ||
        pRanking < 0 ||
        pRanking > 1
      ) {
        toast.error(`Ponderaciones inválidas en "${name}" (usa valores entre 0 y 1)`);
        return null;
      }

      if (!Number.isFinite(corte)) {
        toast.error(`Puntaje de corte inválido en "${name}"`);
        return null;
      }

      normalizedCareers.push({
        name,
        ponderacion_nem: pNem,
        ponderacion_ranking: pRanking,
        puntaje_corte: corte,
      });
    }

    return { nem, ranking, normalizedCareers };
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const validated = validate();
    if (!validated) return;

    try {
      setLoading(true);
      const resp = await previewNemRanking({
        nem_score: validated.nem,
        ranking_score: validated.ranking,
        careers: validated.normalizedCareers,
      });
      setResults(resp?.results ?? []);
      toast.success("Cálculo listo");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo calcular";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container" style={{ padding: "24px 0 32px" }}>
        <header style={{ marginBottom: 16 }}>
          <p className="muted" style={{ marginBottom: 4 }}>Simulador rápido</p>
          <h2 style={{ margin: "0 0 6px" }}>Calcula tu puntaje ponderado (NEM + Ranking)</h2>
          <p className="muted">
            Ingresa tus puntajes en escala PAES y las ponderaciones de cada carrera para estimar tu brecha vs el puntaje de corte.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="grid" style={{ gap: 16 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Tus puntajes</h3>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="muted">NEM (150 - 850)</label>
                <input
                  type="number"
                  min={150}
                  max={850}
                  value={nemScore}
                  onChange={(e) => setNemScore(e.target.value)}
                  className="input"
                  placeholder="Ej: 650"
                />
              </div>
              <div>
                <label className="muted">Ranking (150 - 850)</label>
                <input
                  type="number"
                  min={150}
                  max={850}
                  value={rankingScore}
                  onChange={(e) => setRankingScore(e.target.value)}
                  className="input"
                  placeholder="Ej: 720"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>Carreras</h3>
                <p className="muted" style={{ marginTop: 4 }}>
                  Define las ponderaciones y puntaje de corte de cada carrera para calcular el puntaje ponderado.
                </p>
              </div>
              <button type="button" className="btn btn-primary" onClick={addCareer}>
                + Agregar carrera
              </button>
            </div>

            <div style={{ overflowX: "auto", marginTop: 12 }}>
              <table className="table" style={{ width: "100%", minWidth: 720 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Nombre</th>
                    <th>Pond. NEM</th>
                    <th>Pond. Ranking</th>
                    <th>Puntaje corte</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {careers.map((c) => (
                    <tr key={c.id}>
                      <td style={{ minWidth: 240 }}>
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => updateCareer(c.id, "name", e.target.value)}
                          className="input"
                          placeholder="Ej: Ingeniería en Informática - U Talca"
                        />
                      </td>
                      <td style={{ width: 140 }}>
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step={0.05}
                          value={c.ponderacion_nem}
                          onChange={(e) => updateCareer(c.id, "ponderacion_nem", e.target.value)}
                          className="input"
                          placeholder="0.20"
                        />
                      </td>
                      <td style={{ width: 140 }}>
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step={0.05}
                          value={c.ponderacion_ranking}
                          onChange={(e) => updateCareer(c.id, "ponderacion_ranking", e.target.value)}
                          className="input"
                          placeholder="0.30"
                        />
                      </td>
                      <td style={{ width: 160 }}>
                        <input
                          type="number"
                          value={c.puntaje_corte}
                          onChange={(e) => updateCareer(c.id, "puntaje_corte", e.target.value)}
                          className="input"
                          placeholder="Ej: 680"
                        />
                      </td>
                      <td style={{ width: 100, textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => removeCareer(c.id)}
                          disabled={careers.length === 1}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="row" style={{ marginTop: 12, justifyContent: "flex-end", gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Calculando..." : "Calcular puntaje"}
              </button>
            </div>
          </div>
        </form>

        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>Resultados</h3>
          {sortedResults.length === 0 ? (
            <p className="muted">Los resultados aparecerán aquí después de calcular.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table" style={{ width: "100%", minWidth: 640 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Carrera</th>
                    <th>Puntaje ponderado</th>
                    <th>Brecha vs corte</th>
                    <th>Puntaje corte</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((r) => {
                    const brechaColor = r.brecha_vs_corte >= 0 ? "#22c55e" : "#f87171";
                    return (
                      <tr key={r.name}>
                        <td style={{ minWidth: 220 }}>{r.name}</td>
                        <td style={{ fontWeight: 700 }}>{r.puntaje_ponderado.toFixed(1)}</td>
                        <td style={{ color: brechaColor }}>
                          {r.brecha_vs_corte >= 0 ? "+" : ""}
                          {r.brecha_vs_corte.toFixed(1)}
                        </td>
                        <td>{r.puntaje_corte}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
