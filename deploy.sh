#!/bin/bash

# Toolbay Production Deployment Script
# This script pulls latest changes and rebuilds the Docker containers

set -e  # Exit on error

echo "🚀 Starting Toolbay deployment..."
echo "================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: Must be run from the toolboxx project directory${NC}"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Error: .env.production file not found${NC}"
    exit 1
fi

echo -e "${BLUE}📥 Pulling latest changes from Git...${NC}"
git pull origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git pull failed. Please resolve conflicts manually.${NC}"
    exit 1
fi

echo -e "${BLUE}🛑 Stopping current containers...${NC}"
docker compose down

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: Failed to stop containers (they may not be running)${NC}"
fi

echo -e "${BLUE}🔨 Building and starting containers...${NC}"
docker compose --env-file .env.production up -d --build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed during build${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo "================================"
echo -e "${BLUE}📊 Container status:${NC}"
docker compose ps

echo ""
echo -e "${BLUE}📋 Recent logs:${NC}"
docker compose logs --tail=20

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo "Your site is running at: https://toolbay.net"
echo ""
echo "To view live logs, run:"
echo "  docker compose logs -f"
echo ""
echo "To check container status, run:"
echo "  docker compose ps"
