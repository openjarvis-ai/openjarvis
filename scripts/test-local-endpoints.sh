#!/bin/bash

# Test local API endpoints without calling external Opus API

BASE_URL="http://localhost:3000"

echo "🧪 Testing Local API Endpoints"
echo "=============================="
echo ""

# Test 1: OpenClaw Connection Status
echo "=== Test 1: OpenClaw Connection Status ==="
curl -X GET "$BASE_URL/api/openclaw/connect" --silent | jq '.'
echo ""

# Test 2: OpenClaw Connect (should fail gracefully if OpenClaw not running)
echo ""
echo "=== Test 2: OpenClaw Connect ==="
curl -X POST "$BASE_URL/api/openclaw/connect" \
  -H "Content-Type: application/json" \
  -d '{"action": "connect"}' \
  --silent | jq '.'
echo ""

# Test 3: Screenshot Upload
echo ""
echo "=== Test 3: Screenshot Upload ==="

# Create minimal test PNGs
TMP_DIR="/tmp/test-screenshots-$$"
mkdir -p "$TMP_DIR"

for i in 1 2; do
  echo -n -e '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82' > "$TMP_DIR/test-$i.png"
done

curl -X POST "$BASE_URL/api/send-screenshots-to-opus" \
  -F "workflowId=test-wf-001" \
  -F "recordingId=rec-test-001" \
  -F "screenshot1=@$TMP_DIR/test-1.png" \
  -F "screenshot2=@$TMP_DIR/test-2.png" \
  --silent | jq '.'

rm -rf "$TMP_DIR"
echo ""

# Test 4: Fetch workflows
echo ""
echo "=== Test 4: Fetch Workflows ==="
curl -X GET "$BASE_URL/api/workflows" --silent | jq '.data | length' | xargs echo "Workflow count:"
echo ""

# Test 5: Dashboard stats
echo ""
echo "=== Test 5: Dashboard Stats ==="
curl -X GET "$BASE_URL/api/dashboard" --silent | jq '.data.stats'
echo ""

echo ""
echo "✅ All local endpoint tests completed!"
echo ""
echo "Note: To test full Opus integration:"
echo "1. Get your Opus workflow ID from https://operator.opus.com"
echo "2. Run: ./scripts/test-opus.sh <your-workflow-id>"
