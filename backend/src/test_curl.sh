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

curl -X PATCH http://localhost:8080/api/match/user/29369 \
  -H "Content-Type: application/json" \
  -d '{"status": "ready" }'

curl -X PATCH http://localhost:8080/api/match/user/49612 \
  -H "Content-Type: application/json" \
  -d '{ "status": "ready" }'

curl -X DELETE http://localhost:8080/api/user/1

curl -X POST \
  'http://[::1]:8080/api/match' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 2936,
  "mode": "pvp_remote",
  "matchId": "string"
}'

curl -X POST \
  'http://[::1]:8080/api/match' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 29369,
  "mode": "pvp_remote",
  "matchId": "string"
}'


curl -X POST \
  'http://[::1]:8080/api/match' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 49612,
  "mode": "pvp_ai",
  "aiDifficulty": "hard",
  "matchId": "string"
}'
