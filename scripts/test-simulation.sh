#!/bin/bash

echo "🧪 Testing Opus Simulation Flow"
echo "================================"
echo ""

echo "Test 1: Simulate Opus with decision=true (auto-approve)"
echo "This will:"
echo "  1. Create a workflow with 2 tools + 1 skill"
echo "  2. Store assets in database"
echo "  3. Attempt to push to OpenClaw (if connected)"
echo ""

read -p "Press Enter to run simulation..."

curl -X POST 'http://localhost:3000/api/test-opus-simulation' \
  -H 'Content-Type: application/json' \
  -d '{"decision":true}' \
  --max-time 10 \
  2>&1 | python3 -m json.tool

echo ""
echo ""
echo "Check the workflows page to see the generated workflow!"
echo "Go to: http://localhost:3000/workflows"
