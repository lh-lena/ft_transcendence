#!/bin/bash

# Fetch users from API
USERS_JSON=$(curl -s http://127.0.0.1:8080/api/user)

# Extract first two userIds using jq
USER_ID_1=$(echo "$USERS_JSON" | jq -r '.[0].userId')
USER_ID_2=$(echo "$USERS_JSON" | jq -r '.[1].userId')

echo "Joining user $USER_ID_1 to game..."
curl -s -X POST http://127.0.0.1:8080/api/game/join -H "Content-Type: application/json" -d "{\"userId\": \"$USER_ID_1\"}"

echo "Joining user $USER_ID_2 to game..."
GAME_JSON=$(curl -s -X POST http://127.0.0.1:8080/api/game/join -H "Content-Type: application/json" -d "{\"userId\": \"$USER_ID_2\"}")

GAME_ID=$(echo "$GAME_JSON" | jq -r '.gameId')
echo "Game ID: $GAME_ID"

echo "Game Info: "
curl -s -X GET http://127.0.0.1:8080/api/game/"$GAME_ID"

#-H "Content-Type: application/json" -d "{\"gameId\": \"$GAME_ID\"}"
