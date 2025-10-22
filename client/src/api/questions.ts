import { apiGet } from "./http";

export type Option = {
  id: number;
  label: string;
  text: string;
  is_correct: boolean;
};

export type Question = {
  id: number;
  stem: string;
  difficulty: number;
  explanation: string;
  options: Option[];
};

export async function getQuestionsByTopic(topicId: string): Promise<Question[]> {
  return apiGet(`/api/topics/${topicId}/questions`);
}
