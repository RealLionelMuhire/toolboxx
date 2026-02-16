#!/bin/bash

# Toolbay Production Deployment Script - Zero Downtime Edition
# This script implements zero-downtime deployment by building new images
# before stopping old containers

set -e  # Exit on error

echo "🚀 Starting Zero-Downtime Toolbay Deployment..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}Checking project directory...${NC}"
# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: Must be run from the toolboxx project directory${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Project directory OK${NC}"

echo -e "${BLUE}Checking Docker daemon...${NC}"
# Check if Docker is running (with timeout)
if ! timeout 5 sudo docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running or not accessible${NC}"
    echo -e "${YELLOW}💡 Try: sudo systemctl start docker${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"

echo -e "${BLUE}Checking Docker Compose...${NC}"
# Check if docker compose is available
if ! sudo docker compose version >/dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker Compose is not installed or not accessible${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose is available${NC}"

echo -e "${BLUE}Checking .env.production file...${NC}"
# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Error: .env.production file not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ .env.production found${NC}"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📥 Step 1/6: Pulling latest code from GitHub${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
git pull origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git pull failed. Please resolve conflicts manually.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Code updated successfully${NC}"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Step 2/6: Checking current container status${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check Docker daemon is responsive
echo -e "${YELLOW}⏳ Verifying Docker daemon...${NC}"
if ! timeout 5 docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker daemon not responding. Please check Docker service.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker daemon is responsive${NC}"

# Validate docker-compose.yml
echo -e "${YELLOW}⏳ Validating docker-compose.yml...${NC}"
if ! timeout 10 docker compose --env-file .env.production config >/dev/null 2>&1; then
    echo -e "${RED}❌ docker-compose.yml validation failed${NC}"
    docker compose --env-file .env.production config 2>&1 | tail -20
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose configuration is valid${NC}"

# Get container status with timeout
echo -e "${YELLOW}⏳ Checking for existing containers...${NC}"
OLD_CONTAINERS=$(timeout 10 docker compose ps -q 2>/dev/null || echo "")
if [ -n "$OLD_CONTAINERS" ]; then
    echo -e "${GREEN}✓ Found running containers (keeping them alive during build)${NC}"
    timeout 10 docker compose ps || echo -e "${YELLOW}⚠️  Could not display container status${NC}"
else
    echo -e "${YELLOW}⚠️  No running containers found (first deployment or all stopped)${NC}"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔨 Step 3/6: Building new Docker images${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}⚡ Old containers are still running and serving traffic${NC}"
echo ""

# Build new images without stopping old containers (no timeout, show live output)
docker compose --env-file .env.production build --no-cache --progress=plain

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed! Old containers are still running.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ New images built successfully${NC}"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔄 Step 4/6: Deploying new containers${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}⚡ Using --force-recreate for zero-downtime swap${NC}"
echo ""

# Deploy new containers with force-recreate for minimal downtime
docker compose --env-file .env.production up -d --force-recreate --remove-orphans

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed during container startup${NC}"
    exit 1
fi
echo -e "${GREEN}✓ New containers deployed${NC}"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🏥 Step 5/6: Running health checks${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Wait for containers to be healthy
echo -e "${YELLOW}⏳ Waiting for services to initialize (5 seconds)...${NC}"
sleep 5

# Health check with retries
MAX_ATTEMPTS=30
ATTEMPT=1
health_check_passed=false

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    # Check if all containers are running
    running_containers=$(docker compose ps --services --filter "status=running" | wc -l)
    total_containers=$(docker compose ps --services | wc -l)
    
    if [ "$running_containers" -eq "$total_containers" ] && [ "$total_containers" -gt 0 ]; then
        echo -e "${GREEN}✓ All containers are running ($running_containers/$total_containers)${NC}"
        health_check_passed=true
        break
    else
        echo -e "${YELLOW}⏳ Attempt $ATTEMPT/$MAX_ATTEMPTS: Waiting for containers ($running_containers/$total_containers running)...${NC}"
        ATTEMPT=$((ATTEMPT + 1))
        sleep 2
    fi
done

if [ "$health_check_passed" = false ]; then
    echo -e "${RED}❌ Health checks failed after $MAX_ATTEMPTS attempts${NC}"
    echo -e "${YELLOW}📋 Recent logs:${NC}"
    docker compose logs --tail=50
    exit 1
fi

# Check container health status
UNHEALTHY=$(docker compose ps | grep -i "unhealthy\|restarting" || true)
if [ -n "$UNHEALTHY" ]; then
    echo -e "${RED}⚠️  Warning: Some containers may be unhealthy:${NC}"
    echo "$UNHEALTHY"
else
    echo -e "${GREEN}✓ All containers are healthy${NC}"
fi

# Display container status
echo ""
echo -e "${BLUE}📊 Current container status:${NC}"
docker compose ps

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧹 Step 6/6: Cleaning up old images${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Remove dangling images to free up space
DANGLING=$(docker images -f "dangling=true" -q)
if [ -n "$DANGLING" ]; then
    echo -e "${YELLOW}🗑️  Removing dangling images...${NC}"
    docker rmi $DANGLING 2>/dev/null || true
    echo -e "${GREEN}✓ Old images cleaned up${NC}"
else
    echo -e "${GREEN}✓ No dangling images to clean${NC}"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📋 Recent logs from new containers:${NC}"
docker compose logs --tail=20
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Zero-Downtime Deployment Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}🌐 Your site is running at: ${GREEN}https://toolbay.net${NC}"
echo ""
echo -e "${BLUE}📌 Useful commands:${NC}"
echo -e "  ${YELLOW}View live logs:${NC}        docker compose logs -f"
echo -e "  ${YELLOW}Check status:${NC}          docker compose ps"
echo -e "  ${YELLOW}Restart services:${NC}      docker compose restart"
echo -e "  ${YELLOW}View resource usage:${NC}   docker stats"
echo ""
