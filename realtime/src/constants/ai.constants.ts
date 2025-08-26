export enum AIDifficulty {
  EASY = 'easy', // 60% accuracy, slow reaction 200ms delay
  MEDIUM = 'medium', // 75% accuracy, moderate reaction 100ms delay
  HARD = 'hard', // 90% accuracy, fast reaction 50ms delay
}

export const aiConfig = {
  easy: { errorRate: 0.3, reactionTime: 1200 },
  medium: { errorRate: 0.15, reactionTime: 800 },
  hard: { errorRate: 0.05, reactionTime: 400 },
};

/**
  - Easy: slow reaction, high error
  - Medium: moderate reaction, some error
  - Hard: fast reaction, low error
 */

// form index : export * from './ai.constants.js';
