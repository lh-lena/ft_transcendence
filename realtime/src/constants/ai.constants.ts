import type { aiConfigType } from '../schemas/ai.schema.js';

export enum AIDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export const AIConfig: Record<AIDifficulty, aiConfigType> = {
  [AIDifficulty.EASY]: {
    deadZone: 0.25,
    predictionError: 70,
    predictionAccuracy: 0.6,
    errorBias: 0.7,
    focusLevel: 0.75,
    hesitationRange: 50,
  },
  [AIDifficulty.MEDIUM]: {
    deadZone: 0.15,
    predictionError: 35,
    predictionAccuracy: 0.8,
    errorBias: 0.85,
    focusLevel: 0.9,
    hesitationRange: 25,
  },
  [AIDifficulty.HARD]: {
    deadZone: 0.05,
    predictionError: 5,
    predictionAccuracy: 0.95,
    errorBias: 1.2,
    focusLevel: 0.98,
    hesitationRange: 2,
  },
};

export const PREDICTION_CONFIG = {
  MAX_ITERATIONS: 100,
  PRECISION: 0.01,
};
