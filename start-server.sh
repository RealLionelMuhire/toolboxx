#!/bin/sh

echo "🚀 Starting Toolbay server..."
echo "📍 Node version: $(node --version)"
echo "🌍 Environment: ${NODE_ENV:-development}"
echo "🔌 Port: ${PORT:-3000}"
echo "📁 Working directory: $(pwd)"
echo "📄 Files in current directory:"
ls -la

# Check if server.js exists
if [ ! -f "server.js" ]; then
  echo "❌ ERROR: server.js not found in $(pwd)"
  echo "Contents of directory:"
  ls -la
  exit 1
fi

echo "✅ server.js found"

# Log environment variables (without exposing secrets)
echo "🔍 Environment check:"
echo "  - DATABASE_URI: ${DATABASE_URI:+SET}${DATABASE_URI:-NOT SET}"
echo "  - PAYLOAD_SECRET: ${PAYLOAD_SECRET:+SET}${PAYLOAD_SECRET:-NOT SET}"
echo "  - NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL:-NOT SET}"
echo "  - RESEND_API_KEY: ${RESEND_API_KEY:+SET}${RESEND_API_KEY:-NOT SET}"
echo "  - BLOB_READ_WRITE_TOKEN: ${BLOB_READ_WRITE_TOKEN:+SET}${BLOB_READ_WRITE_TOKEN:-NOT SET}"

# Warning for missing variables but don't exit - let Next.js handle it
if [ -z "$DATABASE_URI" ]; then
  echo "⚠️  WARNING: DATABASE_URI is not set - app may fail to start"
fi

if [ -z "$PAYLOAD_SECRET" ]; then
  echo "⚠️  WARNING: PAYLOAD_SECRET is not set - app may fail to start"
fi

echo "✅ Starting Next.js server..."
echo "🎯 Port: ${PORT}"
echo "🎯 Hostname: ${HOSTNAME:-0.0.0.0}"

# Set HOSTNAME to 0.0.0.0 to listen on all interfaces (required for Render)
export HOSTNAME=0.0.0.0

echo "🎯 Executing: node server.js"

# The Dockerfile copies standalone output to /app root
# So server.js is at /app/server.js (copied from .next/standalone/server.js)
exec node server.js
