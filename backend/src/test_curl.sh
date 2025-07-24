#!/bin/bash

curl -X POST http://[::1]:8080/api/user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john4@example.com",
    "password_hash": "hashed_password",
    "username": "Johnson",
    "is_2fa_enabled": "true"
  }'

curl -X POST http://[::1]:8080/api/user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password_hash": "hashed_password",
    "username": "Janesen"
  }'

curl -X PATCH http://localhost:8080/api/game/user/29369 \
  -H "Content-Type: application/json" \
  -d '{"status": "ready" }'

curl -X PATCH http://localhost:8080/api/game/user/49612 \
  -H "Content-Type: application/json" \
  -d '{ "status": "ready" }'

curl -X DELETE http://localhost:8080/api/user/1

curl -X POST \
  'http://[::1]:8080/api/game' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 2,
  "mode": "pvp_remote",
  "gameId": "string",
  "visibility": "public"
}'

curl -X POST \
  'http://[::1]:8080/api/game' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 12,
  "mode": "pvp_remote",
  "gameId": "string",
  "visibility": "public"
}'

curl -X POST \
  'http://[::1]:8080/api/game' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 10,
  "mode": "pvp_remote",
  "gameId": "string",
  "visibility": "private"
}'

curl -X POST \
  'http://[::1]:8080/api/game/join/b0324abe-aa5c-486b-9f5b-184d16bf2c3d' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 19,
  "mode": "pvp_remote",
  "gameId": "string",
  "visibility": "private"
}'

curl -X POST \
  'http://[::1]:8080/api/game' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 49612,
  "mode": "pvp_ai",
  "aiDifficulty": "hard",
  "gameId": "string"
}'

curl -X POST \
  'http://[::1]:8080/api/result' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "gameId": "e3325abd-bb5c-486b-9f5b-184d16bf2c3d",
  "scorePlayer1": "2",
  "scorePlayer2": "8",
  "winnerId": 1,
  "loserId": 2,
  "player1Username": "alec",
  "player2Username": "moschi",
  "status":   "finished",
  "startedAt": "2025-07-24T15:45:09.142Z",
  "finishedAt": "2025-07-24T15:45:09.142Z"
}'
