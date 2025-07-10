import { v4 as uuidv4 } from 'uuid';

import { 
  matchRequest,
  match,
} from '../../schemas/match';

export class matchMakingClass {

  private multiQueue: matchRequest[] = [];
  private activeMatches: Map< string, Match > = new Map();

  registerMatch( req: matchRequest ): Match {

    console.log( req );
    if( req.mode === 'pvp_remote' ){
      if( req.visibility === 'public' ){

        //public pvp game: add user to queue
        this.multiQueue.push( req );
        return this.tryMultiMatch();

      } else {

        //private pvp game: create 
        const matchId = uuidv4();
        const match: Match = {
          matchId: matchId,
          players: [ req ],
          mode: req.mode,
          visibility: 'private',
          status: 'waiting',
          createdAt: new Date().toISOString(),
        };

        this.activeMatches.set( matchId, match );
        return match;
      }
    } else {
      
      //Local or AI: create single playermatch
      const matchId = uuidv4();
      const match: Match = {
        matchId: matchId,
        players: [ req ],
        mode: req.mode,
        visibility: 'private',
        status: 'waiting',
        createdAt: new Date().toISOString(),
      };

      this.activeMatches.set( matchId, match );
      return match;
    }
  }

  //check if two players are ready and match them ( can add matching logic later )
  private tryMultiMatch(): Match {

    if( this.multiQueue.length >= 2 ) {

      const players = this.multiQueue.splice( 0, 2 );
      const matchId = uuidv4();
      const match: Match = {
        matchId: matchId,
        players: players,
        mode: 'pvp_remote',
        visibility: 'public',
        status: 'waiting',
        createdAt: new Date().toISOString(),
      };

      this.activeMatches.set( matchId, match );
      return match;
    }

    //if not enough players, return a pending match with the last player in queue
    const lastPlayer = this.multiQueue[ this.multiQueue.length - 1 ];
    return {
      matchId: 'pending',
      players: [ lastPlayer ],
      mode: 'pvp_remote',
      status: 'waiting',
      visibility: 'public',
      createdAt: new Date().toISOString(),
    };
  }

  //join match via uuid
  joinPrivateMatch( matchId: string, req: matchRequest ): Match | undefined {

    const match = this.activeMatches.get( matchId );

    if( !match || match.status != 'waiting' || match.players.length != 1 ) {
      return undefined;
    }
    
    if( match.players.some( p => p.userId === req.userId ) ) {
      return match;
    }

    match.players.push( req );
    return match;

  }

  //set user ready and update game if all are ready
  updateStatus( userId: number, status: string ): Match | undefined {

      const matchId = this.getMatchIdByUserId( userId );
      if( !matchId ) {
        return undefined;
      }
      
      const match = this.getMatchById( matchId );
      if( !match ){
        return undefined;
      }

      const player = match.players.find( p => p.userId === userId );
      if( player ) {
        player.ready = 'true';
      }
      if( match.players.every( p => p.ready === 'true' ) ){
        match.status = 'ready';
      }

      return match;
  }


  //get match id by userid
  getMatchIdByUserId( userId: number ): string | undefined {
    for( const match of this.activeMatches.values() ) {
      if( match.players.some( p => p.userId === userId ) ) {
        return match.matchId;
      }
    }
    return undefined;
  }

  getAllorFilteredMatch( query: string ){
    if( !query )
      return( this.activeMatches );
    return this.activeMatches.get( query );
  }

  getMatchById( matchId: string ): Match | undefined {
    return this.activeMatches.get( matchId );
  }

  removeMatch( matchId: string ): void {
    this.activeMatches.delete( matchId );
  }

}
