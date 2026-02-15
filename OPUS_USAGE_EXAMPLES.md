# Opus Integration Usage Examples

This document provides examples of how to send different types of data to the Opus API via the `/api/send-to-opus` and `/api/send-screenshots-to-opus` endpoints.

## Prerequisites

1. Set your `OPUS_SERVICE_KEY` in `.env.local`
2. The workflow ID is hardcoded to `m610yMivI2rx2Sdy` in the API routes

**Note:** Both API endpoints now use a hardcoded workflow ID (`m610yMivI2rx2Sdy`). Any `workflowId` parameter passed in requests will be ignored.

## Sending Screenshots

Use the `/api/send-screenshots-to-opus` endpoint to upload multiple screenshot files directly to Opus. Files are uploaded using the Opus file upload API and passed as `array_files` type.

```typescript
const formData = new FormData();
// workflowId is hardcoded in the API, no need to pass it
formData.append('recordingId', 'rec_123'); // Optional

// Add screenshot files
screenshotFiles.forEach((file, index) => {
  formData.append(`screenshot_${index}`, file);
});

const response = await fetch('/api/send-screenshots-to-opus', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log(data);
// {
//   "success": true,
//   "message": "Screenshots sent to Opus successfully.",
//   "batchId": "screens_xyz123",
//   "count": 5,
//   "workflowId": "m610yMivI2rx2Sdy",
//   "recordingId": "rec_123",
//   "timestamp": "2026-02-15T10:30:00Z",
//   "opusJobId": "job_exec_abc123"
// }
```

## Sending Comments and Structured Data

## Example 1: Review Feedback Record

Send structured review feedback with date, reviewer ID, and feedback text.

```typescript
const response = await fetch('/api/send-to-opus', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    comment: JSON.stringify({
      date: '2025-01-15',
      reviewer_id: 'rev_12345',
      feedback_text: 'The assistant should provide more concise answers and avoid repeating the same information. It sometimes ignores user constraints, which leads to frustration.'
    }),
    recordingId: 'rec_456' // optional
  })
});

const data = await response.json();
console.log(data);
// {
//   "success": true,
//   "message": "Feedback sent to Opus successfully.",
//   "commentId": "job_exec_abc123",
//   "timestamp": "2026-02-15T10:30:00Z",
//   "opusJobId": "job_exec_abc123"
// }
```

## Example 2: Session Metadata

Send user session metadata with timestamp, session ID, and active applications.

```typescript
const response = await fetch('/api/send-to-opus', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    comment: JSON.stringify({
      timestamp: '2025-07-23T15:30',
      session_id: 'abc123-session',
      active_applications: [
        'email_client',
        'web_browser',
        'text_editor'
      ]
    })
  })
});
```

## Example 3: Screen Capture Images

Send a list of screen capture image files.

```typescript
const response = await fetch('/api/send-to-opus', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    comment: JSON.stringify({
      screen_captures: [
        { image_file: 'screen_capture_001.png' },
        { image_file: 'screen_capture_002.png' },
        { image_file: 'screen_capture_003.png' }
      ]
    }),
    recordingId: 'rec_789'
  })
});
```

## Example 4: Plain Text Comment

Send a simple plain text comment (automatically converted to Review Feedback format).

```typescript
const response = await fetch('/api/send-to-opus', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    comment: 'The workflow missed the step where I opened the dashboard.'
  })
});
```

This will be automatically converted to:
```json
{
  "date": "2026-02-15",
  "reviewer_id": "unknown",
  "feedback_text": "The workflow missed the step where I opened the dashboard."
}
```

## Example 5: Combined Data (Multiple Formats)

Send multiple data types in a single request.

```typescript
const response = await fetch('/api/send-to-opus', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    comment: JSON.stringify({
      // Review Feedback
      date: '2025-01-15',
      reviewer_id: 'rev_12345',
      feedback_text: 'Excellent workflow execution.',
      
      // Session Metadata
      timestamp: '2025-07-23T15:30',
      session_id: 'abc123-session',
      active_applications: ['email_client', 'web_browser'],
      
      // Screen Captures
      screen_captures: [
        { image_file: 'screen_capture_001.png' }
      ]
    })
  })
});
```

## Error Handling

Always handle potential errors:

```typescript
try {
  const response = await fetch('/api/send-to-opus', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      comment: 'My feedback'
    })
  });

  const data = await response.json();

  if (!data.success) {
    console.error('Failed to send to Opus:', data.message);
    // Handle error (show toast, retry, etc.)
  } else {
    console.log('Successfully sent to Opus:', data.opusJobId);
    // Handle success
  }
} catch (error) {
  console.error('Network error:', error);
  // Handle network error
}
```

## Common Error Messages

- `"comment is required and must be a non-empty string."` - Missing or empty comment
- `"comment must be 2000 characters or fewer."` - Comment too long
- `"Opus service is not properly configured."` - Missing OPUS_SERVICE_KEY in environment
- `"Failed to initiate Opus job"` - Opus API initiation failed (check service key and network connection)
- `"Failed to execute Opus job"` - Opus API execution failed (check payload format)
- `"Unable to parse comment into valid Opus data format."` - Invalid JSON or unsupported format
- `"Workflow m610yMivI2rx2Sdy is not accessible in workspace"` - Hardcoded workflow ID not accessible (403 error, check Opus workspace access)

## Testing with cURL

```bash
# Review Feedback
curl -X POST http://localhost:3000/api/send-to-opus \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "{\"date\":\"2025-01-15\",\"reviewer_id\":\"rev_12345\",\"feedback_text\":\"Great work!\"}"
  }'

# Plain Text
curl -X POST http://localhost:3000/api/send-to-opus \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "The workflow is missing a step."
  }'

# Upload Screenshots  
curl -X POST http://localhost:3000/api/send-screenshots-to-opus \
  -F "recordingId=rec_123" \
  -F "screenshot_0=@/path/to/screenshot1.png" \
  -F "screenshot_1=@/path/to/screenshot2.png"
```
```

## Monitoring Job Execution

After sending data to Opus, you can monitor the job execution using the returned `opusJobId`:

```typescript
const { opusJobId } = await sendToOpus();

// Poll for job status (implement your own polling logic)
const statusResponse = await fetch(
  `https://operator.opus.com/job/${opusJobId}/status`,
  {
    headers: {
      'x-service-key': process.env.OPUS_SERVICE_KEY
    }
  }
);

const status = await statusResponse.json();
console.log('Job status:', status);
```

## API Reference

For complete Opus API documentation, visit:
- [Opus API Reference](https://developer.opus.com/api-reference/introduction)
- [Job Execution Flow](https://developer.opus.com/api-reference/jobs/execute-job)
