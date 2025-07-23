import { v4 as uuidv4 } from 'uuid';

import { create } from '../gameHistory/gameHistory.service';
import { getById as userGetById } from '../user/user.service';
import { userType as user } from '../../schemas/user';

import { 
  gameCreateInput,
  game,
  gameResponseArrayType,
} from '../../schemas/game';

export class gameMakingClass {

  private activeMatches: game[] = [];

  //check if two players are ready and game them ( can add gameing logic later )
  private tryMultiMatch( req: gameCreateInput, user: user  ): game {

    let game = this.activeMatches.find( m => 
        m.status === 'waiting' && m.visibility === 'public' );

    if( game ){

      game.players.push( user );
      game.status = 'playing';

    } else {
    
      const gameId = uuidv4();
      console.log( req );

      game = { 
        gameId: gameId,
        players: [ user ],
        visibility: req.visibility,
        mode: 'pvp_remote',
        status: 'waiting',
        createdAt: new Date().toISOString(),
      };

      this.activeMatches.push( game );
    }
    
    return game;
  }

  findAll( ) {
    return( this.activeMatches as gameResponseArrayType );
  }

  findFiltered( query: Record<string, any> ) {
    return this.activeMatches.filter( item =>
      Object.entries( query ).every( ( [key, value] ) => item[key] === value));
  }

  findById( gameId: string ): game | undefined {

    const game = this.activeMatches.find(m => m.gameId === gameId );
    return game;
  }


  async insert( req: gameCreateInput ): game {

    let game;
    const user = await userGetById(  Number( req.userId ) );
    if( !user )
      throw new Error( 'User not found' );

    game = this.activeMatches.find( m => 
      m.players.some( p => p.id === user.id ) 
    );

    if( game )
      return game;

    if( req.mode === 'pvp_remote' ){

        const game = this.tryMultiMatch( req, user );

        return game;

    } else {
      
      //Local or AI: create single playergame
      const gameId = uuidv4();

      const game: game = {
        gameId: gameId,
        players: [ user ],
        mode: req.mode,
        status: 'playing',
        createdAt: new Date().toISOString(),
      };

      console.log( game );
      this.activeMatches.push( game );
      return game;
    }
  }

  patchgame( gameId: string, update: Record< string, any > ): game | undefined {

   const game = this.findById( gameId );

   console.log( game ); 

   if( !game ){
     return undefined;
   }
   
  Object.assign( game, update ); 

  return game;
      
  }

  remove( gameId: string ): void {

    const index  = this.activeMatches.findIndex( m => m.gameId === gameId );

    if( index !== -1 )
      this.activeMatches.splice( index, 1 );
  }

  async join( gameId: string, req: gameCreateInput ) : game | undefined {

    const game = this.findById( gameId );
    console.log( game );
    if( game === undefined )
      return undefined;

    const user = await userGetById(  Number( req.userId ) );
    if( !user )
      throw new Error( 'User not found' );

    if( game.players.length !== 1 )
      return undefined;

    game.players.push( user );
    game.status = 'playing';

    return game;
  }
}

