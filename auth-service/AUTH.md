# Auth-Service Documentation

## Overview

The `auth-service` handles authentication, two-factor authentication (2FA), privacy compliance, and JWT security.

It provides:

- User registration and login
- Email / TOTP-based 2FA
- Backup codes
- Privacy features (export data, delete account, manage consent)
- Secure JWT handling with refresh tokens, token rotation, blacklisting, and CSRF protection

---

## 1. Authentication

### Registration

**Endpoint:** `POST /api/auth/register`

**Body:**

```json
{
  "email": "user@example.com",
  "username": "user123",
  "password": "secret123",
  "alias": "nickname"
}

    Validates email, username, password

    Stores hashed password

    Initializes 2FA, backup codes, and privacy flags

Login

Endpoint: POST /api/auth/login

Body:

{
  "email": "user@example.com",
  "password": "secret123"
}

Flow:

    Verify credentials

    If 2FA is enabled:

        Email: send temporary code to email

        TOTP: prompt for code

    If 2FA not enabled: issue access and refresh tokens

Response:

{
  "accessToken": "<JWT access token>",
  "requires2fa": true|false,
  "method": "email"|"totp"
}

Two-Factor Authentication (2FA)

Supports:

    Email 2FA

        Sends a 6-digit code via email

        Temporary code expires in 5 minutes

    TOTP 2FA

        Client scans QR code

        Secret stored in backend

    Backup Codes

        One-time use

        Hashed in backend

        Can be regenerated

Endpoints:

    POST /api/auth/2fa/verify – verify code

    POST /api/auth/2fa/email/enable / disable

    POST /api/auth/2fa/totp/setup – returns QR code data URL

    POST /api/auth/2fa/totp/verify – confirm TOTP

    POST /api/auth/2fa/backup/regenerate – generate new backup codes

2. JWT Security
Access Tokens

    Short-lived (default 15 minutes)

    Stored in frontend memory

Refresh Tokens

    Long-lived (default 7 days)

    Stored in httpOnly cookie

    Used to obtain new access tokens

    Rotates on each use

    Revoked tokens are blacklisted

Endpoints

    POST /api/auth/refresh – rotate tokens

    POST /api/auth/logout – blacklist refresh token

Security:

    Blacklisting prevents reuse of old refresh tokens

    CSRF protection enabled for cookie-based endpoints

3. Privacy Compliance
Export Data

Endpoint: GET /api/privacy/export

Returns all user data in JSON.
Delete Account

Endpoint: DELETE /api/privacy/delete

Removes the user account from backend.
Privacy Settings

Endpoint: PUT /api/privacy/settings

Body Example:

{
  "marketingEmails": true,
  "dataSharingConsent": false
}

Updates user preferences and consent.
4. Backend Requirements

    Store 2FA secrets, backup codes, privacy flags

    Implement /user CRUD

    Implement /auth/blacklist for refresh token revocation

    JWT secrets:

        JWT_SECRET – for access tokens

        REFRESH_TOKEN_SECRET – for refresh tokens

5. Frontend Requirements

    Prompt for 2FA codes

    Handle backup codes

    Store access token in memory

    Store refresh token in httpOnly cookie

    Automatically call /api/auth/refresh to rotate tokens

    CSRF-safe requests if using cookies

    UI for privacy export, delete, and settings

6. Dependencies

npm install axios fastify @fastify/multipart @fastify/oauth2 @fastify/cookie @fastify/csrf-protection nodemailer otplib qrcode jsonwebtoken
npm install --save-dev @types/nodemailer @types/jsonwebtoken

7. Environment Variables

JWT_SECRET=<access_token_secret>
REFRESH_TOKEN_SECRET=<refresh_token_secret>
GOOGLE_CLIENT_ID=<google_client_id>
GOOGLE_CLIENT_SECRET=<google_client_secret>
SMTP_HOST=<smtp_host>
SMTP_PORT=<smtp_port>
SMTP_USER=<smtp_user>
SMTP_PASS=<smtp_pass>

8. Flow Summary

    User registers → account created

    User logs in → credentials verified

    If 2FA enabled → email or TOTP code sent

    User verifies code → JWT issued

    Access token used for API calls

    Refresh token rotates automatically → old token blacklisted

    Users can manage privacy → export data, delete account, consent
