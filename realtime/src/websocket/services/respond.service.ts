import { WebSocket } from 'ws';
import type { FastifyInstance, WSConnection } from 'fastify';
import type { WsServerBroadcast } from '../../schemas/ws.schema.js';
import type { GameResult, GameState, GameSession, GameIdType } from '../../schemas/game.schema.js';
import type { UserIdType, UserIdObject } from '../../schemas/user.schema.js';
import type { NotificationType } from '../../constants/game.constants.js';
import { GAME_EVENTS } from '../../constants/game.constants.js';
import { CHAT_EVENTS } from '../../constants/chat.constants.js';
import { processErrorLog } from '../../utils/error.handler.js';
import type { RespondService, ConnectionService } from '../types/ws.types.js';
import type { GameSessionService } from '../../game/types/game.types.js';
import type { ChatMessageBroadcast } from '../../schemas/chat.schema.js';

export default function createRespondService(app: FastifyInstance): RespondService {
  const { log } = app;

  function send<T extends keyof WsServerBroadcast>(
    userId: UserIdType,
    event: T,
    payload: WsServerBroadcast[T],
  ): boolean {
    const connectionService = app.connectionService as ConnectionService;
    const conn = connectionService.getConnection(userId) as WSConnection | null;
    if (!conn || conn.readyState !== WebSocket.OPEN) {
      log.error(
        `[ws-service] Cannot send to user ID ${userId} event ${event} payload ${JSON.stringify(payload)} - connection not found`,
      );
      return false;
    }
    const message = { event, payload };
    try {
      const messageStr = JSON.stringify(message);
      conn.send(messageStr);
      return true;
    } catch (error: unknown) {
      processErrorLog(app, 'ws-service', `Failed to send to user ${userId}`, error);
      connectionService.removeConnection(conn);
      return false;
    }
  }

  function broadcast<T extends keyof WsServerBroadcast>(
    gameId: GameIdType,
    event: T,
    payload: WsServerBroadcast[T],
    excludeUsers: UserIdType[] = [],
  ): boolean {
    const gameSessionService = app.gameSessionService as GameSessionService;
    const game = gameSessionService.getGameSession(gameId) as GameSession;
    if (game === undefined || game === null) {
      log.warn(`[ws-service] Cannot broadcast to game ${gameId} - game not found`);
      return false;
    }

    const { players } = game;
    const userIds: UserIdType[] = [];
    players.forEach((p) => {
      if (
        p.isAI !== true &&
        game.isConnected.get(p.userId) === true &&
        !excludeUsers.includes(p.userId)
      ) {
        userIds.push(p.userId);
      }
    });

    const results: boolean[] = [];
    userIds.forEach((id) => {
      const res = send(id, event, payload);
      results.push(res);
    });
    return results.every((r) => r === true);
  }

  function connected(userId: UserIdType): boolean {
    return send(userId, 'connected', { userId });
  }

  function gameReady(gameId: GameIdType): boolean {
    return broadcast(gameId, GAME_EVENTS.GAME_READY, { gameId, timestamp: Date.now() });
  }

  function gameStarted(gameId: GameIdType, players: UserIdObject[]): boolean {
    return broadcast(gameId, GAME_EVENTS.START, { gameId, players });
  }

  function gameUpdate(userId: UserIdType, gameState: GameState): boolean {
    return send(userId, GAME_EVENTS.UPDATE, { ...gameState });
  }

  function gameEnded(gameId: GameIdType, result: GameResult): boolean {
    return broadcast(gameId, GAME_EVENTS.FINISHED, result);
  }

  function gamePaused(gameId: GameIdType, reason: string): boolean {
    return broadcast(gameId, GAME_EVENTS.PAUSE, { gameId, reason });
  }

  function chatMessage(userId: UserIdType, payload: ChatMessageBroadcast): boolean {
    return send(userId, CHAT_EVENTS.MESSAGE, {
      ...payload,
    });
  }

  function countdownUpdate(gameId: GameIdType, countdown: number, message: string): boolean {
    return broadcast(gameId, GAME_EVENTS.COUNTDOWN_UPDATE, { gameId, countdown, message });
  }

  function error(userId: UserIdType, message: string): boolean {
    return send(userId, 'error', { message });
  }

  function notification(userId: UserIdType, type: NotificationType, message: string): boolean {
    return send(userId, 'notification', { type, message, timestamp: Date.now() });
  }

  function notificationToGame(
    gameId: GameIdType,
    type: NotificationType,
    message: string,
    excludeUsers: UserIdType[] = [],
  ): boolean {
    return broadcast(
      gameId,
      'notification',
      { type, message, timestamp: Date.now() },
      excludeUsers,
    );
  }

  return {
    connected,
    gameReady,
    gameStarted,
    gameUpdate,
    gameEnded,
    gamePaused,
    chatMessage,
    countdownUpdate,
    notification,
    notificationToGame,
    error,
  };
}
