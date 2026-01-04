// src/services/__tests__/aiClientParsing.test.ts

/**
 * Test harness for AI JSON parsing robustness.
 * Validates that parseResponse handles various malformed inputs gracefully.
 */

import { AiClient } from "../AiClient";

// Access the private parseResponse method for testing via type casting
class AiClientTestable extends AiClient {
  public testParseResponse(text: string, cacheKey?: string) {
    return (this as any).parseResponse(text, cacheKey);
  }
}

describe("AiClient JSON Parsing", () => {
  let client: AiClientTestable;

  beforeAll(() => {
    // Mock environment variable for tests
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "gpt-4";
    process.env.NODE_ENV = "test";
  });

  beforeEach(() => {
    client = new AiClientTestable();
  });

  describe("Fixture 1: Perfect JSON", () => {
    it("should parse valid JSON with all fields", () => {
      const input = JSON.stringify({
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
      });

      const result = client.testParseResponse(input, "US:Canada:tourism");

      expect(result.verdict).toBe("VISA_FREE");
      expect(result.summary).toContain("US citizens");
      expect(result.caveats).toHaveLength(3);
      expect(result.stats?.maxStayDays).toBe(180);
      expect(result.stats?.feeEstimate).toBe("None");
    });
  });

  describe("Fixture 2: JSON wrapped in markdown fences", () => {
    it("should strip markdown code blocks and parse", () => {
      const input = `\`\`\`json
{
  "summary": "UK nationals require visa for India.",
  "recommendedRoute": "Apply online via e-Visa portal.",
  "caveats": ["Processing takes 3-5 days", "Fee is non-refundable"],
  "verdict": "VISA_REQUIRED"
}
\`\`\``;

      const result = client.testParseResponse(input, "UK:India:tourism");

      expect(result.verdict).toBe("VISA_REQUIRED");
      expect(result.summary).toContain("UK nationals");
      expect(result.caveats).toHaveLength(2);
    });
  });

  describe("Fixture 3: Invalid JSON", () => {
    it("should return safe defaults without throwing", () => {
      const input = "{ this is not valid json at all }";

      const result = client.testParseResponse(input, "test:test:tourism");

      expect(result.verdict).toBe("CHECK_NEEDED");
      expect(result.summary).toContain("Unable to determine");
      expect(result.caveats).toContain("This response could not be properly generated");
      expect(result.stats).toBeUndefined();
    });
  });

  describe("Fixture 4: Wrong types (caveats as string)", () => {
    it("should handle non-array caveats gracefully", () => {
      const input = JSON.stringify({
        summary: "Test summary",
        recommendedRoute: "Test route",
        caveats: "This should be an array but it's a string",
        verdict: "CHECK_NEEDED"
      });

      const result = client.testParseResponse(input, "test:test:tourism");

      expect(result.verdict).toBe("CHECK_NEEDED");
      expect(result.caveats).toEqual([]); // Should default to empty array
      expect(result.summary).toBe("Test summary");
    });
  });

  describe("Fixture 5: Invalid verdict", () => {
    it("should default to CHECK_NEEDED for invalid verdict", () => {
      const input = JSON.stringify({
        summary: "Test summary",
        recommendedRoute: "Test route",
        caveats: ["Warning 1", "Warning 2"],
        verdict: "INVALID_VERDICT_VALUE"
      });

      const result = client.testParseResponse(input, "test:test:tourism");

      expect(result.verdict).toBe("CHECK_NEEDED");
      expect(result.summary).toBe("Test summary");
      expect(result.caveats).toHaveLength(2);
    });

    it("should default to CHECK_NEEDED for missing verdict", () => {
      const input = JSON.stringify({
        summary: "Test summary",
        recommendedRoute: "Test route",
        caveats: ["Warning 1"]
      });

      const result = client.testParseResponse(input, "test:test:tourism");

      expect(result.verdict).toBe("CHECK_NEEDED");
    });
  });

  describe("Fixture 6: Stats containing NaN-like values", () => {
    it("should filter out invalid numeric values", () => {
      const input = JSON.stringify({
        summary: "Test summary",
        recommendedRoute: "Test route",
        caveats: ["Warning 1"],
        verdict: "VISA_REQUIRED",
        stats: {
          maxStayDays: NaN,
          feeEstimate: "USD 100",
          processingTimeEstimate: "5-7 days"
        }
      });

      const result = client.testParseResponse(input, "test:test:tourism");

      expect(result.verdict).toBe("VISA_REQUIRED");
      expect(result.stats?.maxStayDays).toBeUndefined(); // NaN should be filtered
      expect(result.stats?.feeEstimate).toBe("USD 100");
      expect(result.stats?.processingTimeEstimate).toBe("5-7 days");
    });

    it("should filter out Infinity values", () => {
      const input = JSON.stringify({
        summary: "Test summary",
        recommendedRoute: "Test route",
        caveats: ["Warning 1"],
        verdict: "VISA_REQUIRED",
        stats: {
          maxStayDays: Infinity,
          feeEstimate: "EUR 50"
        }
      });

      const result = client.testParseResponse(input, "test:test:tourism");

      expect(result.stats?.maxStayDays).toBeUndefined(); // Infinity should be filtered
      expect(result.stats?.feeEstimate).toBe("EUR 50");
    });

    it("should omit stats entirely if all fields are invalid", () => {
      const input = JSON.stringify({
        summary: "Test summary",
        recommendedRoute: "Test route",
        caveats: ["Warning 1"],
        verdict: "VISA_FREE",
        stats: {
          maxStayDays: NaN,
          feeEstimate: "",
          processingTimeEstimate: "   "
        }
      });

      const result = client.testParseResponse(input, "test:test:tourism");

      expect(result.stats).toBeUndefined();
    });
  });

  describe("Additional edge cases", () => {
    it("should handle mixed valid and invalid caveats", () => {
      const input = JSON.stringify({
        summary: "Test summary",
        recommendedRoute: "Test route",
        caveats: ["Valid caveat", 123, null, "Another valid one", undefined, false],
        verdict: "CHECK_NEEDED"
      });

      const result = client.testParseResponse(input, "test:test:tourism");

      expect(result.caveats).toEqual(["Valid caveat", "Another valid one"]);
    });

    it("should never throw on completely empty response", () => {
      const input = "";

      const result = client.testParseResponse(input, "test:test:tourism");

      expect(result.verdict).toBe("CHECK_NEEDED");
      expect(result.summary).toContain("Unable to determine");
    });

    it("should handle null or undefined fields gracefully", () => {
      const input = JSON.stringify({
        summary: null,
        recommendedRoute: undefined,
        caveats: null,
        verdict: null
      });

      const result = client.testParseResponse(input, "test:test:tourism");

      expect(result.verdict).toBe("CHECK_NEEDED");
      expect(result.summary).toContain("Unable to determine");
      expect(result.recommendedRoute).toContain("Check the official");
      expect(result.caveats).toEqual([]);
    });
  });

  describe("Verdict classifier integration", () => {
    it("should classify all valid verdict values correctly", () => {
      const verdicts = ["VISA_FREE", "VISA_REQUIRED", "CHECK_NEEDED"];

      verdicts.forEach((verdict) => {
        const input = JSON.stringify({
          summary: "Test",
          recommendedRoute: "Test",
          caveats: ["Test"],
          verdict
        });

        const result = client.testParseResponse(input);
        expect(result.verdict).toBe(verdict);
      });
    });
  });
});
