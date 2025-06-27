#!/bin/bash

curl -X POST http://[::1]:8080/api/user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password_hash": "hashed_password",
    "first_name": "Johnson",
    "display_name": "Johnny",
    "avatar_url": "https://example.com/avatar.jpg"
  }'

curl -X POST http://[::1]:8080/api/user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "first_name": "Janesen",
    "display_name": "Janey",
    "avatar_url": "https://example.com/avatar2.jpg"
  }'

curl -X PATCH http://localhost:8080/api/user/1 \
  -H "Content-Type: application/json" \
  -d '{"first_name":"alice", "email":"alice_new@example.com"}'

curl -X DELETE http://localhost:8080/api/user/1
