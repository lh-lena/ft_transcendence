/**
 * Game Lobby Routes
 *
 * Manages game lobbies and matchmaking:
 * - View game details
 * - Create new game lobbies
 * - Join existing games
 * - Delete/cancel games
 *
 * Game lifecycle:
 * 1. User creates game lobby with settings
 * 2. Other players join the lobby
 * 3. Game starts when lobby is full or host starts
 * 4. Results are recorded after completion
 *
 * @module routes/gameRoute
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { gameRoutesConfig } from '../../config/gameRouteConfig';

const gameRoutes = async (server: FastifyInstance) => {
  /**
   * GET /api/game/:gameId
   * Retrieves game lobby details
   *
   * Returns:
   * - Game settings (map, difficulty, mode)
   * - Current players
   * - Game status
   *
   * @param gameId - Unique game identifier
   * @returns Game object with full details
   * @returns 404 - Game not found
   */
  server.get('/game/:gameId', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, gameRoutesConfig.getGame, server);
  });

  server.get('/game/user/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, gameRoutesConfig.getGameByUser, server);
  });

  /**
   * POST /api/game
   * Creates a new game lobby
   *
   * @requires Authentication
   * @body userId - Must match authenticated user ID (host)
   * @body settings - Game configuration
   * @returns 201 - Game created successfully
   */
  server.post('/game', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, gameRoutesConfig.createGame, server);
  });

  /**
   * POST /api/game/join
   * Joins an existing game lobby
   *
   * Validation:
   * - Game must be in 'waiting' state
   * - Lobby must not be full
   * - User must not be already in game
   *
   * @requires Authentication
   * @body userId - Must match authenticated user ID
   * @body gameId - Game to join
   * @returns 200 - Successfully joined game
   * @returns 409 - Game full or already started
   */
  server.post('/game/join', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, gameRoutesConfig.joinGame, server);
  });

  /**
   * DELETE /api/game/:gameId
   * Deletes a game lobby
   *
   * Cannot delete games that have already started
   * All players are notified of cancellation
   *
   * @requires Authentication & Host
   * @param gameId - Game to delete
   * @returns 204 - Game deleted successfully
   * @returns 403 - Not the game host
   * @returns 409 - Game already started
   */
  server.delete('/game/:gameId', async (req: FastifyRequest, reply: FastifyReply) => {
    return server.routeHandler(req, reply, gameRoutesConfig.deleteGame, server);
  });
};

export default gameRoutes;
