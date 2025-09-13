export enum AIDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}
export interface aiConfigType {
  errorRate: number;
  predictionTime: number;
  responseDelay: number;
}

export const AIConfig: Record<AIDifficulty, aiConfigType> = {
  [AIDifficulty.EASY]: {
    errorRate: 0.2,
    predictionTime: 0.4,
    responseDelay: 0.15,
  },
  [AIDifficulty.MEDIUM]: {
    errorRate: 0.1,
    predictionTime: 0.8,
    responseDelay: 0.1,
  },
  [AIDifficulty.HARD]: {
    errorRate: 0.03,
    predictionTime: 1.0,
    responseDelay: 0.03,
  },
};

export const AI_THRESHOLD = 10;
