import { FastifyInstance, WSConnection } from 'fastify';
import WebSocket from 'ws';

export default function createWSService(app: FastifyInstance) {
  function sendToConnection(userId: number, message: Record<string, unknown>): void {
    const { connectionService } = app.connectionService;

    const conn = connectionService.get(userId) as WSConnection | null;
    if (!conn || conn.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      conn.send(JSON.stringify(message));
    } catch (err) {
      app.log.error(`[${userId}] Send failed:`, err);
      connectionService.removeConnection(conn);
    }
  }

  function sendToConnections(userIds: number[], message: Record<string, unknown>): void {
    userIds.forEach((id) => sendToConnection(id, message));
  }

  function broadcastToGame(gameId: string, message: Record<string, unknown>, excludeConnections: number[] = []): void {
    for (const conn of app.connectionService.getAllConnections()) {
      if (conn.gameId === gameId && !excludeConnections.includes(conn.userId)) {
        sendToConnection(conn.userId, message);
      }
    }
  }

  return {
    sendToConnection,
    sendToConnections,
    broadcastToGame
  }
}