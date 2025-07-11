# ft_transcendence WebSocket Message Protocol

## Overview

The real-time communication protocol for the ft_transcendence Pong game. All messages are exchanged via WebSocket connections using JSON format. Implementing the single entry point for all real-time client-to-server communication, following one consistent message protocol.

## Connection

**The Single Real-time Entry Point:** `WS_SERVER_URL`=`wss://localhost:8081`

## Message Structure

All messages follow this base structure:

```json
{
  "event": "specific_event",
  "payload": { /* event-specific data */ },
}
```

### Fields:
- `event`: Specific event
- `payload`: Event-specific payload according to defined types

## Message Events

### Game Messages

### Server endpoint: new WebSocket(`${WS_SERVER_URL}/ws`);</br>

  #### Representation of events and payloads:
  ```markdown
    interface WsClientMessage {
      'game_start': { gameId: string };
      'game_leave': { gameId: string };
      'game_update': PlayerInput;
      'game_pause': { gameId: string };
      'game_resume': { gameId: string };
      'chat_message': ChatMessage;
      'notification': NotificationPayload;
    }

    interface WsServerBroadcast {
      'connected': { userId: number };
      'game_update': GameState;
      'game_ended': GameResult;
      'game_pause': { gameId: string, reason: string };
      'countdown_update': { gameId: string, countdown: number, message: string };
      'chat_message': ChatMessage;
      'notification': NotificationPayload;
      'error': { message: string };
    }
  ```

  #### Related types:
  ```markdown
    export enum Direction {
      UP = -1, // -10
      DOWN = 1,
      STOP = 0
    }

    export interface GameState {
      gameId: string;
      ball: { x: number; y: number; dx: number; dy: number; v: number; };
      paddleA: { width: number; height: number; x: number; y: number; score: number; speed: number; direction: Direction; };
      paddleB: { width: number; height: number; x: number; y: number; score: number; speed: number; direction: Direction; };
      activePaddle?: string;
      status: GameSessionStatus;
      countdown: number; // rm
      sequence: number; // default 0
    }

    export enum GameSessionStatus {
    PENDING = 'pending',    // Created but not yet started on ws-server
    ACTIVE = 'active',      // running on ws-server
    PAUSED = 'paused',      // temporarily paused
    FINISHED = 'finished',  // game finished
    CANCELLED = 'cancelled',// game aborted
    CANCELLED_SERVER_ERROR = 'cancelled_server_error',// game aborted by server due to error or shutdown
}

    export interface PlayerInput {
        direction: Direction;
        sequence: number; // default 0
    }

    export interface ChatMessage {
        userId: number; // Sender ID
        username: string; // Sender username //?
        recipientId?: number; // for DMs
        message: string;
        timestamp: string;
    }

    export interface NotificationPayload {
        type: 'info' | 'warn';
        tournamentId?: number;
        gameId: string;
        message: string;
        timestamp: number;
    }
  ```

  ### Constant related to Pong game
  ```
  export const PONG_CONFIG = {
    BOARD_WIDTH: 900,
    BOARD_HEIGHT: 550,
    PADDLE_WIDTH: 10,
    PADDLE_HALF_WIDTH: 5,
    PADDLE_HEIGHT: 80,
    PADDLE_HALF_HEIGHT: 40,
    PADDLE_OFFSET: 5,
    PADDLE_SPEED: 400,
    BALL_SIZE: 10,
    BALL_RESET_DELAY: 1,
    INITIAL_BALL_VELOCITY: 1.2,
    INCREMENT_BALL_VELOCITY: 0.1,
    MAX_BALL_VELOCITY: 2.5,
    INITIAL_BALL_SPEED_X: 4,
    INITIAL_BALL_SPEED_Y: 4,
    FPS: 60,
    MAX_SCORE: 11,
    COUNTDOWN: 3
  };

  ```

### `TODO`: define API endpoints

### ws-server -> backend:
#### on `game_start`: fetch the game session based on gameId for initializing the game logic -> GET {BACKEND_URL}/api/games/:gameId
##### Expected response:
  ```markdown
    export interface StartGame {
        gameId: string;
        gameMode: GameMode;
        players: Array<User>,
        aiDifficulty?: AIDifficulty;
    }

    related types:
    export enum GameMode {
        PVP_REMOTE = 'pvp_remote',
        PVP_LOCAL = 'pvp_local',
        PVB_AI = 'pvb_ai',
    }

    export enum AIDifficulty {
        EASY = 'easy', // 60% accuracy, slow reaction 200ms delay
        MEDIUM = 'medium', // 75% accuracy, moderate reaction 100ms delay
        HARD = 'hard', // 90% accuracy, fast reaction 50ms delay // not sure
    }
  ```

#### on `game_ended`: update state sending GameResult -> POST {BACKEND_URL}/api/games/result
##### Expected request:
  ```markdown
    interface GameResult {
    gameId: string;
    scorePlayer1: number;
    scorePlayer2: number;
    winnerId: number | null; // -1 for AI
    loserId: number | null;
    player1Username: string | null; // for ai -> AI
    player2Username: string | null;
    status: GameSessionStatus.FINISHED | GameSessionStatus.CANCELLED | GameSessionStatus.CANCELLED_SERVER_ERROR;
    startedAt: string;
    finishedAt: string;
}
  ```

#### on `chat_message`
##### Will be sent to backend for history
  ```
  await fetch(`${BACKEND_URL}/api/chat/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: chatMessage }),
  });
  ```
- frontend will fetch the chat history from the backend server

### ws-server -> auth:
#### on `connection` to validate the user based on the passed JWT token: GET {AUTH_URL}/api/user?token

If authentication fails, terminate the WebSocket connection
##### Expected response:
  ```markdown
  export interface User {
      userId: number;
      username: string;
      userAlias: string;
  }
  ```

### Error Messages Example

**Server → Client:**
```json
{
  "event": "error",
  "data": {
    "error": "User not found"
  }
}
```

### Game Flow

#### User Joins Game Flow: Client connects -> ws-server authenticates -> Client sends `game_start` -> ws-server fetches game session from Backend -> ws-server broadcasts `game_started`

#### Player Moves Paddle Flow: Client sends `game_update` -> ws-server updates internal state -> ws-server calculates new `GameState` -> ws-server broadcasts `game_update`.

