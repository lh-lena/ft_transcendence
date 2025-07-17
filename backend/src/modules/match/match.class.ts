import { v4 as uuidv4 } from 'uuid';

import { 
  matchCreateInput,
  match,
  matchResponseArrayType,
} from '../../schemas/match';

export class matchMakingClass {

  private activeMatches: match[] = [];


  //check if two players are ready and match them ( can add matching logic later )
  private tryMultiMatch( req: matchCreateInput ): match {

    let match = this.activeMatches.find( m => 
        m.status === 'waiting' && m.visibility === 'public' );

    if( match ){

      req.matchId = match.matchId;
      match.players.push( req );
      match.status = 'playing';

    } else {
    
      const matchId = uuidv4();
      console.log( req );
      req.matchId = matchId;

      match = { 
        matchId: matchId,
        players: [ req ],
        visibility: req.visibility,
        mode: 'pvp_remote',
        status: 'waiting',
        createdAt: new Date().toISOString(),
      };

      this.activeMatches.push( match );
    }
    
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


  insert( req: matchCreateInput ): match {

    let match;

    match = this.activeMatches.find( m => 
      m.players.some( p => p.userId === req.userId ) 
    );

    if( match )
      return match;

    if( req.mode === 'pvp_remote' ){

        const match = this.tryMultiMatch( req );

        return match;

    } else {
      
      //Local or AI: create single playermatch
      const matchId = uuidv4();
      req.matchId = matchId;

      const match: match = {
        matchId: matchId,
        players: [ req ],
        mode: req.mode,
        status: 'playing',
        createdAt: new Date().toISOString(),
      };

      console.log( match );
      this.activeMatches.push( match );
      return match;
    }
  }

  patchmatch( matchId: string, update: Record< string, any > ): match | undefined {

   const match = this.findById( matchId );

   console.log( match ); 

   if( !match ){
     return undefined;
   }
   
  Object.assign( match, update ); 

  return match;
      
  }

  remove( matchId: string ): void {

    const index  = this.activeMatches.findIndex( m => m.matchId === matchId );

    if( index !== -1 )
      this.activeMatches.splice( index, 1 );
  }

  join( matchId: string, req: matchCreateInput ) : match | undefined {

    const match = this.findById( matchId );
    console.log( match );
    if( match === undefined )
      return undefined;

    console.log( match.players.length, "PLAYER" );
    if( match.players.length !== 1 )
      return undefined;

    match.players.push( req );
    match.status = 'playing';
    req.matchId = matchId;

    return match;
  }
}

