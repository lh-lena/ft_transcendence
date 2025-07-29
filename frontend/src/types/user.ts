import { generateProfilePrint } from '../utils/generateProfilePrint';

export interface UserProfile {
    username: string;
    color: string;
    colorMap: string[];
}

const { color, colorMap } = generateProfilePrint(2);

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

export const sampleFriends = [
  {
    username: 'alex',
    ...generateProfilePrint(2)
  },
  {
    username: 'sam',
    ...generateProfilePrint(2)
  },
  {
    username: 'jamie',
    ...generateProfilePrint(2)
  },
  {
    username: 'taylor',
    ...generateProfilePrint(2)
  },
  {
    username: 'jordan',
    ...generateProfilePrint(2)
  },
  {
    username: 'casey',
    ...generateProfilePrint(2)
  },
  {
    username: 'riley',
    ...generateProfilePrint(2)
  },
  {
    username: 'drew',
    ...generateProfilePrint(2)
  }
]

export const sampleScoreHistory = [
  { playerName: 'mo', result: 'loss' },
  { playerName: 'alex', result: 'loss' },
  { playerName: 'sam', result: 'win' },
  { playerName: 'jamie', result: 'loss' },
  { playerName: 'taylor', result: 'win' },
  { playerName: 'jordan', result: 'win' },
  { playerName: 'mrgan', result: 'loss' },
  { playerName: 'casey', result: 'win' },
  { playerName: 'riley', result: 'loss' },
  { playerName: 'drew', result: 'win' },
  { playerName: 'sky', result: 'loss' },
  { playerName: 'quinn', result: 'win' },
];