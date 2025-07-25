import { generateProfilePrint } from '../utils/generateProfilePrint';

export interface UserProfile {
    username: string;
    color: string;
    colorMap: string[];
}

const { color, colorMap } = generateProfilePrint(40, 40, 2);

export const userStore: UserProfile = {
    username: 'mo',
    color: color,
    colorMap: colorMap
}

export const sampleScores = [
  { playerName: 'Mo', score: 99 },
  { playerName: 'Alex', score: 97 },
  { playerName: 'Sam', score: 95 },
  { playerName: 'Jamie', score: 93 },
  { playerName: 'Taylor', score: 91 },
  { playerName: 'Jordan', score: 89 },
  { playerName: 'Morgan', score: 87 },
  { playerName: 'Casey', score: 85 },
  { playerName: 'Riley', score: 83 },
  { playerName: 'Drew', score: 81 },
  { playerName: 'Sky', score: 79 },
  { playerName: 'Quinn', score: 77 },
];