# Authentication Flow

## Registration
1. User submits email, username, password.
2. Backend validates input.
3. Password is hashed with Argon2.
4. User is stored in the database.

## Login
1. User submits email/username and password.
2. Backend fetches user by email/username.
3. Password is verified with Argon2.
4. If 2FA enabled, prompt for TOTP code.
5. On success, issue JWT.

## Authenticated Requests
- Client sends JWT in Authorization header (`Bearer <token>`) or as HTTP-only cookie.
- Backend verifies JWT.
- If valid, allow access.

## Logout
- Client deletes JWT (and refresh token if used).
