import type {
  GameSession,
  StartGame,
  GameResult,
  GameIdType,
  Player,
} from '../../schemas/game.schema.js';
import type { ClientEventPayload } from '../../schemas/ws.schema.js';
import type { GameSessionStatus } from '../../constants/game.constants.js';
import type { PausedGameState } from '../../websocket/types/network.types.js';
import type { User, UserIdType } from '../../schemas/user.schema.js';

export interface GameService {
  handleStartGame: (user: User, gameId: GameIdType) => Promise<void>;
  handlePlayerInput: (user: User, payload: ClientEventPayload<'game_update'>) => void;
  handleGameLeave: (user: User, gameId: GameIdType) => Promise<void>;
  handleGamePause: (user: User, gameId: GameIdType) => void;
  handleGameResume: (user: User, gameId: GameIdType) => void;
}

export interface GameStateService {
  startGame: (game: GameSession) => void;
  pauseGame: (game: GameSession, pausedByPlayerId: UserIdType) => boolean;
  resumeGame: (game: GameSession, resumeByPlayerId?: UserIdType) => void;
  endGame: (
    game: GameSession,
    status:
      | GameSessionStatus.CANCELLED
      | GameSessionStatus.FINISHED
      | GameSessionStatus.CANCELLED_SERVER_ERROR,
    leftPlayerId?: UserIdType,
  ) => Promise<void>;
}

export interface GameSessionService {
  createGameSession: (gameId: GameIdType, gameData: StartGame) => GameSession | null;
  getGameSession: (gameId: GameIdType) => GameSession | undefined;
  storeGameSession: (game: GameSession) => void;
  updateGameSession: (gameId: GameIdType, updates: Partial<GameSession>) => boolean;
  removeGameSession: (gameId: GameIdType) => void;
  setPlayerConnectionStatus: (userId: UserIdType, gameId: GameIdType, connected: boolean) => void;
  shutdown: () => Promise<void>;
}

export interface GameDataService {
  fetchGameData: (gameId: GameIdType) => Promise<StartGame>;
  sendGameResult: (result: GameResult) => Promise<boolean>;
}

export interface GameLoopService {
  startGameLoop: (game: GameSession) => void;
  stopGameLoop: (game: GameSession) => void;
  startCountdownSequence: (game: GameSession, infoMsg: string, count?: number) => void;
  stopCountdownSequence: (game: GameSession) => void;
  startAIGame: (game: GameSession) => void;
  stopAIGame: (game: GameSession) => void;
}

export interface GameValidator {
  validateResumingGame: (
    pausedState: PausedGameState,
    game: GameSession,
    resumeByPlayerId?: UserIdType,
  ) => void;
  validateGameStatus: (status: GameSessionStatus, validStatuses: GameSessionStatus[]) => void;
  getValidGameCheckPlayer: (gameId: GameIdType, userId: UserIdType) => GameSession;
  isExpectedPlayer: (players: Player[], userId: UserIdType) => boolean;
  allPlayersConnected: (game: GameSession) => boolean;
  gameReadyToStart: (game: GameSession) => boolean;
  isGameFull: (game: GameSession) => void;
}
