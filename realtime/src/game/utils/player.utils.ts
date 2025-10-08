import type { Player, GameSession, Paddle, GameState } from '../../schemas/game.schema.js';
import { AIDifficulty, GameMode, PaddleName } from '../../constants/index.js';
import type { User, UserIdObject, UserIdType } from '../../schemas/user.schema.js';

export function isAIPlayer(player: Player): boolean {
  return player.isAI === true;
}

export function getAIPaddle(gameState: GameState): Paddle | undefined {
  if (gameState.paddleB.isAI) {
    return gameState.paddleB;
  }
  return gameState.paddleA;
}

export function addAIPlayerToGame(
  game: GameSession,
  mode: GameMode,
  aiDifficulty?: AIDifficulty,
): void {
  if (mode !== GameMode.PVB_AI) {
    return;
  }
  const player: Player = {
    userId: null as unknown as UserIdType,
    userAlias: 'AI Bot',
    username: 'AI Bot',
    isAI: true,
    aiDifficulty: aiDifficulty ?? AIDifficulty.MEDIUM,
  };
  game.players.push(player);
}

export function getPlayer1Username(game: GameSession): string {
  let player1Username = game.players[0]?.userAlias;
  if (player1Username === undefined || player1Username === null) {
    player1Username = 'Player A';
  }
  return player1Username;
}

export function getPlayer2Username(game: GameSession): string {
  let player2Username = game.players[1]?.userAlias;
  if (player2Username === undefined || player2Username === null) {
    player2Username = 'Player B';
  }
  return player2Username;
}

export function assignPaddleToPlayers(game: GameSession): void {
  const { gameState } = game;
  gameState.paddleA.isAI = false;
  gameState.paddleB.isAI = false;

  game.players.forEach((player: Player, index: number) => {
    const paddleName = index === 0 ? PaddleName.PADDLE_A : PaddleName.PADDLE_B;
    player.paddle = paddleName;

    if (isAIPlayer(player)) {
      const paddle = paddleName === PaddleName.PADDLE_A ? gameState.paddleA : gameState.paddleB;
      paddle.isAI = true;
    }
  });
}

export function createPlayerFromUser(user: User, aiDifficulty?: AIDifficulty): Player {
  return {
    ...user,
    sequence: 0,
    isAI: false,
    aiDifficulty: aiDifficulty,
  };
}

export function getUserIdObjectArray(players: Player[]): UserIdObject[] {
  const userIdArray: UserIdObject[] = [];
  players.forEach((player) => {
    if (player.isAI === false) {
      userIdArray.push({ userId: player.userId });
    }
  });
  return userIdArray;
}
