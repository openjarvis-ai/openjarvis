/**
 * Opus Integration Test Script
 * Tests the send-to-opus API endpoint with various data formats
 * Prints all requests to console for verification
 */

// Mock fetch to intercept and log requests
const originalFetch = global.fetch;
const requestLog: Array<{ url: string; method: string; headers: Record<string, string>; body: unknown }> = [];

global.fetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
  const urlString = typeof url === 'string' ? url : url.toString();
  
  // Log the request
  const logEntry = {
    url: urlString,
    method: init?.method || 'GET',
    headers: init?.headers as Record<string, string> || {},
    body: init?.body ? JSON.parse(init.body as string) : null,
  };
  
  requestLog.push(logEntry);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📤 ${logEntry.method} ${urlString}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📋 Headers:');
  console.log(JSON.stringify(logEntry.headers, null, 2));
  console.log('\n📦 Body:');
  console.log(JSON.stringify(logEntry.body, null, 2));
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Mock successful responses from Opus
  if (urlString.includes('/job/initiate')) {
    return new Response(JSON.stringify({
      jobExecutionId: `job_exec_${Date.now()}`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (urlString.includes('/job/execute')) {
    return new Response(JSON.stringify({
      success: true,
      message: 'Job execution has been started',
      jobExecutionId: logEntry.body?.jobExecutionId || `job_exec_${Date.now()}`,
      jobPayloadSchemaInstance: logEntry.body?.jobPayloadSchemaInstance
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Fallback to original fetch for other URLs
  return originalFetch(url, init);
};

// Test data sets
const testCases = [
  {
    name: 'Test 1: Review Feedback Record',
    payload: {
      workflowId: 'wf_001',
      comment: JSON.stringify({
        date: '2025-01-15',
        reviewer_id: 'rev_12345',
        feedback_text: 'The assistant should provide more concise answers and avoid repeating the same information. It sometimes ignores user constraints, which leads to frustration.'
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
        active_applications: [
          'email_client',
          'web_browser',
          'text_editor'
        ]
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
          { image_file: 'screen_capture_002.png' },
          { image_file: 'screen_capture_003.png' }
        ]
      }),
      recordingId: 'rec_789'
    }
  },
  {
    name: 'Test 4: Plain Text Comment',
    payload: {
      workflowId: 'wf_004',
      comment: 'The workflow missed the step where I opened the dashboard.'
    }
  },
  {
    name: 'Test 5: Combined Data (All Formats)',
    payload: {
      workflowId: 'wf_005',
      comment: JSON.stringify({
        date: '2025-01-15',
        reviewer_id: 'rev_12345',
        feedback_text: 'Excellent workflow execution with good context.',
        timestamp: '2025-07-23T15:30',
        session_id: 'abc123-session',
        active_applications: ['email_client', 'web_browser'],
        screen_captures: [
          { image_file: 'screen_capture_001.png' }
        ]
      }),
      recordingId: 'rec_combined_001'
    }
  }
];

async function runTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║         OPUS INTEGRATION TEST - REQUEST INSPECTION                ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  console.log('\n');
  console.log('🔍 This test intercepts and logs all requests to Opus API');
  console.log('📝 Review the request format to ensure it matches Opus API specs');
  console.log('\n');

  // Set mock environment variable
  process.env.OPUS_SERVICE_KEY = 'test_service_key_12345';

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n\n${'='.repeat(70)}`);
    console.log(`🧪 ${testCase.name}`);
    console.log('='.repeat(70));
    console.log('\n📥 Input Payload:');
    console.log(JSON.stringify(testCase.payload, null, 2));

    try {
      // Make request to our API endpoint
      const response = await fetch('http://localhost:3000/api/send-to-opus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.payload)
      });

      const data = await response.json();
      
      console.log('\n✅ Response Status:', response.status);
      console.log('\n📨 Response Data:');
      console.log(JSON.stringify(data, null, 2));
      
    } catch (error) {
      console.error('\n❌ Error:', error);
    }
  }

  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                       TEST SUMMARY                                ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Total tests run: ${testCases.length}`);
  console.log(`📤 Total API requests logged: ${requestLog.length}`);
  console.log('\n📊 Request Breakdown:');
  
  const initiateRequests = requestLog.filter(r => r.url.includes('/job/initiate'));
  const executeRequests = requestLog.filter(r => r.url.includes('/job/execute'));
  
  console.log(`   - Initiate requests: ${initiateRequests.length}`);
  console.log(`   - Execute requests: ${executeRequests.length}`);
  
  console.log('\n✨ All requests have been logged above for inspection');
  console.log('\n');
}

// Run the tests
runTests().catch(console.error);
