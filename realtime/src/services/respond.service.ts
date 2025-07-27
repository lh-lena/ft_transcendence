import { FastifyInstance, WSConnection } from 'fastify';
import { NotificationType } from '../types/game.types.js';
import { WsServerBroadcast } from '../schemas/ws.schema.js';
import { GameResult, GameState } from '../schemas/game.schema.js';

export default function createRespondService(app: FastifyInstance) {
  function send<T extends keyof WsServerBroadcast>(
    userId: number,
    event: T,
    payload: WsServerBroadcast[T],
  ): void {
    app.wsService.sendToConnection(userId, { event, payload });
  }

  function broadcast<T extends keyof WsServerBroadcast>(
    gameId: string,
    event: T,
    payload: WsServerBroadcast[T],
    excludeUsers: number[] = [],
  ): void {
    app.wsService.broadcastToGame(gameId, { event, payload }, excludeUsers);
  }
  function connected(userId: number): void {
    send(userId, 'connected', { userId });
  }

  function gameUpdate(userId: number, gameState: GameState): void {
    send(userId, 'game_update', { ...gameState });
  }

  function gameEnded(gameId: string, result: GameResult): void {
    broadcast(gameId, 'game_ended', result);
  }

  function gamePaused(gameId: string, reason: string): void {
    broadcast(gameId, 'game_pause', { gameId, reason });
  }

  function countdownUpdate(
    gameId: string,
    countdown: number,
    message: string,
  ): void {
    broadcast(gameId, 'countdown_update', { gameId, countdown, message });
  }

  function error(userId: number, message: string): void {
    send(userId, 'error', { message });
  }

  function notification(
    userId: number,
    type: NotificationType,
    message: string,
  ): void {
    send(userId, 'notification', { type, message, timestamp: Date.now() });
  }

  function notificationToGame(
    gameId: string,
    type: NotificationType,
    message: string,
    excludeUsers: number[] = [],
  ): void {
    broadcast(
      gameId,
      'notification',
      { type, message, timestamp: Date.now() },
      excludeUsers,
    );
  }

  return {
    connected,
    gameUpdate,
    gameEnded,
    gamePaused,
    countdownUpdate,
    notification,
    notificationToGame,
    error,
  };
}
