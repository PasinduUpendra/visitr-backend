// scripts/test-ai-parse.ts
/**
 * Standalone test script for AI JSON parsing.
 * Run with: npx ts-node scripts/test-ai-parse.ts
 */

// Mock environment BEFORE importing
process.env.OPENAI_API_KEY = "test-key-for-parsing";
process.env.OPENAI_MODEL = "gpt-4";
process.env.NODE_ENV = "development";

import { AiClient } from "../src/services/AiClient";

// Access private method for testing
class AiClientTestable extends AiClient {
  public testParseResponse(text: string, cacheKey?: string) {
    return (this as any).parseResponse(text, cacheKey);
  }
}

interface TestCase {
  name: string;
  input: string;
  expectedVerdict: "VISA_FREE" | "VISA_REQUIRED" | "CHECK_NEEDED";
  assertions: (result: any) => void;
}

const testCases: TestCase[] = [
  {
    name: "Fixture 1: Perfect JSON",
    input: JSON.stringify({
      summary: "US citizens can enter Canada visa-free for tourism.",
      recommendedRoute: "Simply present your valid US passport at the border.",
      caveats: [
        "Stay limited to 6 months",
        "Must have valid passport",
        "Border officer has final say"
      ],
      verdict: "VISA_FREE",
      stats: {
        maxStayDays: 180,
        feeEstimate: "None",
        processingTimeEstimate: "Immediate at border"
      }
    }),
    expectedVerdict: "VISA_FREE",
    assertions: (result) => {
      assert(result.verdict === "VISA_FREE", "Verdict should be VISA_FREE");
      assert(result.summary.includes("US citizens"), "Summary should contain 'US citizens'");
      assert(result.caveats.length === 3, "Should have 3 caveats");
      assert(result.stats?.maxStayDays === 180, "maxStayDays should be 180");
    }
  },
  {
    name: "Fixture 2: JSON wrapped in markdown fences",
    input: `\`\`\`json
{
  "summary": "UK nationals require visa for India.",
  "recommendedRoute": "Apply online via e-Visa portal.",
  "caveats": ["Processing takes 3-5 days", "Fee is non-refundable"],
  "verdict": "VISA_REQUIRED"
}
\`\`\``,
    expectedVerdict: "VISA_REQUIRED",
    assertions: (result) => {
      assert(result.verdict === "VISA_REQUIRED", "Verdict should be VISA_REQUIRED");
      assert(result.summary.includes("UK nationals"), "Summary should be parsed correctly");
      assert(result.caveats.length === 2, "Should have 2 caveats");
    }
  },
  {
    name: "Fixture 3: Invalid JSON",
    input: "{ this is not valid json at all }",
    expectedVerdict: "CHECK_NEEDED",
    assertions: (result) => {
      assert(result.verdict === "CHECK_NEEDED", "Verdict should default to CHECK_NEEDED");
      assert(result.summary.includes("Unable to determine"), "Should have fallback summary");
      assert(Array.isArray(result.caveats), "Caveats should be an array");
      assert(result.stats === undefined, "Stats should be undefined");
    }
  },
  {
    name: "Fixture 4: Wrong types (caveats as string)",
    input: JSON.stringify({
      summary: "Test summary",
      recommendedRoute: "Test route",
      caveats: "This should be an array but it's a string",
      verdict: "CHECK_NEEDED"
    }),
    expectedVerdict: "CHECK_NEEDED",
    assertions: (result) => {
      assert(result.verdict === "CHECK_NEEDED", "Verdict should be CHECK_NEEDED");
      assert(Array.isArray(result.caveats), "Caveats should be converted to array");
      assert(result.caveats.length === 0, "Invalid caveats should result in empty array");
    }
  },
  {
    name: "Fixture 5: Invalid verdict",
    input: JSON.stringify({
      summary: "Test summary",
      recommendedRoute: "Test route",
      caveats: ["Warning 1", "Warning 2"],
      verdict: "INVALID_VERDICT_VALUE"
    }),
    expectedVerdict: "CHECK_NEEDED",
    assertions: (result) => {
      assert(result.verdict === "CHECK_NEEDED", "Invalid verdict should default to CHECK_NEEDED");
      assert(result.summary === "Test summary", "Other fields should parse correctly");
      assert(result.caveats.length === 2, "Caveats should still be parsed");
    }
  },
  {
    name: "Fixture 6: Stats containing NaN-like values",
    input: JSON.stringify({
      summary: "Test summary",
      recommendedRoute: "Test route",
      caveats: ["Warning 1"],
      verdict: "VISA_REQUIRED",
      stats: {
        maxStayDays: NaN,
        feeEstimate: "USD 100",
        processingTimeEstimate: "5-7 days"
      }
    }),
    expectedVerdict: "VISA_REQUIRED",
    assertions: (result) => {
      assert(result.verdict === "VISA_REQUIRED", "Verdict should be VISA_REQUIRED");
      assert(result.stats?.maxStayDays === undefined, "NaN values should be filtered out");
      assert(result.stats?.feeEstimate === "USD 100", "Valid fee should be preserved");
      assert(result.stats?.processingTimeEstimate === "5-7 days", "Valid time should be preserved");
    }
  }
];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runTests() {
  console.log("🧪 Running AI JSON Parsing Tests\n");
  
  const client = new AiClientTestable();
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      console.log(`▶ ${testCase.name}`);
      const result = client.testParseResponse(testCase.input, "test:test:tourism");
      
      // Check verdict always returns a valid enum value
      const validVerdicts = ["VISA_FREE", "VISA_REQUIRED", "CHECK_NEEDED"];
      assert(
        validVerdicts.includes(result.verdict),
        `Verdict must be one of ${validVerdicts.join(", ")}, got: ${result.verdict}`
      );
      
      // Check expected verdict
      assert(
        result.verdict === testCase.expectedVerdict,
        `Expected verdict ${testCase.expectedVerdict}, got ${result.verdict}`
      );
      
      // Run custom assertions
      testCase.assertions(result);
      
      console.log(`  ✅ PASS\n`);
      passed++;
    } catch (error) {
      console.log(`  ❌ FAIL: ${error instanceof Error ? error.message : String(error)}\n`);
      failed++;
    }
  }

  // Summary
  console.log("─".repeat(50));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    console.log("❌ Some tests failed!");
    process.exit(1);
  } else {
    console.log("✅ All tests passed!");
    process.exit(0);
  }
}

// Additional robustness checks
console.log("🔍 Verifying parseResponse never throws...\n");

const client = new AiClientTestable();
const edgeCases = [
  "",
  "null",
  "undefined",
  "[]",
  "{}",
  "random text",
  JSON.stringify({ verdict: null }),
  JSON.stringify({ caveats: 123 }),
];

for (const edge of edgeCases) {
  try {
    const result = client.testParseResponse(edge);
    assert(result.verdict !== undefined, "Verdict should never be undefined");
    console.log(`  ✓ Handled: ${edge.substring(0, 30)}...`);
  } catch (error) {
    console.log(`  ✗ Threw exception on: ${edge}`);
    console.error(error);
    process.exit(1);
  }
}

console.log("\n✅ No exceptions thrown on edge cases\n");

// Run main tests
runTests();
