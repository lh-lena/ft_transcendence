import { FastifyInstance, WSConnection } from 'fastify';
import { GameInstance } from '../types/game.types';
import { User } from '../schemas/user.schema';
import WebSocket from 'ws';
import { GameSession } from '../schemas/game.schema.js';

export default function createWSService(app: FastifyInstance) {
  function sendToConnection(userId: number, message: Record<string, unknown>): void {
    const conn = app.connectionService.getConnection(userId) as WSConnection | null;
    if (!conn || conn.readyState !== WebSocket.OPEN) {
      app.log.error(`[ws-service] Cannot send to user ${userId} - connection not found`);
      return;
    }

    try {
      const messageStr = JSON.stringify(message);
      conn.send(messageStr);
    } catch (error) {
      app.log.error(`[ws-service] Failed to send to user ${userId}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      app.connectionService.removeConnection(conn);
    }
  }

  function broadcastToGame(gameId: string, message: Record<string, unknown>, excludeConnections: number[] = []): void {
  const game = app.gameSessionService.getGameSession(gameId) as GameSession;
  if (!game) {
    app.log.warn(`[ws-service] Cannot broadcast to game ${gameId} - game not found`);
    return;
  }

  const { players } = game;
  const userIds = players
    .map(p => p.userId)
    .filter(id => id !== -1 && game.isConnected.get(id) && !excludeConnections.includes(id));

  userIds.forEach((id) => sendToConnection(id, message));
  }

  return {
    sendToConnection,
    broadcastToGame
  }
}