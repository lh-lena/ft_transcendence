#!/bin/bash

USER1_JSON=$(curl -s -X POST http://127.0.0.1:8080/api/user -H "Content-Type: application/json" \
  -d '{
    "email": "user1_'$(date +%s)'@example.com",
    "username": "user1_'$(date +%s)'",
    "password_hash": "password123",
    "guest": false,
    "tfaEnabled": false,
    "color": "red",
    "colormap": "default"
  }')

USER1_ID=$(echo "$USER1_JSON" | jq -r '.userId')

echo "Created User 1: $USER1_ID"

USER2_JSON=$(curl -s -X POST http://127.0.0.1:8080/api/user -H "Content-Type: application/json" \
  -d '{
    "email": "user2_'$(date +%s)'@example.com",
    "username": "user2_'$(date +%s)'",
    "password_hash": "password123",
    "guest": false,
    "tfaEnabled": false,
    "color": "red",
    "colormap": "default"
  }')

USER2_ID=$(echo "$USER2_JSON" | jq -r '.userId')

echo "Created User 2: $USER2_ID"

echo "Joining user $USER1_ID to game..."
curl -s -X POST http://127.0.0.1:8080/api/game/join -H "Content-Type: application/json" -d "{\"userId\": \"$USER1_ID\"}"

echo "Joining user $USER2_ID to game..."
GAME_JSON=$(curl -s -X POST http://127.0.0.1:8080/api/game/join -H "Content-Type: application/json" -d "{\"userId\": \"$USER2_ID\"}")

GAME_ID=$(echo "$GAME_JSON" | jq -r '.gameId')
echo "Game ID: $GAME_ID"

echo "Game Info: "
curl -s -X GET http://127.0.0.1:8080/api/game/"$GAME_ID"

#-H "Content-Type: application/json" -d "{\"gameId\": \"$GAME_ID\"}"
