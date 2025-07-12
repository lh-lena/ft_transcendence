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

curl -X PATCH http://localhost:8080/api/match/ready/29369 \
  -H "Content-Type: application/json" \
  -d '{"ready": "true"}'

curl -X PATCH http://localhost:8080/api/match/ready/49612 \
  -H "Content-Type: application/json" \
  -d '{"ready": "true"}'

curl -X DELETE http://localhost:8080/api/user/1


curl -X 'POST' \
  'http://[::1]:8080/api/match' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 29369,
  "mode": "pvp_remote",
  "visibility": "public",
  "matchId": "string",
  "ready": "false",
  "time": 0
}'


curl -X 'POST' \
  'http://[::1]:8080/api/match' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 49612,
  "mode": "pvp_remote",
  "visibility": "public",
  "matchId": "string",
  "ready": "false",
  "time": 0
}'
