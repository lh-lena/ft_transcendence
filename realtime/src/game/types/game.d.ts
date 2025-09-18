import type { GameSession, StartGame, GameResult } from '../../schemas/game.schema.js';
import type { ClientEventPayload } from '../../schemas/ws.schema.js';
import type { GameSessionStatus } from '../../constants/game.constants.js';
import type { PausedGameState } from '../../websocket/types/network.types.js';
import type { User } from '../../schemas/user.schema.js';

export interface GameService {
  handleStartGame: (user: User, gameId: string) => Promise<void>;
  handlePlayerInput: (user: User, payload: ClientEventPayload<'game_update'>) => void;
  handleGameLeave: (user: User, gameId: string) => Promise<void>;
  handleGamePause: (user: User, gameId: string) => void;
  handleGameResume: (user: User, gameId: string) => void;
}

export interface GameStateService {
  startGame: (game: GameSession) => void;
  pauseGame: (game: GameSession, pausedByPlayerId: number) => boolean;
  resumeGame: (game: GameSession, resumeByPlayerId?: number) => void;
  endGame: (
    game: GameSession,
    status:
      | GameSessionStatus.CANCELLED
      | GameSessionStatus.FINISHED
      | GameSessionStatus.CANCELLED_SERVER_ERROR,
    leftPlayerId?: number,
  ) => Promise<void>;
}

export interface GameSessionService {
  createGameSession: (gameId: string, gameData: StartGame) => GameSession | null;
  getGameSession: (gameId: string) => GameSession | undefined;
  storeGameSession: (game: GameSession) => void;
  updateGameSession: (gameId: string, updates: Partial<GameSession>) => boolean;
  removeGameSession: (gameId: string) => void;
  setPlayerConnectionStatus: (userId: number, gameId: string, connected: boolean) => void;
  shutdown: () => Promise<void>;
}

export interface GameDataService {
  fetchGameData: (gameId: string) => Promise<StartGame>;
  sendGameResult: (result: GameResult) => Promise<boolean>;
}

export interface GameValidator {
  validateResumingGame: (
    pausedState: PausedGameState,
    game: GameSession,
    resumeByPlayerId?: number,
  ) => void;
  validateGameStatus: (status: GameSessionStatus, validStatuses: GameSessionStatus[]) => void;
  getValidGameCheckPlayer: (gameId: string, userId: number) => GameSession;
  isExpectedPlayer: (players: User[], userId: number) => boolean;
  isPlayersConnected: (game: GameSession) => boolean;
  gameReadyToStart: (game: GameSession) => boolean;
}
