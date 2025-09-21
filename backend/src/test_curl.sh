#!/bin/bash

curl -X POST http://[::1]:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "senderId": "12",
    "recieverId": "31",
    "message": "true"
  }'

curl -X POST http://[::1]:8080/api/blocked \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "11",
    "blockedId": "10",
  }'

curl -X POST http://127.0.0.1:8080/api/user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john4@example.com",
    "password_hash": "hashed_password",
    "username": "Johnson",
    "is_2fa_enabled": "true",
    "color":"warm",
    "colormap":"ready"
  }'

curl -X POST http://localhost:8080/api/upload/avatar \
  -F "avatar=@Screenshot_20250603_093448.png"

curl -X POST http://[::1]:8080/api/user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane2@example.com",
    "password_hash": "hashed_password",
    "username": "Janesen2"
  }'

curl -X PATCH http://localhost:8080/api/user/3f0761d5-738c-4360-8996-d369ecc4f47d \
  -H "Content-Type: application/json" \
  -d '{"colormap": [ "ready", "warm", "cold" ] }'

curl -X PATCH http://localhost:8080/api/game/user/29369 \
  -H "Content-Type: application/json" \
  -d '{"status": "ready" }'

curl -X PATCH http://localhost:8080/api/game/user/49612 \
  -H "Content-Type: application/json" \
  -d '{ "status": "ready" }'

curl -X DELETE http://localhost:8080/api/user/1

curl -X POST \
  'http://127.0.0.1:8080/api/game' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": "aa8bf1d8-64f9-45cd-80df-4b39000d0ce9",
  "mode": "pvb_ai",
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
  'http://127.0.0.1:8080/api/game' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "playerId": "a2225abd-bb5c-586b-9f5b-184d16bf2c3d",
  "mode": "pvp_remote",
  "visibility": "private"
}'

curl -X POST \
  'http://127.0.0.1:8080/api/game/join' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": "4b43024b-a7f4-42a7-bb80-ead483621da6"
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
  'http://127.0.0.1:8080/api/result' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "gameId":"1debda50-04ec-4594-8c7d-6b6fa0ed2dc6",
"scorePlayer1":2,
"scorePlayer2":11,
"player1Username":"Player A",
"player2Username":"Player B",
"mode":"pvp_remote",
"startedAt":"1758120238255",
"finishedAt":"1758120262082",
"status":"finished",
"winnerName":"WilmaMacej",
"winnerId":"aa8bf1d8-64f9-45cd-80df-4b39000d0ce9",
"loserId":"ea3680c0-1d78-4ada-9e42-da25e0b75575"
}'

curl -X POST \
  'http://127.0.0.1:8080/api/chat' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "senderId": "aa8bf1d8-64f9-45cd-80df-4b39000d0ce9",
    "recieverId": "ea3680c0-1d78-4ada-9e42-da25e0b75575",
    "message": "Hello, how are you?"
  }'

curl -X DELETE \
  'http://127.0.0.1:8080/api/game/ccb21619-fa64-4db7-b1b2-0514f5928093'

