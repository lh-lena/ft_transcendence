import { gameMakingClass } from './game.class';
import { game } from '../../schemas/game';

import { NotFoundError } from '../../utils/error';

const gamemaker = new gameMakingClass();

export async function getAllorFilteredgame(filters?: Partial<game>) {
  let game;

  if (!filters) {
    game = gamemaker.findAll();
  } else {
    game = gamemaker.findFiltered(filters);
  }
  if (!game || game.length === 0) {
    throw new NotFoundError('No games found');
  }
  return game;
}

export async function getgameById(id: gameIdInput) {
  const game = gamemaker.findById(id);
  if (!game) throw new NotFoundError(`game with ${id} not found`);

  return game;
}

export async function creategame(data: gameCreateInput) {
  const ret = await gamemaker.insert(data);

  return ret;
}

export async function updategame(id: gameIdInput, data: gameUpdateInput) {
  const game = gamemaker.patchgame(id, data);

  if (!game) throw new NotFoundError(`game with ${id} not found`);

  return game;
}

export async function deleteOnegame(id: gameIdInput) {
  await getgameById(id);

  gamemaker.deleteOne(id);
  return { message: `game ${id} deleted successfulyy` };
}

export async function joingame(id: gameIdInput, input: gameCreateInput) {
  await getgameById(id);

  const game = await gamemaker.join(id, input);
  if (!game) throw new NotFoundError(`game with ${id} not found`);
  return game;
}
