import { GameSessionStatus } from '../../constants/game.constants';
import { GameSessionService } from '../types/game.types';
import { GameIdType, GameSession, GameState, Player } from '../../schemas/game.schema';
import { RespondService } from '../../websocket/types/ws.types';

export function updateGameStatus(
  gameSessionService: GameSessionService,
  gameId: GameIdType,
  status: GameSessionStatus,
  additionalFields?: Partial<GameSession>,
): void {
  gameSessionService.updateGameSession(gameId, {
    status,
    ...additionalFields,
  });
}

export function broadcastGameUpdate(
  respond: RespondService,
  players: Player[],
  gameState: GameState,
): void {
  const { gameUpdate } = respond;
  players.forEach((player) => {
    if (!player.isAI) {
      gameUpdate(player.userId, {
        ...gameState,
        activePaddle: player.paddle!,
      });
    }
  });
}
