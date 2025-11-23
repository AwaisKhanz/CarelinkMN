#!/bin/bash

# Socket.IO Quick Test Script
# Run this to verify Socket.IO is working

echo "🔌 Socket.IO Quick Test"
echo "======================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if API server is running
echo "Test 1: Checking API server..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API server is running${NC}"
else
    echo -e "${RED}❌ API server is NOT running${NC}"
    echo -e "${YELLOW}   Start it with: npm run dev (in packages/api)${NC}"
    exit 1
fi

# Test 2: Check if Socket.IO endpoint responds
echo ""
echo "Test 2: Checking Socket.IO endpoint..."
if curl -s "http://localhost:3001/socket.io/?EIO=4&transport=polling" | grep -q "0{"; then
    echo -e "${GREEN}✅ Socket.IO endpoint is responding${NC}"
else
    echo -e "${RED}❌ Socket.IO endpoint not responding${NC}"
    exit 1
fi

# Test 3: Check if frontend is running
echo ""
echo "Test 3: Checking frontend..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend is NOT running${NC}"
    echo -e "${YELLOW}   Start it with: npm run dev (in apps/web)${NC}"
fi

echo ""
echo "======================="
echo -e "${GREEN}🎉 Basic checks passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Open DevTools (F12)"
echo "3. Go to Console tab"
echo "4. Look for: '✅ Socket connected'"
echo ""
echo "For detailed testing, see: socket-io-testing-guide.md"
