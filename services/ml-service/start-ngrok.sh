#!/bin/bash
echo "Starting ngrok tunnel for ML service..."
echo

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    set -a
    source .env
    set +a
fi

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "ERROR: ngrok is not installed or not in PATH"
    echo "Please install ngrok from https://ngrok.com/download"
    exit 1
fi

# Check for required environment variables
if [ -z "$NGROK_AUTH_TOKEN" ]; then
    echo "ERROR: NGROK_AUTH_TOKEN environment variable is not set"
    echo "Please set it in your .env file or environment"
    exit 1
fi

if [ -z "$NGROK_STATIC_DOMAIN" ]; then
    echo "ERROR: NGROK_STATIC_DOMAIN environment variable is not set"
    echo "Please set it in your .env file or environment"
    exit 1
fi

echo "Configuration:"
echo "  - Auth Token: ${NGROK_AUTH_TOKEN:0:10}..."
echo "  - Static Domain: $NGROK_STATIC_DOMAIN"
echo "  - Target: localhost:3002"
echo

# Create temporary config file with substituted values
TEMP_CONFIG=$(mktemp /tmp/ngrok-temp-XXXXXX.yml)
trap "rm -f $TEMP_CONFIG" EXIT

cat > "$TEMP_CONFIG" <<EOF
version: "2"
authtoken: $NGROK_AUTH_TOKEN

tunnels:
  ml-service:
    proto: http
    addr: 3002
    domain: $NGROK_STATIC_DOMAIN
EOF

echo "Starting ngrok tunnel..."
echo "Press Ctrl+C to stop"
echo

# Start ngrok with temporary config file
ngrok start --config "$TEMP_CONFIG" ml-service

