import { v4 as uuidv4 } from 'uuid';
import type { tournamentType, tournamentCreateType } from '../../schemas/tournament';

import { gameService } from '../game/game.service';
import { notifyPlayer } from '../../utils/realtime';

import type { tournamentIdType } from '../../schemas/tournament';

export class tournamentClass {
  private activeTournaments: tournamentType[] = [];

  async getById(id: tournamentIdType): Promise<tournamentType | undefined> {
    const tournament = this.activeTournaments.find((t) => t.tournamentId === id.tournamentId);
    return tournament;
  }

  async getByUser(userId: string): Promise<tournamentType | undefined> {
    const tournament = this.activeTournaments.find((t) =>
      t.players.some((p) => p.userId === userId),
    );

    return tournament;
  }

  async create(playerAmount: number): Promise<tournamentType> {
    const newTournament: tournamentType = {
      tournamentId: uuidv4(),
      round: 1,
      playerAmount: playerAmount,
      players: [],
      status: 'waiting',
      games: [],
    };

    this.activeTournaments.push(newTournament);
    return newTournament;
  }

  async remove(tournamentId: tournamentIdType): Promise<void> {
    this.activeTournaments = this.activeTournaments.filter(
      (t) => t.tournamentId !== tournamentId.tournamentId,
    );
  }

  async join(tournament: tournamentType, playerId: string): Promise<tournamentType> {
    tournament.players.push({ userId: playerId });
    for (const player of tournament.players) {
      console.log('Notifying player:', player.userId, 'about new player:', playerId);
      notifyPlayer(player.userId, `INFO: New Player joined the tournament`, playerId);
    }
    return tournament;
  }

  async leave(userId: string): Promise<boolean> {
    const tournament = await this.getByUser(userId);
    if (tournament) {
      tournament.players = tournament.players.filter((p) => p.userId !== userId);
      return true;
    }
    return false;
  }

  async findAvailableTournament(join: tournamentCreateType): Promise<tournamentType> {
    let freeTournament = this.activeTournaments.find(
      (t) =>
        t.playerAmount === join.playerAmount &&
        t.players.length < t.playerAmount &&
        t.status === 'waiting',
    );

    if (!freeTournament) {
      freeTournament = await this.create(join.playerAmount);
    }

    this.join(freeTournament, join.userId);
    this.startTournament(freeTournament);
    return freeTournament;
  }

  private async createGames(tournament: tournamentType): Promise<void> {
    for (let i = 0; i < tournament.playerAmount; i += 2) {
      const game = await gameService.createTournamentGame(
        tournament.players[i].userId,
        tournament.players[i + 1].userId,
      );
      tournament.games.push(game);
    }
  }

  private async startTournament(tournament: tournamentType): Promise<void> {
    if (tournament.players.length === tournament.playerAmount && tournament.status === 'waiting') {
      tournament.status = 'ready';
      for (const player of tournament.players) {
        notifyPlayer(player.userId, 'INFO: Tournament starts soon');
      }
      await this.createGames(tournament);
    }
  }

  async update(gameId: string, loserId: string): Promise<void> {
    const tournament = this.activeTournaments.find((t) => t.games.some((g) => g.gameId === gameId));

    if (!tournament) return undefined;

    tournament.games = tournament.games.filter((g) => g.gameId !== gameId);
    tournament.players = tournament.players.filter((p) => p.userId !== loserId);

    if (tournament.players.length === 1) {
      notifyPlayer(tournament.players[0].userId, 'INFO: You won the tournament!');
      this.remove(tournament);
    } else if (tournament.games.length === 0) {
      tournament.round += 1;
      await this.createGames(tournament);
    }
  }
}
