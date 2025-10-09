import { GameSessionStatus, PaddleName } from '../../constants/game.constants.js';
import { GameResult, GameSession, Player } from '../../schemas/game.schema.js';
import { getPlayer1Username, getPlayer2Username } from './player.utils.js';
import { UserIdType } from '../../schemas/user.schema.js';
import { ok, err, Result } from 'neverthrow';

export function createGameResult(
  game: GameSession,
  status: GameSessionStatus,
  leftPlayerId?: UserIdType,
): Result<GameResult, string> {
  const baseResult: Partial<GameResult> = formatBaseResult(game, status);
  let result: GameResult;
  switch (status) {
    case GameSessionStatus.FINISHED:
      result = reformatFinishedResult(baseResult, game);
      break;

    case GameSessionStatus.CANCELLED:
      result = reformatCancelledResult(baseResult, game, leftPlayerId);
      break;

    case GameSessionStatus.CANCELLED_SERVER_ERROR:
      result = reformatServerCancelledResult(baseResult);
      break;

    default:
      return err(`invalid game status: ${status}`);
  }
  return ok(result);
}

function formatBaseResult(game: GameSession, status: GameSessionStatus): Partial<GameResult> {
  const finishedAt = getTimestamp(game, 'finishedAt');
  const startedAt = getTimestamp(game, 'startedAt');
  const player1Username = getPlayer1Username(game);
  const player2Username = getPlayer2Username(game);

  const result = {
    gameId: game.gameId,
    scorePlayer1: game.gameState.paddleA.score,
    scorePlayer2: game.gameState.paddleB.score,
    player1Username: player1Username,
    player2Username: player2Username,
    mode: game.mode,
    startedAt: startedAt,
    finishedAt: finishedAt,
    status: status,
  } as GameResult;
  return result;
}

function reformatFinishedResult(baseResult: Partial<GameResult>, game: GameSession): GameResult {
  const winner = getWinnerPlayer(game);
  const winnerName = getPlayerName(winner as Player);
  const loser = getLoserPlayer(game);
  const result = {
    ...baseResult,
    winnerName: winnerName,
    winnerId: winner?.userId,
    loserId: loser?.userId,
  } as GameResult;
  return result;
}

function reformatCancelledResult(
  baseResult: Partial<GameResult>,
  game: GameSession,
  leftPlayerId?: UserIdType,
): GameResult {
  let winner: Player | null = null;
  let loserId: UserIdType | null = null;

  if (leftPlayerId) {
    winner = game.players.find((p) => p.userId !== leftPlayerId) || null;
    loserId = leftPlayerId;
  } else {
    winner = getWinnerPlayer(game);
    loserId = null;
  }

  const winnerName = winner ? getPlayerName(winner) : 'none';
  const result = {
    ...baseResult,
    winnerName: winnerName,
    winnerId: winner?.userId || null,
    loserId: loserId,
  } as GameResult;
  return result;
}

function reformatServerCancelledResult(baseResult: Partial<GameResult>): GameResult {
  return {
    ...baseResult,
    winnerName: 'none',
    winnerId: null,
    loserId: null,
  } as GameResult;
}

function getTimestamp(game: GameSession, type: 'finishedAt' | 'startedAt'): string {
  let timestamp = game[type];
  if (timestamp === undefined || timestamp === null) {
    timestamp = Date.now().toString();
  }
  return timestamp;
}

function getWinnerPlayer(game: GameSession): Player | null {
  const winnerPaddle =
    game.gameState.paddleA.score >= game.gameState.paddleB.score
      ? PaddleName.PADDLE_A
      : PaddleName.PADDLE_B;
  if (winnerPaddle === game.players[0].paddle) {
    return game.players[0];
  } else if (winnerPaddle === game.players[1].paddle) {
    return game.players[1];
  }
  return null;
}

function getLoserPlayer(game: GameSession): Player | null {
  const loserPaddle =
    game.gameState.paddleA.score < game.gameState.paddleB.score
      ? PaddleName.PADDLE_A
      : PaddleName.PADDLE_B;
  if (loserPaddle === game.players[0].paddle) {
    return game.players[0];
  } else if (loserPaddle === game.players[1].paddle) {
    return game.players[1];
  }
  return null;
}

function getPlayerName(player: Player): string {
  let name = player.userAlias;
  if (name === undefined || name === null) {
    name = player.username;
  }
  return name;
}
