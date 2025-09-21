import type { aiConfigType } from '../schemas/ai.schema.js';

export enum AIDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export const AIConfig: Record<AIDifficulty, aiConfigType> = {
  [AIDifficulty.EASY]: {
    threshold: 0.25,
    predictionTime: 0.8,
    precision: 0.1,
    predictionError: 80,
    predictionAccuracy: 0.6,
  },
  [AIDifficulty.MEDIUM]: {
    threshold: 0.1,
    predictionTime: 1.0,
    precision: 0.05,
    predictionError: 25,
    predictionAccuracy: 0.8,
  },
  [AIDifficulty.HARD]: {
    threshold: 0.05,
    predictionTime: 2.0,
    precision: 0.01,
    predictionError: 5,
    predictionAccuracy: 0.98,
  },
};
