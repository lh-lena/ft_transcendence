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
  "matchId": "string",
  "visibility": "public"
}'

curl -X POST \
  'http://[::1]:8080/api/game' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 1,
  "mode": "pvp_remote",
  "matchId": "string",
  "visibility": "public"
}'
curl -X POST \
  'http://[::1]:8080/api/match' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 2936,
  "mode": "pvp_remote",
  "gameId": "string",
  "visibility": "public"
}'

curl -X POST \
  'http://[::1]:8080/api/game' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 2939,
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
  'http://[::1]:8080/api/match/join/4b43024b-a7f4-42a7-bb80-ead483621da6' \
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
  "gameId": "a3325abd-bb5c-586b-9f5b-184d16bf2c3d",
  "scorePlayer1": "2",
  "scorePlayer2": "8",
  "winnerId": 2,
  "loserId": 1,
  "player1Username": "alec",
  "player2Username": "moschi",
  "status":   "finished",
  "startedAt": "2025-07-24T15:45:09.142Z",
  "finishedAt": "2025-07-24T15:45:09.142Z"
}'
