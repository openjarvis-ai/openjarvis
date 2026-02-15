#!/bin/bash

# Test script for Opus workflow integration
# Usage: ./scripts/test-opus.sh <workflow-id>

BASE_URL="http://localhost:3000"
WORKFLOW_ID="${1:-your-workflow-id-here}"
RECORDING_ID="rec_test_$(date +%s)"

echo "🧪 Testing Opus Integration Flow"
echo "================================"
echo ""
echo "Workflow ID: $WORKFLOW_ID"
echo "Recording ID: $RECORDING_ID"
echo ""

# Create a temporary directory for test screenshots
TMP_DIR="/tmp/opus-test-screenshots-$$"
mkdir -p "$TMP_DIR"

echo "📸 Generating fake screenshot images..."
# Generate 3 simple PNG files using ImageMagick (if available) or create minimal PNGs
for i in 1 2 3; do
  OUTPUT="$TMP_DIR/screenshot-$i.png"

  if command -v convert &> /dev/null; then
    # Use ImageMagick to create a proper image
    convert -size 800x600 \
      -background "gradient:#667eea-#764ba2" \
      -gravity center \
      -pointsize 48 -fill white \
      -annotate +0+0 "Screenshot $i\n$(date)" \
      "$OUTPUT"
    echo "  ✓ Generated $OUTPUT (ImageMagick)"
  else
    # Create a minimal valid PNG (1x1 pixel)
    # PNG header + IHDR + IDAT + IEND chunks
    echo -n -e '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82' > "$OUTPUT"
    echo "  ✓ Generated $OUTPUT (minimal PNG)"
  fi
done

echo ""
echo "=== Test 1: Send Screenshots to Opus ==="
echo ""

# Test screenshot upload endpoint
curl -X POST "$BASE_URL/api/send-screenshots-to-opus" \
  -F "workflowId=$WORKFLOW_ID" \
  -F "recordingId=$RECORDING_ID" \
  -F "screenshot1=@$TMP_DIR/screenshot-1.png" \
  -F "screenshot2=@$TMP_DIR/screenshot-2.png" \
  -F "screenshot3=@$TMP_DIR/screenshot-3.png" \
  --silent --show-error | jq '.'

echo ""
echo ""
echo "=== Test 2: Send Comment to Opus (Initiate + Execute Job) ==="
echo ""

# Send comment to initiate Opus job
RESPONSE=$(curl -X POST "$BASE_URL/api/send-to-opus" \
  -H "Content-Type: application/json" \
  -d "{
    \"workflowId\": \"$WORKFLOW_ID\",
    \"comment\": \"Test feedback from automated script: The workflow should include error handling and user authentication steps.\",
    \"recordingId\": \"$RECORDING_ID\"
  }" \
  --silent --show-error)

echo "$RESPONSE" | jq '.'

# Extract job ID
JOB_ID=$(echo "$RESPONSE" | jq -r '.opusJobId // empty')

if [ -z "$JOB_ID" ] || [ "$JOB_ID" == "null" ]; then
  echo ""
  echo "✗ Failed to get job ID from response"
  rm -rf "$TMP_DIR"
  exit 1
fi

echo ""
echo "✓ Job initiated: $JOB_ID"
echo ""
echo "=== Test 3: Poll Opus Job Status ==="
echo ""

# Poll for job completion (max 10 attempts, 3 seconds apart)
MAX_ATTEMPTS=10
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
    echo "  Waiting ${POLL_INTERVAL}s before next poll..."
    sleep $POLL_INTERVAL
  fi
done

echo ""
echo "⚠ Max polling attempts reached. Job may still be running."
echo ""
echo "Check status manually:"
echo "curl -X POST $BASE_URL/api/opus-poll \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"jobExecutionId\": \"$JOB_ID\", \"workflowId\": \"$WORKFLOW_ID\"}' | jq '.'"

rm -rf "$TMP_DIR"
