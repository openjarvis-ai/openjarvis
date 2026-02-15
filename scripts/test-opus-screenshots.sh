#!/bin/bash

# Test Opus workflow with screenshots
# Expected Opus workflow output:
# {
#   "decision": true/false,  // true = approved, false = needs re-request
#   "tools": [...],
#   "skills": [...]
# }

BASE_URL="http://localhost:3000"
WORKFLOW_ID="${1:-your-workflow-id-here}"

echo "🧪 Testing Opus Screenshot Workflow"
echo "===================================="
echo ""
echo "Workflow ID: $WORKFLOW_ID"
echo ""

# Create test screenshots
TMP_DIR="/tmp/opus-screenshots-$$"
mkdir -p "$TMP_DIR"

echo "📸 Generating 3 test screenshot images..."
for i in 1 2 3; do
  # Create minimal valid PNG (1x1 pixel)
  echo -n -e '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82' > "$TMP_DIR/screenshot-$i.png"
  echo "  ✓ Generated screenshot-$i.png"
done

echo ""
echo "=== Step 1: Send Screenshots to Opus ==="
echo ""

RESPONSE=$(curl -X POST "$BASE_URL/api/send-screenshots-to-opus" \
  -F "workflowId=$WORKFLOW_ID" \
  -F "recordingId=rec_test_$(date +%s)" \
  -F "screenshot1=@$TMP_DIR/screenshot-1.png" \
  -F "screenshot2=@$TMP_DIR/screenshot-2.png" \
  -F "screenshot3=@$TMP_DIR/screenshot-3.png" \
  --silent --show-error)

echo "$RESPONSE" | jq '.'

JOB_ID=$(echo "$RESPONSE" | jq -r '.jobExecutionId // empty')

if [ -z "$JOB_ID" ] || [ "$JOB_ID" == "null" ]; then
  echo ""
  echo "✗ Failed to initiate Opus job"
  rm -rf "$TMP_DIR"
  exit 1
fi

echo ""
echo "✓ Job initiated: $JOB_ID"
echo ""
echo "=== Step 2: Poll for Results ==="
echo ""

MAX_ATTEMPTS=20
POLL_INTERVAL=3

for attempt in $(seq 1 $MAX_ATTEMPTS); do
  echo "Attempt $attempt/$MAX_ATTEMPTS: Polling job $JOB_ID..."

  POLL_RESPONSE=$(curl -X POST "$BASE_URL/api/opus-poll" \
    -H "Content-Type: application/json" \
    -d "{
      \"jobExecutionId\": \"$JOB_ID\",
      \"workflowId\": \"$WORKFLOW_ID\"
    }" \
    --silent --show-error)

  STATUS=$(echo "$POLL_RESPONSE" | jq -r '.data.status // "unknown"')
  echo "  Status: $STATUS"

  if [ "$STATUS" == "COMPLETED" ]; then
    echo ""
    echo "✓ Job completed!"
    echo ""

    DECISION=$(echo "$POLL_RESPONSE" | jq -r '.data.decision')
    NEEDS_REREQUEST=$(echo "$POLL_RESPONSE" | jq -r '.data.needsReRequest')

    echo "Decision: $DECISION"
    echo "Needs Re-Request: $NEEDS_REREQUEST"
    echo ""

    if [ "$DECISION" == "true" ]; then
      echo "✅ Opus approved the generated tools/skills!"
    else
      echo "⚠️  Opus decision: false - Assets need re-request"
      echo ""
      echo "In the UI, this would automatically re-send the screenshots."
      echo "Manual re-request: Run this script again to simulate."
    fi

    echo ""
    echo "Full response:"
    echo "$POLL_RESPONSE" | jq '.'

    ASSET_COUNT=$(echo "$POLL_RESPONSE" | jq '.data.assets | length // 0')
    echo ""
    echo "Assets extracted: $ASSET_COUNT"

    if [ "$ASSET_COUNT" -gt 0 ]; then
      echo ""
      echo "Asset details:"
      echo "$POLL_RESPONSE" | jq '.data.assets[] | {type, name, status}'
    fi

    rm -rf "$TMP_DIR"
    exit 0
  fi

  if [ "$STATUS" == "FAILED" ]; then
    echo ""
    echo "✗ Job failed!"
    echo "$POLL_RESPONSE" | jq '.'
    rm -rf "$TMP_DIR"
    exit 1
  fi

  if [ $attempt -lt $MAX_ATTEMPTS ]; then
    echo "  Waiting ${POLL_INTERVAL}s..."
    sleep $POLL_INTERVAL
  fi
done

echo ""
echo "⚠ Max polling attempts reached."
rm -rf "$TMP_DIR"

echo ""
echo "Expected Opus workflow output format:"
echo "{"
echo "  \"decision\": true,  // or false to trigger re-request"
echo "  \"tools\": ["
echo "    {\"name\": \"tool_name\", ...}"
echo "  ],"
echo "  \"skills\": ["
echo "    {\"name\": \"skill_name\", ...}"
echo "  ]"
echo "}"
