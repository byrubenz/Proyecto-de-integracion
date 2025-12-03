export const previewNemRanking = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const { nem_score, ranking_score, careers } = req.body || {};

    const nemScore = Number(nem_score);
    const rankingScore = Number(ranking_score);

    if (!Number.isFinite(nemScore) || !Number.isFinite(rankingScore)) {
      return res.status(400).json({
        error: "nem_score y ranking_score son requeridos y deben ser numeros",
      });
    }

    if (!Array.isArray(careers) || careers.length === 0) {
      return res.status(400).json({
        error: "careers debe ser un arreglo con al menos un elemento",
      });
    }

    const results = [];

    for (let i = 0; i < careers.length; i++) {
      const career = careers[i] || {};
      const {
        name,
        ponderacion_nem,
        ponderacion_ranking,
        puntaje_corte,
      } = career;

      const careerName = typeof name === "string" ? name.trim() : "";
      const pNem = Number(ponderacion_nem);
      const pRanking = Number(ponderacion_ranking);
      const puntajeCorte = Number(puntaje_corte);

      if (!careerName) {
        return res.status(400).json({
          error: `Carrera en indice ${i + 1} no tiene name valido`,
        });
      }

      if (
        !Number.isFinite(pNem) ||
        !Number.isFinite(pRanking) ||
        pNem < 0 ||
        pNem > 1 ||
        pRanking < 0 ||
        pRanking > 1
      ) {
        return res.status(400).json({
          error: `Ponderaciones invalidas en ${careerName}: deben ser numeros entre 0 y 1`,
        });
      }

      if (!Number.isFinite(puntajeCorte)) {
        return res.status(400).json({
          error: `puntaje_corte invalido en ${careerName}`,
        });
      }

      const puntaje_ponderado = nemScore * pNem + rankingScore * pRanking;
      const brecha_vs_corte = puntaje_ponderado - puntajeCorte;

      results.push({
        name: careerName,
        ponderacion_nem: pNem,
        ponderacion_ranking: pRanking,
        puntaje_corte: puntajeCorte,
        puntaje_ponderado,
        brecha_vs_corte,
      });
    }

    return res.json({ ok: true, results });
  } catch (err) {
    console.error("Error en POST /nem-ranking/preview:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
