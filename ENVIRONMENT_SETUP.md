# Environment Setup Guide

This guide explains how to set up environment variables for the ft_transcendence project.

## Required Environment Variables

The following environment variables are required for the application to run properly:

### Google OAuth Configuration
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret

### Security
- `JWT_SECRET`: Secret key for JWT token signing (minimum 32 characters)

### Grafana Configuration
- `GRAFANA_ADMIN_USER`: Admin username for Grafana (default: admin)
- `GRAFANA_ADMIN_PASSWORD`: Admin password for Grafana

## Local Development Setup

1. Copy the example environment files:
   ```bash
   cp .env.example .env
   cp auth-service/.env.example auth-service/.env
   ```

2. Edit the `.env` files and replace the placeholder values with your actual configuration:
   - Get Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)
   - Generate a secure JWT secret (at least 32 characters)
   - Set a secure Grafana admin password

3. Start the development environment:
   ```bash
   make dev
   ```

## GitHub Actions / CI Environment

The CI/CD pipeline automatically creates test environment files with dummy values for testing purposes. No manual setup is required for GitHub Actions.

## Production Deployment

For production deployment, ensure all environment variables are properly set in your deployment environment. Never commit actual `.env` files to the repository.

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique passwords and secrets
- Rotate secrets regularly
- Use environment-specific values for different deployment stages
