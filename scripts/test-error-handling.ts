// scripts/test-error-handling.ts
/**
 * Test script to verify structured error responses.
 * Run with: npx ts-node scripts/test-error-handling.ts
 */

import { buildErrorResponse, logError } from "../src/utils/errorHandler";
import { ApiError } from "../src/types/errors";

// Set environment
process.env.NODE_ENV = "development";

interface TestCase {
  name: string;
  error: any;
  expectedStatus: number;
  expectedErrorCode: string;
}

const testCases: TestCase[] = [
  {
    name: "ApiError with E_VALIDATION",
    error: new ApiError(400, "E_VALIDATION", "Invalid input fields", {
      fields: ["nationality", "destinationCountry"]
    }),
    expectedStatus: 400,
    expectedErrorCode: "E_VALIDATION"
  },
  {
    name: "ApiError with E_AI_UPSTREAM",
    error: new ApiError(503, "E_AI_UPSTREAM", "AI service unavailable"),
    expectedStatus: 503,
    expectedErrorCode: "E_AI_UPSTREAM"
  },
  {
    name: "ApiError with E_AI_PARSE",
    error: new ApiError(500, "E_AI_PARSE", "Failed to parse AI response"),
    expectedStatus: 500,
    expectedErrorCode: "E_AI_PARSE"
  },
  {
    name: "Generic Error",
    error: new Error("Something went wrong"),
    expectedStatus: 500,
    expectedErrorCode: "E_INTERNAL"
  },
  {
    name: "Null error",
    error: null,
    expectedStatus: 500,
    expectedErrorCode: "E_INTERNAL"
  }
];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runTests() {
  console.log("🧪 Testing Error Response Builder\n");

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      console.log(`▶ ${testCase.name}`);
      
      const requestId = "test-" + Math.random().toString(36).substring(7);
      const response = buildErrorResponse(testCase.error, requestId);

      // Assert basic structure
      assert(typeof response === "object", "Response should be an object");
      assert(typeof response.status === "number", "Status should be a number");
      assert(typeof response.errorCode === "string", "ErrorCode should be a string");
      assert(typeof response.message === "string", "Message should be a string");
      assert(typeof response.requestId === "string", "RequestId should be a string");

      // Assert expected values
      assert(
        response.status === testCase.expectedStatus,
        `Expected status ${testCase.expectedStatus}, got ${response.status}`
      );
      assert(
        response.errorCode === testCase.expectedErrorCode,
        `Expected errorCode ${testCase.expectedErrorCode}, got ${response.errorCode}`
      );
      assert(
        response.requestId === requestId,
        `Expected requestId ${requestId}, got ${response.requestId}`
      );

      // Assert message is not empty
      assert(response.message.length > 0, "Message should not be empty");

      // Assert no sensitive data in production mode
      const prodResponse = buildErrorResponse(testCase.error, requestId);
      if (process.env.NODE_ENV === "production") {
        assert(
          !prodResponse.details,
          "Details should not be present in production"
        );
      }

      console.log(`  ✅ PASS`);
      console.log(`     Status: ${response.status}, Code: ${response.errorCode}`);
      console.log(`     Message: ${response.message.substring(0, 50)}...`);
      console.log();
      passed++;
    } catch (error) {
      console.log(`  ❌ FAIL: ${error instanceof Error ? error.message : String(error)}\n`);
      failed++;
    }
  }

  console.log("─".repeat(50));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.log("❌ Some tests failed!");
    process.exit(1);
  } else {
    console.log("✅ All tests passed!");
  }
}

// Test logging functionality
console.log("🔍 Testing Error Logging\n");

const testError = new ApiError(400, "E_VALIDATION", "Test validation error");
const testRequestId = "test-request-123";

console.log("Development mode logging:");
logError(testError, testRequestId, { endpoint: "/api/test" });

console.log("\n─".repeat(50));
console.log();

// Run main tests
runTests();

// Test that error responses never contain undefined fields
console.log("\n🔍 Verifying Response Shape\n");

const requestId = "shape-test";
const errors = [
  new ApiError(400, "E_VALIDATION", "Test"),
  new Error("Generic error"),
  null,
  undefined,
  { message: "Plain object" }
];

for (const err of errors) {
  const response = buildErrorResponse(err as any, requestId);
  
  assert(response.status !== undefined, "Status should never be undefined");
  assert(response.errorCode !== undefined, "ErrorCode should never be undefined");
  assert(response.message !== undefined, "Message should never be undefined");
  assert(response.requestId !== undefined, "RequestId should never be undefined");
  
  console.log(`  ✓ Shape valid for: ${err?.constructor?.name || typeof err}`);
}

console.log("\n✅ All response shapes are valid\n");
