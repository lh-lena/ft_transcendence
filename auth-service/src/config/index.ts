export const config = {
  port: Number(process.env.PORT) || 8082,
  host: process.env.HOST || '0.0.0.0',
  googleClientId: process.env.GOOGLE_CLIENT_ID!,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  smtpHost: process.env.SMTP_HOST!,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER!,
  smtpPass: process.env.SMTP_PASS!,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
};
