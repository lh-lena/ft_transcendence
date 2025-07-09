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

curl -X PATCH http://localhost:8080/api/user/1 \
  -H "Content-Type: application/json" \
  -d '{"username":"alice", "email":"alice_new@example.com"}'

curl -X DELETE http://localhost:8080/api/user/1
