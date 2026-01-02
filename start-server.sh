#!/bin/sh
set -e

echo "🚀 Starting Toolbay server..."
echo "📍 Node version: $(node --version)"
echo "🌍 Environment: ${NODE_ENV:-development}"
echo "🔌 Port: ${PORT:-3000}"

# Check if required environment variables are set
if [ -z "$DATABASE_URI" ]; then
  echo "❌ ERROR: DATABASE_URI is not set"
  exit 1
fi

if [ -z "$PAYLOAD_SECRET" ]; then
  echo "❌ ERROR: PAYLOAD_SECRET is not set"
  exit 1
fi

echo "✅ Environment variables validated"

# Start the Next.js standalone server
echo "🎯 Starting Next.js server..."
exec node server.js
