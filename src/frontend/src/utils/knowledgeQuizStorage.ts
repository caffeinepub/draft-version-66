import { useInternetIdentity } from '../hooks/useInternetIdentity';

export interface QuizScore {
  categoryId: string;
  score: number;
  total: number;
  timestamp: string;
}

const GUEST_STORAGE_KEY = 'guest-knowledge-quiz-scores';

function getStorageKey(principalId?: string): string {
  if (principalId && principalId !== 'guest') {
    return `knowledge-quiz-scores-${principalId}`;
  }
  return GUEST_STORAGE_KEY;
}

export function getQuizScores(principalId?: string): Record<string, QuizScore> {
  const key = getStorageKey(principalId);
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading quiz scores:', error);
    return {};
  }
}

export function saveQuizScore(categoryId: string, score: number, total: number, principalId?: string): void {
  const key = getStorageKey(principalId);
  try {
    const scores = getQuizScores(principalId);
    scores[categoryId] = {
      categoryId,
      score,
      total,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(scores));
  } catch (error) {
    console.error('Error saving quiz score:', error);
  }
}

export function useQuizScores() {
  const { identity } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString();
  
  return {
    scores: getQuizScores(principalId),
    saveScore: (categoryId: string, score: number, total: number) => 
      saveQuizScore(categoryId, score, total, principalId),
  };
}
