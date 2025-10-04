#!/bin/bash

# Generate SSL certificates for ft_transcendence
# This script creates self-signed certificates for development

SSL_DIR="./nginx/ssl"
CERT_FILE="$SSL_DIR/selfsigned.crt"
KEY_FILE="$SSL_DIR/selfsigned.key"

echo "🔐 Generating SSL certificates for ft_transcendence..."

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/C=DE/ST=Berlin/L=Berlin/O=42School/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

# Set appropriate permissions
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"

echo "✅ SSL certificates generated successfully!"
echo "   Certificate: $CERT_FILE"
echo "   Private Key: $KEY_FILE"
echo ""
echo "⚠️  These are self-signed certificates for development only."
echo "   Your browser will show a security warning - this is expected."
echo ""
echo " You can now run: make dev"
