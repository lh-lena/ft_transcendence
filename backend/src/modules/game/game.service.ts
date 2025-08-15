import { gameMakingClass } from './game.class';
import { NotFoundError } from '../../utils/error';

import { transformQuery } from '../../utils/crudQueryBuilder';

import type {
  gameCreateType,
  gameQueryType,
  gameIdType,
  gameResponseType,
  gameResponseArrayType,
} from '../../schemas/game';

const gamemaker = new gameMakingClass();

export async function getQuery(
  filters?: gameQueryType,
): Promise<gameResponseArrayType> {
  let game = [];

  if (!filters) {
    game = await gamemaker.findAll();
  } else {
    const query = transformQuery(filters);
    game = await gamemaker.findFiltered(query);
  }
  if (!game || game.length === 0) {
    throw new NotFoundError('No games found');
  }
  return game;
}

export async function getgameById(id: gameIdType): Promise<gameResponseType> {
  const game = await gamemaker.findById(id);
  if (!game) throw new NotFoundError(`game with ${id} not found`);

  return game;
}

export async function creategame(
  data: gameCreateType,
): Promise<gameResponseType> {
  const ret = await gamemaker.insert(data);

  return ret;
}

export async function joingame(
  id: gameIdType,
  input: gameCreateType,
): Promise<gameResponseType> {
  await getgameById(id);

  const game = await gamemaker.join(id, input);
  if (!game) throw new NotFoundError(`game with ${id} not found`);
  return game;
}
