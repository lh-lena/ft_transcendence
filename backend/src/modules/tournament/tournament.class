import type {
  tournamentType,
  tournamentCreateType,
  tournamentResponseType,
} from '../../schemas/tournament';

export class tournamentClass {

  private activeTournaments: tournament[] = [];

  private async matchPlayerToTournament(

    async join(data: tournamentCreateType): Promise<tournamentResponseType> {
      const user = await userController.getById(data.userId);
      if (!user) throw newNotFoundError('User not found');

      const tournament = this.activeTournaments.find((t) => t.players.some(p) => p.id === user.id));

      if (tournament) return tournament;


