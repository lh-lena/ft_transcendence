import { serverContext } from '../../context';
import { matchMakingClass } from './match.class';

const matchmaker = new matchMakingClass();

export const registerMatch = (context, input) => {
  return matchmaker.registerMatch(input);
};

export const updateStatus = (context, id, input) => {
  return matchmaker.updateStatus(id.userId, input.status);
};

export const getMatchById = (context, id) => {
  return matchmaker.getMatchById(id.matchId);
};

export const getAllorFilteredmatch = (context, query) => {
  return matchmaker.getAllorFilteredMatch(query?.matchId || '');
};

export const removematch = (context, id) => {
  return matchmaker.removeMatch(id.matchId);
};

