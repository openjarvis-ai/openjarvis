/**
 * Simple Opus Integration Test Script (Standalone Node.js)
 * Run with: node test-opus-simple.js
 * 
 * This script tests the send-to-opus endpoint without needing the full Next.js server
 * It directly tests the API logic and prints all Opus API calls to console
 */

// Simulate the API route logic
const OPUS_BASE_URL = "https://operator.opus.com";

// Mock data for testing
const testCases = [
  {
    name: 'Test 1: Review Feedback Record',
    payload: {
      workflowId: 'wf_001',
      comment: JSON.stringify({
        date: '2025-01-15',
        reviewer_id: 'rev_12345',
        feedback_text: 'The assistant should provide more concise answers and avoid repeating the same information.'
      }),
      recordingId: 'rec_456'
    }
  },
  {
    name: 'Test 2: Session Metadata',
    payload: {
      workflowId: 'wf_002',
      comment: JSON.stringify({
        timestamp: '2025-07-23T15:30',
        session_id: 'abc123-session',
        active_applications: ['email_client', 'web_browser', 'text_editor']
      })
    }
  },
  {
    name: 'Test 3: Screen Capture Images',
    payload: {
      workflowId: 'wf_003',
      comment: JSON.stringify({
        screen_captures: [
          { image_file: 'screen_capture_001.png' },
          { image_file: 'screen_capture_002.png' }
        ]
      })
    }
  },
  {
    name: 'Test 4: Plain Text Comment',
    payload: {
      workflowId: 'wf_004',
      comment: 'The workflow missed the step where I opened the dashboard.'
    }
  }
];

// Parse comment to Opus payload (same logic as route.ts)
function parseCommentToOpusPayload(comment) {
  const payload = {};

  try {
    const jsonData = JSON.parse(comment);
    
    if (jsonData.date && jsonData.reviewer_id && jsonData.feedback_text) {
      payload.reviewFeedback = {
        date: jsonData.date,
        reviewer_id: jsonData.reviewer_id,
        feedback_text: jsonData.feedback_text,
      };
    }
    
    if (jsonData.timestamp && jsonData.session_id && jsonData.active_applications) {
      payload.sessionMetadata = {
        timestamp: jsonData.timestamp,
        session_id: jsonData.session_id,
        active_applications: Array.isArray(jsonData.active_applications) 
          ? jsonData.active_applications 
          : [],
      };
    }
    
    if (jsonData.screen_captures && Array.isArray(jsonData.screen_captures)) {
      payload.screenCaptures = jsonData.screen_captures.map(capture => ({
        image_file: capture.image_file,
      }));
    }
  } catch {
    payload.reviewFeedback = {
      date: new Date().toISOString().split('T')[0],
      reviewer_id: "unknown",
      feedback_text: comment,
    };
  }

  return payload;
}

// Build job payload schema instance (same logic as route.ts)
function buildJobPayloadSchemaInstance(payload) {
  const schemaInstance = {};

  if (payload.reviewFeedback) {
    schemaInstance.review_feedback = {
      value: payload.reviewFeedback,
      type: "object",
      displayName: "Review Feedback Record",
    };
  }

  if (payload.sessionMetadata) {
    schemaInstance.session_metadata = {
      value: payload.sessionMetadata,
      type: "object",
      displayName: "Session Metadata",
    };
  }

  if (payload.screenCaptures) {
    schemaInstance.screen_captures = {
      value: payload.screenCaptures,
      type: "array",
      displayName: "Screen Capture Images",
    };
  }

  return schemaInstance;
}

// Print formatted request
function printRequest(label, url, headers, body) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📤 ${label}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n🌐 URL: POST ${url}`);
  console.log('\n📋 Headers:');
  console.log(JSON.stringify(headers, null, 2));
  console.log('\n📦 Body:');
  console.log(JSON.stringify(body, null, 2));
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run tests
function runTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║         OPUS INTEGRATION TEST - REQUEST INSPECTION                ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  console.log('\n');
  console.log('🔍 This test shows exactly what requests would be sent to Opus API');
  console.log('📝 Review the request format to ensure it matches Opus API specs');
  console.log('🔑 Make sure to set OPUS_SERVICE_KEY in your .env.local file');
  console.log('\n');

  const serviceKey = 'your_opus_service_key_here'; // Would come from process.env.OPUS_SERVICE_KEY

  testCases.forEach((testCase, index) => {
    console.log(`\n\n${'='.repeat(70)}`);
    console.log(`🧪 ${testCase.name}`);
    console.log('='.repeat(70));
    console.log('\n📥 Input Payload:');
    console.log(JSON.stringify(testCase.payload, null, 2));

    // Parse the comment
    const opusPayload = parseCommentToOpusPayload(testCase.payload.comment);
    const jobPayloadSchemaInstance = buildJobPayloadSchemaInstance(opusPayload);

    console.log('\n🔄 Parsed Opus Payload:');
    console.log(JSON.stringify(opusPayload, null, 2));

    // Mock jobExecutionId
    const mockJobExecutionId = `job_exec_test_${index + 1}_${Date.now()}`;

    // Step 1: Initiate Request
    const initiateRequestHeaders = {
      'Content-Type': 'application/json',
      'x-service-key': serviceKey
    };
    
    const initiateRequestBody = {
      workflowId: testCase.payload.workflowId,
      title: `OpenJarvis Feedback - ${testCase.payload.recordingId || 'Manual Entry'}`,
      description: `Feedback submission from OpenJarvis at ${new Date().toISOString()}`
    };

    printRequest(
      'STEP 1: Initiate Job Request',
      `${OPUS_BASE_URL}/job/initiate`,
      initiateRequestHeaders,
      initiateRequestBody
    );

    // Step 2: Execute Request
    const executeRequestHeaders = {
      'Content-Type': 'application/json',
      'x-service-key': serviceKey
    };
    
    const executeRequestBody = {
      jobExecutionId: mockJobExecutionId,
      jobPayloadSchemaInstance
    };

    printRequest(
      'STEP 2: Execute Job Request',
      `${OPUS_BASE_URL}/job/execute`,
      executeRequestHeaders,
      executeRequestBody
    );
  });

  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                       TEST SUMMARY                                ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Total test cases: ${testCases.length}`);
  console.log(`📤 Total API requests shown: ${testCases.length * 2} (${testCases.length} initiate + ${testCases.length} execute)`);
  console.log('\n💡 Tips:');
  console.log('   - Verify the x-service-key header is correct');
  console.log('   - Check that workflowId matches a valid Opus workflow');
  console.log('   - Ensure jobPayloadSchemaInstance format matches Opus API specs');
  console.log('   - Review the type and displayName fields for each variable');
  console.log('\n✨ All requests have been logged above for inspection');
  console.log('\n');
}

// Run the tests
runTests();
