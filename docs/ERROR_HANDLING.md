# Error Handling Documentation

## Error Response Format

All API errors return a structured JSON response with the following shape:

```typescript
{
  "status": number,        // HTTP status code
  "errorCode": string,     // Specific error code (see below)
  "message": string,       // User-safe error message
  "requestId": string,     // Unique request identifier
  "details"?: any         // Additional details (DEV ONLY)
}
```

### Response Headers
- `x-request-id`: Unique identifier for the request (useful for debugging)

## Error Codes

### `E_VALIDATION` (400)
**Cause**: Invalid input data
**User Message**: "Invalid input. Please check nationality, destinationCountry, and travelPurpose fields."
**Resolution**: Check request body for required fields and valid format

### `E_METHOD_NOT_ALLOWED` (405)
**Cause**: Wrong HTTP method used
**User Message**: "Method not allowed. Use POST."
**Resolution**: Use POST method instead of GET, PUT, etc.

### `E_AI_UPSTREAM` (503)
**Cause**: AI service (OpenAI) is unavailable or returned an error
**User Message**: "Unable to process visa evaluation at this time. Please try again."
**Resolution**: Retry the request. If problem persists, check AI service status

### `E_AI_PARSE` (500)
**Cause**: Failed to parse or validate AI response
**User Message**: "Unable to parse visa evaluation results. Please try again."
**Resolution**: Retry the request. This indicates AI returned unexpected format

### `E_INTERNAL` (500)
**Cause**: Unexpected server error
**User Message**: "An unexpected error occurred"
**Resolution**: Check server logs using requestId for details

## Development vs Production

### Development Mode
- Error responses include `details` field with:
  - Stack traces
  - Original error messages
  - Additional debugging information
- Console logs include full error details

### Production Mode
- No `details` field in responses
- Console logs are structured JSON without stack traces
- User-safe messages only

## Request Tracking

Every request receives a unique `requestId` (UUID v4) that is:
1. Generated at the start of the request
2. Included in the response (both success and error)
3. Added to response headers as `x-request-id`
4. Logged with all error messages

Use the `requestId` to trace issues in logs:
```bash
grep "requestId-here" logs.txt
```

## Example Error Responses

### Validation Error
```json
{
  "status": 400,
  "errorCode": "E_VALIDATION",
  "message": "Invalid input. Please check nationality, destinationCountry, and travelPurpose fields.",
  "requestId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "nationality": ["String must contain at least 2 character(s)"]
    }
  }
}
```

### AI Service Error
```json
{
  "status": 503,
  "errorCode": "E_AI_UPSTREAM",
  "message": "Unable to process visa evaluation at this time. Please try again.",
  "requestId": "a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p"
}
```

## Testing Error Handling

Run the error handling test suite:
```bash
npx ts-node scripts/test-error-handling.ts
```

This verifies:
- All error codes produce valid responses
- Request IDs are included
- Production mode hides sensitive data
- Response shape is consistent
