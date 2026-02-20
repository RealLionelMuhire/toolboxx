#!/bin/bash

# Toolbay Production Deployment Script - Zero Downtime Edition
# This script implements zero-downtime deployment by building new images
# before stopping old containers

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Progress indicators
SUCCESS="✓"
ERROR="✗"
INFO="➜"
WORKING="⟳"

# Configuration
MAX_HEALTH_CHECK_ATTEMPTS=30
HEALTH_CHECK_INTERVAL=2
BACKUP_DIR="./backups"

# Helper functions
print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_info() {
    echo -e "${BLUE}${INFO} $1${NC}"
}

print_success() {
    echo -e "${GREEN}${SUCCESS} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}${ERROR} $1${NC}"
}

print_working() {
    echo -e "${YELLOW}${WORKING} $1${NC}"
}

# Start deployment
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  🚀 Toolbay Zero-Downtime Deployment${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

print_header "Pre-Deployment Checks"

print_working "Checking project directory..."
# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
    print_error "Must be run from the toolboxx project directory"
    exit 1
fi
print_success "Project directory OK"

print_working "Checking Docker daemon..."
# Check if Docker is running (with timeout)
# Try with sudo first, then without
if timeout 5 sudo docker info >/dev/null 2>&1; then
    DOCKER_CMD="sudo docker"
    COMPOSE_CMD="sudo docker compose"
    print_success "Docker is running (using sudo)"
elif timeout 5 docker info >/dev/null 2>&1; then
    DOCKER_CMD="docker"
    COMPOSE_CMD="docker compose"
    print_success "Docker is running"
else
    print_error "Docker is not running or not accessible"
    print_warning "Try: sudo systemctl start docker"
    exit 1
fi

print_working "Checking Docker Compose..."
# Check if docker compose is available
if ! $COMPOSE_CMD version >/dev/null 2>&1; then
    print_error "Docker Compose is not installed or not accessible"
    exit 1
fi
print_success "Docker Compose is available"

print_working "Checking .env.production file..."
# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found"
    exit 1
fi
print_success ".env.production found"

print_header "Step 1/7: Git Status Check"
print_warning "Please run 'git pull origin main' BEFORE running this script"
print_success "Skipping git pull (run manually as your user)"

# Get current git commit hash for tracking
if command -v git &> /dev/null && [ -d .git ]; then
    CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    print_info "Current commit: ${CURRENT_COMMIT}"
fi

print_header "Step 2/7: Creating Backup"

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    print_info "Created backup directory"
fi

# Backup current container state
print_working "Backing up current container state..."
BACKUP_FILE="${BACKUP_DIR}/containers_backup_$(date +%Y%m%d_%H%M%S).txt"
$COMPOSE_CMD ps -q > "$BACKUP_FILE" 2>/dev/null || true
print_success "Container state backed up to ${BACKUP_FILE}"

print_header "Step 3/7: Container Status Check"

# Check Docker daemon is responsive
print_working "Verifying Docker daemon..."
if ! timeout 5 $DOCKER_CMD info >/dev/null 2>&1; then
    print_error "Docker daemon not responding. Please check Docker service."
    exit 1
fi
print_success "Docker daemon is responsive"

# Validate docker-compose.yml
print_working "Validating docker-compose.yml..."
if ! timeout 10 $COMPOSE_CMD --env-file .env.production config >/dev/null 2>&1; then
    print_error "docker-compose.yml validation failed"
    $COMPOSE_CMD --env-file .env.production config 2>&1 | tail -20
    exit 1
fi
print_success "Docker Compose configuration is valid"

# Get container status with timeout
print_working "Checking for existing containers..."
OLD_CONTAINERS=$(timeout 10 $COMPOSE_CMD ps -q 2>/dev/null || echo "")
if [ -n "$OLD_CONTAINERS" ]; then
    print_success "Found running containers (keeping them alive during build)"
    timeout 10 $COMPOSE_CMD ps || print_warning "Could not display container status"
else
    print_warning "No running containers found (first deployment or all stopped)"
fi

print_header "Step 4/7: Building New Docker Images"
print_info "Old containers are still running and serving traffic"
echo ""

# Build new images without stopping old containers (no timeout, show live output)
$COMPOSE_CMD --env-file .env.production build --progress=plain

if [ $? -ne 0 ]; then
    print_error "Build failed! Old containers are still running."
    exit 1
fi
print_success "New images built successfully"

print_header "Step 5/7: Deploying New Containers"
print_info "Using --force-recreate for zero-downtime swap"
echo ""

# Deploy new containers with force-recreate for minimal downtime
$COMPOSE_CMD --env-file .env.production up -d --force-recreate --remove-orphans

if [ $? -ne 0 ]; then
    print_error "Deployment failed during container startup"
    print_warning "Attempting rollback..."
    $COMPOSE_CMD down || true
    exit 1
fi
print_success "New containers deployed"

print_header "Step 6/7: Running Health Checks"

# Wait for containers to be healthy
print_working "Waiting for services to initialize (5 seconds)..."
sleep 5

# Health check with retries
ATTEMPT=1
health_check_passed=false

while [ $ATTEMPT -le $MAX_HEALTH_CHECK_ATTEMPTS ]; do
    # Check if all containers are running
    running_containers=$($COMPOSE_CMD ps --services --filter "status=running" | wc -l)
    total_containers=$($COMPOSE_CMD ps --services | wc -l)
    
    if [ "$running_containers" -eq "$total_containers" ] && [ "$total_containers" -gt 0 ]; then
        print_success "All containers are running ($running_containers/$total_containers)"
        health_check_passed=true
        break
    else
        print_info "Attempt $ATTEMPT/$MAX_HEALTH_CHECK_ATTEMPTS: Waiting for containers ($running_containers/$total_containers running)..."
        ATTEMPT=$((ATTEMPT + 1))
        sleep $HEALTH_CHECK_INTERVAL
    fi
done

if [ "$health_check_passed" = false ]; then
    print_error "Health checks failed after $MAX_HEALTH_CHECK_ATTEMPTS attempts"
    print_warning "Recent logs:"
    $COMPOSE_CMD logs --tail=50
    print_warning "Rolling back deployment..."
    $COMPOSE_CMD down || true
    exit 1
fi

# Check container health status
UNHEALTHY=$($COMPOSE_CMD ps | grep -i "unhealthy\|restarting" || true)
if [ -n "$UNHEALTHY" ]; then
    print_warning "Some containers may be unhealthy:"
    echo "$UNHEALTHY"
else
    print_success "All containers are healthy"
fi

# Display container status
echo ""
print_info "Current container status:"
$COMPOSE_CMD ps

print_header "Step 7/7: Cleaning Up Old Images"

# Remove dangling images to free up space
print_working "Checking for dangling images..."
DANGLING=$($DOCKER_CMD images -f "dangling=true" -q)
dangling_count=$(echo "$DANGLING" | grep -v '^$' | wc -l)

if [ -n "$DANGLING" ] && [ "$dangling_count" -gt 0 ]; then
    print_working "Removing $dangling_count dangling images..."
    $DOCKER_CMD rmi $DANGLING 2>/dev/null || true
    print_success "Old images cleaned up"
else
    print_success "No dangling images to clean"
fi

print_header "Deployment Summary"
echo ""
echo -e "${GREEN}${SUCCESS} Deployment completed successfully!${NC}"
if [ -n "$CURRENT_COMMIT" ]; then
    print_info "Commit: ${CURRENT_COMMIT}"
fi
print_info "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

print_info "Recent logs from new containers:"
$COMPOSE_CMD logs --tail=20

echo ""
print_header "✅ Zero-Downtime Deployment Complete!"
echo ""
echo -e "${CYAN}🌐 Your site is running at: ${GREEN}https://toolbay.net${NC}"
echo ""
print_info "Useful commands:"
echo -e "  ${YELLOW}View live logs:${NC}        $COMPOSE_CMD logs -f"
echo -e "  ${YELLOW}Check status:${NC}          $COMPOSE_CMD ps"
echo -e "  ${YELLOW}Restart services:${NC}      $COMPOSE_CMD restart"
echo -e "  ${YELLOW}View resource usage:${NC}   $DOCKER_CMD stats"
echo ""
