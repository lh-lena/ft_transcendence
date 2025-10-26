import { generateProfilePrint } from "../utils/profilePrintFunctions";
import { UserProfile } from "../types";

// all these things below were sample pieces of data i used to help me understand how to scaffold the front end
// replacing this with actual queries to backend soon

// static for testing
export const userStore: UserProfile = {
  username: "mo",
  color: "#D72E1D",
  colormap: ["#D72E1D", "#D72E1D", "#D72E1D", "#D72E1D"],
};

export const userStore2: UserProfile = {
  username: "test",
  color: "#06833E",
  colormap: ["#06833E", "#FFFFFF", "#06833E", "#FFFFFF"],
};

export const sampleScores = [
  { playerName: "Mo", score: 99 },
  { playerName: "Alex", score: 97 },
  { playerName: "Sam", score: 95 },
  { playerName: "Jamie", score: 93 },
  { playerName: "Taylor", score: 91 },
  { playerName: "Jordan", score: 89 },
  { playerName: "Morgan", score: 87 },
  { playerName: "Casey", score: 85 },
  { playerName: "Riley", score: 83 },
  { playerName: "Drew", score: 81 },
  { playerName: "Sky", score: 79 },
  { playerName: "Quinn", score: 77 },
];

export const sampleFriends = [
  {
    username: "alex",
    ...generateProfilePrint(2),
    status: "online",
  },
  {
    username: "sam",
    ...generateProfilePrint(2),
    status: "online",
  },
  {
    username: "jamie",
    ...generateProfilePrint(2),
    status: "online",
  },
  {
    username: "taylor",
    ...generateProfilePrint(2),
    status: "online",
  },
  {
    username: "jordan",
    ...generateProfilePrint(2),
    status: "offline",
  },
  {
    username: "casey",
    ...generateProfilePrint(2),
    status: "offline",
  },
  {
    username: "riley",
    ...generateProfilePrint(2),
    status: "offline",
  },
  {
    username: "drew",
    ...generateProfilePrint(2),
    status: "offline",
  },
];

export const sampleScoreHistory = [
  { playerName: "mo", result: "loss" },
  { playerName: "alex", result: "loss" },
  { playerName: "sam", result: "win" },
  { playerName: "jamie", result: "loss" },
  { playerName: "taylor", result: "win" },
  { playerName: "jordan", result: "win" },
  { playerName: "mrgan", result: "loss" },
  { playerName: "casey", result: "win" },
  { playerName: "riley", result: "loss" },
  { playerName: "drew", result: "win" },
  { playerName: "sky", result: "loss" },
  { playerName: "quinn", result: "win" },
];

export const sampleChatHistory = [
  { sender: "me", message: "hey! want to play a game?" },
  {
    sender: "other",
    message: "sure! I was just about to ask you the same thing",
  },
  { sender: "me", message: "haha great minds think alike" },
  { sender: "other", message: "ready when you are" },
  { sender: "me", message: "let's do this 🏓" },
  { sender: "other", message: "prepare to lose! 😄" },
  { sender: "me", message: "we'll see about that..." },
  { sender: "other", message: "good game! you got me that time" },
  { sender: "me", message: "thanks! you played really well too" },
  { sender: "other", message: "rematch?" },
  { sender: "me", message: "absolutely! best of 3?" },
  { sender: "other", message: "you're on!" },
];
