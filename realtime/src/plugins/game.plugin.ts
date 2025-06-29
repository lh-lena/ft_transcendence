import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyInstance, WSConnection } from 'fastify';
import { createGameService } from '../services/game.service.js';

const plugin: FastifyPluginAsync = async (app: FastifyInstance) => {
    const gameService = createGameService(app);
    app.decorate('gameService', gameService);
}

export const gamePlugin = fp(plugin, {
    name: 'game-plugin',
    dependencies: ['websocket-plugin']
});
