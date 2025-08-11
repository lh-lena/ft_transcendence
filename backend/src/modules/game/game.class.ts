import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod/v4';

import { getById as userGetById } from '../user/user.service';
import { userBase } from '../../schemas/user';

import { NotFoundError } from '../../utils/error';

type user = z.infer<typeof userBase>;

import {
  game,
  gameIdInput,
  gameCreateInput,
  gameQueryInput,
  gameResponseType,
  gameResponseArrayType,
} from '../../schemas/game';

export class gameMakingClass {
  private activeMatches: game[] = [];

  //check if two players are ready and game them ( can add gameing logic later )
  private async tryMultiMatch(
    req: gameCreateInput,
    user: user,
  ): Promise<gameResponseType> {
    let game = this.activeMatches.find(
      (m) => m.status === 'waiting' && m.visibility === 'public',
    );

    if (game) {
      game.players.push(user);
      game.status = 'playing';
    } else {
      const gameId = uuidv4();
      console.log(req);

      game = {
        gameId: gameId,
        players: [user],
        visibility: req.visibility,
        mode: 'pvp_remote',
        status: 'waiting',
        createdAt: new Date().toISOString(),
      };

      this.activeMatches.push(game);
    }

    return game;
  }

  async findAll() {
    return this.activeMatches as gameResponseArrayType;
  }

  async findFiltered(query: gameQueryInput): Promise<gameResponseArrayType> {
    return this.activeMatches.filter((item) =>
      Object.entries(query).every(
        ([key, value]) => item[key as keyof game] === value,
      ),
    );
  }

  async findById(gameId: gameIdInput): Promise<gameResponseType> {
    const game = this.activeMatches.find((m) => m.gameId === gameId.id);
    if (!game) throw new NotFoundError(`game with ${gameId} not found`);
    return game;
  }

  async insert(req: gameCreateInput): Promise<gameResponseType> {
    const user = await userGetById({ id: req.userId });
    if (!user) throw new Error('User not found');

    const game = this.activeMatches.find((m) =>
      m.players.some((p) => p.id === user.id),
    );

    if (game) return game;

    if (req.mode === 'pvp_remote') {
      const game = this.tryMultiMatch(req, user);

      return game;
    } else {
      //Local or AI: create single playergame
      const gameId = uuidv4();

      const game: game = {
        gameId: gameId,
        players: [user],
        mode: req.mode,
        status: 'playing',
        visibility: 'private',
        createdAt: new Date().toISOString(),
      };

      console.log(game);
      this.activeMatches.push(game);
      return game;
    }
  }

  async join(
    gameId: gameIdInput,
    req: gameCreateInput,
  ): Promise<gameResponseType> {
    const game = await this.findById(gameId);
    if (!game) throw new NotFoundError(`game ${gameId.id} not found`);

    const user = await userGetById({ id: req.userId });
    if (!user) throw new NotFoundError('User ${req.userId} not found');

    if (game.players.length !== 1)
      throw new Error(`game ${gameId.id} is already full`);

    game.players.push(user);
    game.status = 'playing';

    return game;
  }
}
