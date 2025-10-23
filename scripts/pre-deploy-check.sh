#!/bin/bash

# Pre-Deployment Checklist for Vercel
# Run this before deploying to catch common issues

echo "🚀 Vercel Pre-Deployment Checklist"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track issues
ISSUES=0

# 1. Check if .env exists
echo "1. Checking for .env file..."
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} .env file found"
else
    echo -e "${RED}✗${NC} .env file not found (this is OK - Vercel uses dashboard for env vars)"
fi
echo ""

# 2. Check if required env vars are in .env (for reference)
echo "2. Checking .env.example exists..."
if [ -f .env.example ]; then
    echo -e "${GREEN}✓${NC} .env.example found"
else
    echo -e "${YELLOW}⚠${NC} .env.example not found"
fi
echo ""

# 3. Check if build works locally
echo "3. Testing local build..."
if bun run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Build succeeds locally"
else
    echo -e "${RED}✗${NC} Build fails locally - fix this before deploying!"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# 4. Check for node_modules
echo "4. Checking node_modules..."
if [ -d node_modules ]; then
    echo -e "${GREEN}✓${NC} node_modules exists (will be ignored by .gitignore)"
else
    echo -e "${YELLOW}⚠${NC} node_modules not found - run 'bun install' first"
fi
echo ""

# 5. Check .gitignore
echo "5. Checking .gitignore..."
if [ -f .gitignore ]; then
    if grep -q "node_modules" .gitignore && grep -q ".env" .gitignore; then
        echo -e "${GREEN}✓${NC} .gitignore properly configured"
    else
        echo -e "${YELLOW}⚠${NC} .gitignore might be missing important entries"
    fi
else
    echo -e "${RED}✗${NC} .gitignore not found!"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# 6. Check package.json scripts
echo "6. Checking package.json scripts..."
if grep -q "\"build\":" package.json && grep -q "\"start\":" package.json; then
    echo -e "${GREEN}✓${NC} Build and start scripts found"
else
    echo -e "${RED}✗${NC} Missing required scripts in package.json"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# 7. Check for vercel.json
echo "7. Checking vercel.json..."
if [ -f vercel.json ]; then
    echo -e "${GREEN}✓${NC} vercel.json found"
else
    echo -e "${YELLOW}⚠${NC} vercel.json not found (optional but recommended)"
fi
echo ""

# 8. Check TypeScript compilation
echo "8. Checking TypeScript..."
if bun run generate:types > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} TypeScript types generated successfully"
else
    echo -e "${YELLOW}⚠${NC} Type generation had issues (check manually)"
fi
echo ""

# Summary
echo "=================================="
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready to deploy to Vercel${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Ensure all environment variables are added to Vercel Dashboard"
    echo "2. Push your code to GitHub"
    echo "3. Import project in Vercel"
    echo "4. Deploy!"
else
    echo -e "${RED}✗ Found $ISSUES issue(s). Please fix before deploying.${NC}"
fi
echo ""
