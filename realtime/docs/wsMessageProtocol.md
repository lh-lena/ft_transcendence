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
  "payload": {
    /* event-specific data */
  }
}
```

### Fields:

- `event`: Specific event
- `payload`: Event-specific payload according to defined types

## Message Events

### Game Messages

### Server endpoint: new WebSocket(`${WS_SERVER_URL}/ws`);</br>

#### Representation of events and payloads:

#### Incoming messages [Client -> Server]
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

#### Outgoing messages [Server -> Client]
interface WsServerBroadcast {
'connected': { userId: uuid };
'game_start': GameStartedPayload;
'game_update': GameState;
'game_ended': GameResult;
'game_pause': { gameId: string, reason: string };
'countdown_update': { gameId: string, countdown: number, message: string };
'chat_message': ChatMessageBroadcast;
'notification': NotificationPayload;
'error': { message: string };
}
```

#### Related types:

```markdown
export enum Direction {
UP = -1,
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
countdown: number;
sequence: number;
}

const GameStartedPayload = {
  gameId: GameIdSchema,
  players: z.array({ userId: uuid });
}

export enum GameSessionStatus {
PENDING = 'pending', // Created but not yet started on ws-server
ACTIVE = 'active', // running on ws-server
PAUSED = 'paused', // temporarily paused
FINISHED = 'finished', // game finished
CANCELLED = 'cancelled',// game aborted
CANCELLED_SERVER_ERROR = 'cancelled_server_error',// game aborted by server due to error or shutdown
}

export interface PlayerInput {
gameId: string;
direction: Direction;
sequence: number;
}

export interface ChatMessageBroadcast = z.object({
senderId: uuid,
message: string;
timestamp: string;
});

export interface ChatMessage {
recieverId: uuid;
message: string;
timestamp: string;
}

export interface NotificationPayload {
type: 'info' | 'warn' | 'error';
message: string;
timestamp: number;
}
```

### Constant related to Pong game

```
const PONG_CONFIG = {
  INCREMENT_BALL_VELOCITY: 2,
  MAX_BALL_DY: 2.5,
  FPS: 60,
  FRAME_TIME_CAP_SECONDS: 2 / 60,
  MAX_SCORE: 11,
  COUNTDOWN: 3,
  COUNTDOWN_INTERVAL: 1300,
};

const PONG_CONFIG = {
  INCREMENT_BALL_VELOCITY: 2,
  MAX_BALL_DY: 2.5,
  FPS: 60,
  FRAME_TIME_CAP_SECONDS: 2 / 60,
  MAX_SCORE: 11,
  COUNTDOWN: 3,
  COUNTDOWN_INTERVAL: 1300,
};

const BOARD_DEFAULTS = {
  width: 900,
  height: 550,
};

const BALL_DEFAULTS = {
  x: BOARD_DEFAULTS.width / 2,
  y: BOARD_DEFAULTS.height / 2,
  dx: Math.random() < 0.5 ? 6 : -6,
  dy: Math.random() < 0.5 ? 1 : -1,
  v: 70,
  size: 15,
};

const PADDLE_DEFAULTS = {
  height: 80,
  width: 15,
  speed: 500,
  score: 0,
  x: 5,
};

const PADDLE_A_DEFAULTS = {
  ...PADDLE_DEFAULTS,
  y: BOARD_DEFAULTS.height / 2 - PADDLE_DEFAULTS.height / 2,
};

const PADDLE_B_DEFAULTS = {
  ...PADDLE_DEFAULTS,
  x: BOARD_DEFAULTS.width - (PADDLE_A_DEFAULTS.x + PADDLE_DEFAULTS.width),
  y: BOARD_DEFAULTS.height / 2 - PADDLE_DEFAULTS.height / 2,
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
winnerId: uuid | null; // -1 for AI
loserId: uuid | null;
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
await fetch(`${BACKEND_URL}/api/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: saveChatMessage }),
});
```

interface saveChatMessage {
senderId: uuid;
reciverId: uuid,
message: string,
}

- frontend will fetch the chat history from the backend server

### ws-server -> auth:

#### on `connection` to validate the user based on the passed JWT token: GET {AUTH_URL}/api/user?token

If authentication fails, terminate the WebSocket connection

##### Expected response:

```markdown
export interface User {
userId: uuid;
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
