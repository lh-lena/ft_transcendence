import { v4 as uuid } from 'uuid';

import type { gameType, gameCreateType } from '../../schemas/game';

//import { notifyPlayer } from '../../utils/notify';

export class gameClass {
  private activeGames: gameType[] = [];

  async getById(gameId: string): Promise<gameType | undefined> {
    const game = this.activeGames.find((g) => g.gameId === gameId);
    return game;
  }

  async getByUser(userId: string): Promise<gameType | undefined> {
    const game = this.activeGames.find((g) => g.players.some((p) => p.userId === userId));
    return game;
  }

  async create(game: gameCreateType): Promise<gameType> {
    const existingGame = await this.getByUser(game.userId);
    if (existingGame) {
      return existingGame;
    }
    const newGame: gameType = {
      gameId: uuid(),
      players: [],
      mode: game.mode,
      status: 'waiting',
      visibility: game.visibility,
      aiDifficulty: game.aiDifficulty || 'easy',
    };

    if (game.userId) {
      newGame.players.push({ userId: game.userId });
    }

    this.activeGames.push(newGame);
    this.startGame(newGame);
    return newGame;
  }

  async remove(gameId: string): Promise<void> {
    this.activeGames = this.activeGames.filter((g) => g.gameId !== gameId);
  }

  async join(game: gameType, userId: string): Promise<gameType> {
    game.players.push({ userId: userId });
    this.startGame(game);
    return game;
  }

  async findAvailableGame(userId: string): Promise<gameType> {
    const existingGame = await this.getByUser(userId);

    if (existingGame) {
      return existingGame;
    }

    let freeGame = this.activeGames.find(
      (g) => g.players.length < 2 && g.visibility === 'public' && g.status === 'waiting',
    );

    if (!freeGame) {
      freeGame = await this.create({
        mode: 'pvp_remote',
        visibility: 'public',
        userId: userId,
      });
    } else {
      await this.join(freeGame, userId);
    }

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
      //TODO enable notification about new game
      for (const player of game.players) {
        //notifyPlayer(player.userId, 'INFO: Your next Game starts soon');
      }
    }
  }
}
