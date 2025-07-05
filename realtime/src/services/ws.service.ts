import { FastifyInstance, WSConnection } from 'fastify';
import { GameInstance } from 'types/pong.types';
import WebSocket from 'ws';

export default function createWSService(app: FastifyInstance) {
  function sendToConnection(userId: number, message: Record<string, unknown>): void {
    const conn = app.connectionService.getConnection(userId) as WSConnection | null;
    if (!conn || conn.readyState !== WebSocket.OPEN) {
      app.log.debug(`[ws-service] Cannot send to user ${userId} - connection not found`);
      return;
    }

    try {
      const messageStr = JSON.stringify(message);
      conn.send(messageStr);
      app.log.debug(`[ws-service] Sent to user ${userId}: ${message.event}`);
    } catch (error) {
      app.log.error(`[ws-service] Failed to send to user ${userId}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      app.connectionService.removeConnection(conn);
    }
  }

  function sendToConnections(userIds: number[], message: Record<string, unknown>): void {
    userIds.forEach((id) => sendToConnection(id, message));
  }

  function broadcastToGame(gameId: string, message: Record<string, unknown>, excludeConnections: number[] = []): void {
    const game = app.gameSessionService.getGameSession(gameId) as GameInstance;
    if (!game) {
      app.log.warn(`[ws-service] Cannot broadcast to game ${gameId} - game not found`);
      return;
    }

    const userIds = game.players
      .map(p => p.userId)
      .filter(id => id !== -1 && !excludeConnections.includes(id));

    app.log.debug(`[ws-service] Broadcasting '${message.event}' to game ${gameId} (${userIds.length} recipients, excluding: [${excludeConnections.join(', ')}])`);
    sendToConnections(userIds, message);
  }

  return {
    sendToConnection,
    sendToConnections,
    broadcastToGame
  }
}