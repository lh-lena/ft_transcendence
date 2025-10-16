/**
 * Chat/Messaging Routes
 *
 * Handles direct messaging between users:
 * - Chat overview (conversation list with last message, unread count)
 * - Message history between two users
 * - Send new messages
 *
 * All chat operations require authentication
 * Users can only access conversations they're part of
 *
 * @module routes/chatRoute
 */
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { chatRoutesConfig } from '../../config/chatRouteConfig';

const chatRoutes = async (server: FastifyInstance) => {
  /**
   * GET /api/chat/overview/:userId
   * Retrieves chat overview for a user
   *
   * Returns list of all conversations with:
   * - Other participant info
   * - Last message preview
   *
   * @requires Authentication
   * @param userId - Must match authenticated user ID
   * @returns Array of chat overview objects
   */
  server.get('/api/chat/overview/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, chatRoutesConfig.getOverview, server);
  });

  /**
   * GET /api/chat
   * Retrieves message history between two users
   *
   * @requires Authentication
   * @query senderId - One participant's user ID
   * @query receiverId - Other participant's user ID
   * @returns Array of chat messages
   */
  server.get('/api/chat', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, chatRoutesConfig.getChats, server);
  });

  /**
   * POST /api/chat
   * Sends a new message
   *
   * Validates:
   * - Sender is authenticated user
   * - Receiver exists and hasn't blocked sender
   * - Message content is not empty
   *
   * May trigger:
   * - Real-time notification via WebSocket
   *
   * @requires Authentication
   * @body senderId - Must match authenticated user ID
   * @body receiverId - Recipient user ID
   * @returns 201 - Message sent successfully
   * @returns 403 - User is blocked or doesn't exist
   */
  server.post('/api/chat', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, chatRoutesConfig.createChat, server);
  });
};

export default fp(chatRoutes, {
  name: 'chat-routes',
  dependencies: ['route-handler', 'auth-middleware'],
});
