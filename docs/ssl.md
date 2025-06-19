````md
# SSL Setup

This project uses HTTPS and WSS for secure communication in development.

## Development Setup

We use self-signed certificates to enable HTTPS locally.

1. Generate the certificate:

   ```bash
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout nginx/ssl/selfsigned.key \
     -out nginx/ssl/selfsigned.crt \
     -subj "/C=DE/ST=Berlin/L=Berlin/O=42School/CN=localhost"
````

2. NGINX is configured to:

   * Serve HTTPS on port 443 using the generated certificate
   * Proxy requests to each internal service
   * Support WSS for WebSocket connections

3. The `nginx` service in `docker-compose.yml` mounts the SSL files and config using volumes:

   ```yaml
   volumes:
     - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
     - ./nginx/ssl:/etc/nginx/ssl:ro
   ```

## Production Notes

In production, self-signed certificates should be replaced with real certificates from a trusted authority like Let's Encrypt. Paths in the NGINX config must be updated to point to those certificate files.

```
