# Authentication Service Documentation

## Overview

This service provides secure user registration and login using Argon2 password hashing and JWT-based authentication.

---

## Registration

**Endpoint:**
`POST /api/auth/register`

**Request Body:**

```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "yourpassword"
}
```

**Success Response:**
`201 Created`

```json
{ "message": "User registered successfully." }
```

**Possible Errors:**

- `400 Bad Request` – Missing or invalid fields
- `409 Conflict` – Email or username already in use
- `500 Internal Server Error` – Server error

---

## Login

**Endpoint:**
`POST /api/auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Success Response:**
`200 OK`

```json
{ "token": "<jwt_token>" }
```

**Possible Errors:**

- `400 Bad Request` – Missing fields
- `401 Unauthorized` – Invalid credentials

---

## JWT Payload Example

```json
{
  "sub": 1,
  "username": "username",
  "email": "user@example.com",
  "is_2fa_enabled": 0,
  "iat": 1234567890,
  "exp": 1234568490
}
```

---

## Authenticated Requests

- Client sends JWT in the `Authorization` header:
  `Authorization: Bearer <token>`
- Backend or realtime verifies the JWT using the shared secret.
- If valid, access is granted to protected resources.

---

## Protected Endpoint Example

**Endpoint:**
`GET /api/auth/me`
**Headers:**
`Authorization: Bearer <jwt_token>`

**Success Response:**

```json
{
  "user": {
    "sub": 1,
    "username": "username",
    "email": "user@example.com",
    "is_2fa_enabled": 0,
    "iat": 1234567890,
    "exp": 1234568490
  }
}
```

**Possible Errors:**

- `401 Unauthorized` – Missing or invalid token

---

## Logout

- Client deletes the JWT (and refresh token if used).

---

## Flow Summary

1. **Registration:**
   User submits email, username, and password. Backend validates input, hashes password with Argon2, and stores the user.
2. **Login:**
   User submits email and password. Backend verifies credentials and issues a JWT.
3. **Authenticated Requests:**
   Client includes JWT in requests. Backend verifies JWT for access.
4. **Logout:**
   Client removes JWT.

---

## Notes for Integrators

- Other services (backend, realtime) should use the same `JWT_SECRET` to verify tokens.
- The JWT payload contains user id (`sub`), username, email, and 2FA status.
- See `src/jwt.ts` for token generation and verification logic.
