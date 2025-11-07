
# Realtime service

**The Realtime Service is designed as a microservice within the ft_transcendence project, providing real-time communication capabilities for the web based pong game**

## Quick links

- Websocket event reference & REST API: available at the running service under `/api/docs`
- Environment variables: see `.env.example` in this folder

## Minimal quick start

1. Copy example env and adjust values if needed:

```bash
cp .env.example .env
```

2. Install deps and run locally:

```bash
npm install
npm run dev
```

## WebSocket Implementation

- Single Entry Point: `wss://localhost:<WS_PORT>/ws` for all real-time communication
- Message Protocol: Structured JSON messages with event-driven architecture
- Connection Management: Full lifecycle handling with JWT-based authentication, ping/pong, graceful shutdown
- Real-time Events: game state synchronization, player input, chat messages, notifications
- Input Validation: Zod schema validation, message size limits, type checking

## AI system

- Prediction Engine: Ball trajectory calculation with collision detection
- Movement Controller: Difficulty configuration (Easy/Medium/Hard)
- State Management: AI decision-making with configurable intervals (by default once per second)
- Physics Simulation: Simulates paddle physics and sends player input over the eventBus

## Architecture Overview

### Plugin-Based Architecture

```
  FastifyInstance
  │
  ├─ Config Plugin (root)
  │   ├─ Auth Plugin
  │   │   ├─ WebSocket Plugin
  │   │   │   ├─ Game Plugin
  │   │   │   └─ Chat Plugin
  │   │   └─ API Plugin
  │   ├─ EventBus Plugin
  │   ├─ AI Plugin
  │   └─ Docs Plugin
  │
  └─ Services (decorated)
      ├─ gameService
      ├─ aiService
      ├─ chatService
      ├─ connectionService
      └─ respond
```

Dependencies are loaded first - managed by fastify-plugin

## Message Flow

### WebSocket Connection
```
  Client: wss://localhost:<WS_PORT>/ws?token=<JWT>
  ────────────────────────────────────────────────
              │
              ▼
  ┌──────────────────────────────────┐
  │   ws.plugin.ts                   │
  │   - WebSocketServer setup        │
  │   - verifyClient() w/ JWT        │
  │   - maxPayload: 1MB              │
  └────────────┬─────────────────────┘
               │
               ▼
  ┌─────────────────────────────┐
  │  handleWSConnection()       │
  │  - Register in registry     │
  │  - Setup heartbeat          │
  │  - Send 'connected' event   │
  └─────────────────────────────┘
```

### Message Processing
```
  Client Message (JSON)
  ─────────────────────
              │
              ▼
  ┌─────────────────────────────┐
  │  ws.controller.ts           │
  │  - Parse JSON               │
  │  - Validate with Zod        │
  └──────────┬──────────────────┘
             │
             ▼
  ┌─────────────────────────────┐
  │  EVENT BUS                  │
  │ emit(event, {user, payload})│
  └─────┬──────────┬────────────┘
        │          │
        ▼          ▼
      Game        Chat
     Handler     Handler
```

### Response Flow
```
      Service Layer
  ─────────────────────
              │
              ▼
  ┌───────────────────────────────────────┐
  │  respond.service.ts                   │
  │  - send(userId, event, payload)       │
  │  - broadcast(gameId, event, payload)  │
  └──────────┬────────────────────────────┘
             │
             ▼
  ┌──────────────────────────────┐
  │  Connection Registry         │
  │  Map<userId, WebSocket>      │
  └──────────┬───────────────────┘
             │
             ▼
          Client
```

### Game Flow
```
  ┌─────────────────────────────────────────────┐
  │  Backend: POST /api/game/start              │
  │  (after matchmaking completes)              │
  └───────────────────┬─────────────────────────┘
                      │
                      ▼
  ┌─────────────────────────────────────────────┐
  │  app.gameService.initializeGameSession()    │
  │  - Create GameSession in memory             │
  │  - Add AI player if needed (PVB_AI mode)    │
  │  - Store in gameSessionService              │
  │  - Send 'game_ready' to all players         │
  └───────────────────┬─────────────────────────┘
                      │
                      ▼
  ┌─────────────────────────────────────────────┐
  │  Players send 'client_ready' events         │
  │  - Mark each player as ready                │
  │  - Wait for all players                     │
  └───────────────────┬─────────────────────────┘
                      │
                      ▼
  ┌─────────────────────────────────────────────┐
  │  app.gameService.handleStartGame()          │
  │  (when all players ready)                   │
  └───────────────────┬─────────────────────────┘
                      │
                      ▼
  ┌─────────────────────────────────────────────┐
  │  app.gameStateService.startGame()           │
  │  - Status: PENDING → ACTIVE                 │
  │  - Assign paddles (A/B) to players          │
  │  - Send 'game_started' event                │
  └───────────────────┬─────────────────────────┘
                      │
                      ▼
  ┌─────────────────────────────────────────────┐
  │ app.gameLoopService.startCountdownSequence()│
  │  - Countdown: 3...2...1...GO!               │
  │  - Register game in ticker                  │
  └───────────────────┬─────────────────────────┘
                      │
                      ▼
  ┌─────────────────────────────────────────────┐
  │  GAME LOOP (60 FPS ticker)                  │
  │  - Update physics (pong.engine)             │
  │  - Process AI logic (if PVB_AI)             │
  │  - Check win conditions                     │
  │  - Broadcast 'game_update' to players       │
  └─────────┬──────────────────┬────────────────┘
            │                  │
            ▼                  ▼
      Player Input         AI Controller
      (via eventBus)      (emits input)
            │                  │
            └────────┬─────────┘
                     │
                     ▼
             Paddle Updates
                     │
                     │ (score reached)
                     ▼
  ┌─────────────────────────────────────────────┐
  │  game-state.service.endGame()               │
  │  - Stop loops & countdown                   │
  │  - Status → FINISHED/CANCELLED              │
  │  - Create game result                       │
  │  - Send 'game_ended' event                  │
  └───────────────────┬─────────────────────────┘
                      │
                      ▼
  ┌─────────────────────────────────────────────┐
  │  Send result to backend / Delete AI game    │
  │  Clean up: remove session, clear registry   │
  └─────────────────────────────────────────────┘
```

### Graceful Shutdown
```bash
  1. SIGTERM/SIGINT received
  2. Stop accepting new connections
  3. Notify all clients (close code: 1001)
  4. End all active games → CANCELLED_SERVER_ERROR
  5. Close WebSocket connections
  6. Shutdown Fastify server
```