// scripts/test-validation.ts
/**
 * Test script for input validation and ISO code detection.
 * Run with: npx ts-node scripts/test-validation.ts
 */

import { looksLikeISOCode, validateCountryName, redactPayloadForLogging } from "../src/utils/validation";

process.env.NODE_ENV = "development";

interface TestCase {
  name: string;
  input: string;
  shouldBeISO: boolean;
}

const isoTestCases: TestCase[] = [
  { name: "US (2-letter ISO)", input: "US", shouldBeISO: true },
  { name: "UK (2-letter ISO)", input: "UK", shouldBeISO: true },
  { name: "LK (2-letter ISO)", input: "LK", shouldBeISO: true },
  { name: "ESP (3-letter ISO)", input: "ESP", shouldBeISO: true },
  { name: "USA (3-letter ISO)", input: "USA", shouldBeISO: true },
  { name: "United States (full name)", input: "United States", shouldBeISO: false },
  { name: "Sri Lanka (full name)", input: "Sri Lanka", shouldBeISO: false },
  { name: "Spain (full name)", input: "Spain", shouldBeISO: false },
  { name: "United Kingdom (full name)", input: "United Kingdom", shouldBeISO: false },
  { name: "us (lowercase)", input: "us", shouldBeISO: false },
  { name: "uS (mixed case)", input: "uS", shouldBeISO: false },
  { name: "Empty string", input: "", shouldBeISO: false },
  { name: "Single letter", input: "A", shouldBeISO: false },
  { name: "Four letters", input: "USAA", shouldBeISO: false },
];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("🧪 Testing ISO Code Detection\n");

let passed = 0;
let failed = 0;

for (const testCase of isoTestCases) {
  try {
    const result = looksLikeISOCode(testCase.input);
    assert(
      result === testCase.shouldBeISO,
      `Expected ${testCase.shouldBeISO} for "${testCase.input}", got ${result}`
    );
    console.log(`✅ ${testCase.name}: "${testCase.input}" → ${result ? "ISO" : "Name"}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${testCase.name}: ${error instanceof Error ? error.message : String(error)}`);
    failed++;
  }
}

console.log(`\n📊 ISO Detection: ${passed} passed, ${failed} failed\n`);

// Test validateCountryName
console.log("🧪 Testing Country Name Validation\n");

const validationTests = [
  { name: "Valid: United States", input: "United States", shouldThrow: false },
  { name: "Valid: Sri Lanka", input: "Sri Lanka", shouldThrow: false },
  { name: "Invalid: US", input: "US", shouldThrow: true },
  { name: "Invalid: LK", input: "LK", shouldThrow: true },
  { name: "Invalid: ESP", input: "ESP", shouldThrow: true },
];

for (const test of validationTests) {
  try {
    validateCountryName(test.input, "testField");
    if (test.shouldThrow) {
      console.log(`❌ ${test.name}: Should have thrown but didn't`);
      failed++;
    } else {
      console.log(`✅ ${test.name}: Passed validation`);
      passed++;
    }
  } catch (error) {
    if (test.shouldThrow) {
      console.log(`✅ ${test.name}: Correctly rejected (${error instanceof Error ? error.message.substring(0, 60) : ""}...)`);
      passed++;
    } else {
      console.log(`❌ ${test.name}: Unexpectedly threw: ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }
  }
}

console.log(`\n📊 Validation: ${passed} passed, ${failed} failed\n`);

// Test payload redaction
console.log("🧪 Testing Payload Redaction\n");

const payloadTests = [
  {
    name: "Full payload with context",
    input: {
      nationality: "United States",
      destinationCountry: "Sri Lanka",
      travelPurpose: "tourism",
      plannedStartDate: "2026-06-01",
      plannedEndDate: "2026-06-15",
      additionalContext: "This is a very long additional context that should be truncated to 100 characters to prevent logging sensitive information in production environments"
    }
  },
  {
    name: "Minimal payload",
    input: {
      nationality: "Canada",
      destinationCountry: "France",
      travelPurpose: "business"
    }
  },
  {
    name: "With short context",
    input: {
      nationality: "UK",
      destinationCountry: "USA",
      travelPurpose: "study",
      additionalContext: "Short note"
    }
  }
];

for (const test of payloadTests) {
  console.log(`\n▶ ${test.name}`);
  const redacted = redactPayloadForLogging(test.input);
  console.log(JSON.stringify(redacted, null, 2));
  
  // Verify additionalContext is truncated if > 100 chars
  if (test.input.additionalContext && test.input.additionalContext.length > 100) {
    assert(
      redacted.additionalContext.length <= 103, // 100 chars + "..."
      "Context should be truncated"
    );
    assert(
      redacted.additionalContext.endsWith("..."),
      "Truncated context should end with ..."
    );
  }
}

console.log("\n✅ All payload redaction tests passed\n");

// Summary
console.log("─".repeat(50));
if (failed > 0) {
  console.log(`\n❌ ${failed} test(s) failed\n`);
  process.exit(1);
} else {
  console.log(`\n✅ All tests passed!\n`);
  process.exit(0);
}
