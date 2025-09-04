import { v4 as uuid } from 'uuid';

import type { gameType, gameCreateType } from '../../schemas/game';
import { userService } from '../user/user.service';

import { notifyPlayer } from '../../utils/notify';

export class gameClass {
  private activeGames: gameType[] = [];

  async getById(gameId: string): Promise<gameType | undefined> {
    const game = this.activeGames.find((g) => g.gameId === gameId);
    return game;
  }

  async getByUser(userId: number): Promise<gameType | undefined> {
    const game = this.activeGames.find((g) => g.players.some((p) => p.id === userId));
    return game;
  }

  async create(game: gameCreateType): Promise<gameType> {
    const newGame: gameType = {
      gameId: uuid(),
      players: [],
      mode: game.mode,
      status: 'waiting',
      visibility: game.visibility,
      aiDifficulty: game.aiDifficulty || 'easy',
    };

    this.activeGames.push(newGame);
    return newGame;
  }

  async remove(gameId: string): Promise<void> {
    this.activeGames = this.activeGames.filter((g) => g.gameId !== gameId);
  }

  async join(game: gameType, playerId: number): Promise<gameType> {
    game.players.push(await userService.getInfoById(playerId));
    this.startGame(game);
    return game;
  }

  async findAvailableGame(playerId: number): Promise<gameType> {
    let freeGame = this.activeGames.find(
      (g) => g.players.length < 2 && g.visibility === 'public' && g.status === 'waiting',
    );

    if (!freeGame) {
      freeGame = await this.create({ mode: 'pvp_remote', visibility: 'public' });
    }

    this.join(freeGame, playerId);
    this.startGame(freeGame);

    return freeGame;
  }

  private async startGame(game: gameType): Promise<void> {
    if (
      (game.players.length === 2 && game.mode === 'pvp_remote') ||
      (game.players.length === 1 && game.mode === 'pvb_ai')
    ) {
      game.status = 'ready';
      game.createdAt = new Date().toISOString();
      for (const player of game.players) {
        notifyPlayer(player.id, -1, 'INFO: Your next Game starts soon');
      }
    }
  }
}
