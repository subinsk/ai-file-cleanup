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

# Check if ML service is running on port 3002
echo "Checking if ML service is running on port 3002..."
if ! nc -z localhost 3002 2>/dev/null && ! command -v nc &> /dev/null; then
    # Fallback: try using curl or wget
    if command -v curl &> /dev/null; then
        if ! curl -s http://localhost:3002/health >/dev/null 2>&1; then
            echo "ERROR: ML service is not running on port 3002"
            echo "Please start the ML service first:"
            echo "  cd services/ml-service"
            echo "  python run.py"
            echo ""
            echo "Or use: ./start.sh"
            exit 1
        fi
    elif command -v wget &> /dev/null; then
        if ! wget -q --spider http://localhost:3002/health 2>/dev/null; then
            echo "ERROR: ML service is not running on port 3002"
            echo "Please start the ML service first:"
            echo "  cd services/ml-service"
            echo "  python run.py"
            echo ""
            echo "Or use: ./start.sh"
            exit 1
        fi
    else
        # Last resort: check if port is listening
        if command -v lsof &> /dev/null; then
            if ! lsof -i :3002 >/dev/null 2>&1; then
                echo "ERROR: ML service is not running on port 3002"
                echo "Please start the ML service first:"
                echo "  cd services/ml-service"
                echo "  python run.py"
                echo ""
                echo "Or use: ./start.sh"
                exit 1
            fi
        fi
    fi
elif command -v nc &> /dev/null; then
    if ! nc -z localhost 3002 2>/dev/null; then
        echo "ERROR: ML service is not running on port 3002"
        echo "Please start the ML service first:"
        echo "  cd services/ml-service"
        echo "  python run.py"
        echo ""
        echo "Or use: ./start.sh"
        exit 1
    fi
fi
echo "ML service is running on port 3002"
echo

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

