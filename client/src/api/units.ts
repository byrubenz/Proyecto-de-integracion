import { apiGet } from "./http";

export type Topic = { id: number; name: string };
export type Unit = { id: number; name: string; topics: Topic[] };

export async function getUnits(): Promise<Unit[]> {
  return apiGet("/api/units");
}
