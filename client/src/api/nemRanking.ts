import withAuth from "./withAuth";

export type NemRankingCareerInput = {
  name: string;
  ponderacion_nem: number;
  ponderacion_ranking: number;
  puntaje_corte: number;
};

export type PreviewNemRankingPayload = {
  nem_score: number;
  ranking_score: number;
  careers: NemRankingCareerInput[];
};

export type NemRankingResult = NemRankingCareerInput & {
  puntaje_ponderado: number;
  brecha_vs_corte: number;
};

export type PreviewNemRankingResponse = {
  ok: boolean;
  results: NemRankingResult[];
};

export async function previewNemRanking(
  payload: PreviewNemRankingPayload
): Promise<PreviewNemRankingResponse> {
  return withAuth("/nem-ranking/preview", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
