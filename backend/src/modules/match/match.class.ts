import { v4 as uuidv4 } from 'uuid';

import { 
  matchRequest,
  match,
  matchResponseArrayType,
} from '../../schemas/match';

export class matchMakingClass {

  private multiQueue: matchRequest[] = [];
  private activeMatches: match[] = [];


  //check if two players are ready and match them ( can add matching logic later )
  private tryMultiMatch(): match {

    console.log( 'tryMultiMatch', this.multiQueue );
    if( this.multiQueue.length >= 2 ) {

      const players = this.multiQueue.splice( 0, 2 );
      const matchId = uuidv4();
      const match: match = {
        matchId: matchId,
        players: players,
        mode: 'pvp_remote',
        visibility: 'public',
        status: 'waiting',
        createdAt: new Date().toISOString(),
      };

      console.log( 'match created', match );
      this.activeMatches.push( match );
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
  joinPrivateMatch( matchId: string, req: matchRequest ): match | undefined {

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

  findAll( ) {
    return( this.activeMatches as matchResponseArrayType );
  }

  findFiltered( query: Record<string, any> ) {
    return this.activeMatches.filter( item =>
      Object.entries( query ).every( ( [key, value] ) => item[key] === value));
  }

  findById( matchId: string ): match | undefined {

    const match = this.activeMatches.find(m => m.matchId === matchId );
    return match;
  }


  insert( req: matchRequest ): match {

    if( req.mode === 'pvp_remote' ){
      if( req.visibility === 'public' ){

        //public pvp game: add user to queue
        this.multiQueue.push( req );
        return this.tryMultiMatch();

      } else {

        //private pvp game: create 
        const matchId = uuidv4();
        const match: match = {
          matchId: matchId,
          players: [ req ],
          mode: req.mode,
          visibility: 'private',
          status: 'waiting',
          createdAt: new Date().toISOString(),
        };

        this.activeMatches.push(  match );
        console.log( this.activeMatches );
        return match;
      }
    } else {
      
      //Local or AI: create single playermatch
      const matchId = uuidv4();
      const match: match = {
        matchId: matchId,
        players: [ req ],
        mode: req.mode,
        visibility: 'private',
        status: 'waiting',
        createdAt: new Date().toISOString(),
      };

      console.log( 'registerMatch', match );
      this.activeMatches.push( match );
      return match;
    }
  }

  patchMatch( matchId: string, update: Record< string, any > ): match | undefined {

   const match = this.findById( matchId );

   console.log( match ); 

   if( !match ){
     return undefined;
   }
   
  Object.assign( match, update ); 

  return match;
      
  }

  patchUser( userId: number, update: Record< string, any > ): match | undefined {


  }

  remove( matchId: string ): void {

    const index  = this.activeMatches.findIndex( m => m.matchId === matchId );

    if( index !== -1 )
      this.activeMatches.splice( index, 1 );
  }

  setReady( userId: number ) : match {

    let match;

    this.activeMatches.forEach(match => {
      match.players.forEach(player => {
        if( player.userId == userId ){
          match = match;
        }
      });
    });   

    console.log( match );
    //const match = this.activeMatches.find( m => m.players.some( p => p.userId === userId ) );

    const player = match?.players.find( p => p.userId === userId );

    console.log( player );
    if( !match || !player ){
      return undefined;
    }

    Object.assign( player, update ); 

    if( match.players.every( p => p.status === 'ready' ) ){
      match.status = 'ready';
    }

    return match;
  }
}
