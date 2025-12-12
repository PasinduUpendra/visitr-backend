// src/services/AiClient.ts

import OpenAI from "openai";
import { env } from "../config/env";
import { VisaEvaluationInput, VisaEvaluationResult } from "../types/visa";

export class AiClient {
  private client: OpenAI;
  private model: string;

  constructor() {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables.");
    }

    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    this.model = env.OPENAI_MODEL;
  }

  async evaluateVisa(input: VisaEvaluationInput): Promise<VisaEvaluationResult> {
    const prompt = this.buildPrompt(input);

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert travel visa assistant. Analyze user situations conservatively and never promise approval."
        },
        { role: "user", content: prompt }
      ]
    });

    const text = completion.choices[0]?.message?.content ?? "";

    return this.parseResponse(text);
  }

  private buildPrompt(input: VisaEvaluationInput): string {
    return `Analyze this visa situation and answer in the following format, using these exact section headers in uppercase:

SUMMARY:
<2-4 sentences>

RECOMMENDED_ROUTE:
<2-4 sentences explaining the most realistic visa path>

CAVEATS:
- <bullet 1>
- <bullet 2>
- <bullet 3>

User situation:
- Nationality: ${input.nationality}
- Destination country: ${input.destinationCountry}
- Travel purpose: ${input.travelPurpose}
- Planned start date: ${input.plannedStartDate ?? "unknown"}
- Planned end date: ${input.plannedEndDate ?? "unknown"}
- Additional context: ${input.additionalContext ?? "none"}
`;
  }

  private parseResponse(text: string): VisaEvaluationResult {
    const summary = this.extractSection(text, "SUMMARY");
    const recommendedRoute = this.extractSection(text, "RECOMMENDED_ROUTE");
    const caveatsRaw = this.extractSection(text, "CAVEATS");

    const caveats = caveatsRaw
      .split("\n")
      .map((line) => line.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);

    return {
      summary,
      recommendedRoute,
      caveats,
      rawModelResponse: text
    };
  }

  // Very simple parser: split on section headers and pick the block until the next header.
  private extractSection(text: string, section: "SUMMARY" | "RECOMMENDED_ROUTE" | "CAVEATS"): string {
    const header = section + ":";
    const idx = text.indexOf(header);
    if (idx === -1) return "";

    const rest = text.slice(idx + header.length);

    // Find the next section header (one of the others) if it exists.
    const otherHeaders = ["SUMMARY:", "RECOMMENDED_ROUTE:", "CAVEATS:"].filter((h) => h !== header);
    const nextIndex = otherHeaders
      .map((h) => {
        const i = rest.indexOf(h);
        return i === -1 ? Infinity : i;
      })
      .reduce((min, curr) => (curr < min ? curr : min), Infinity);

    const sectionText = nextIndex === Infinity ? rest : rest.slice(0, nextIndex);

    return sectionText.trim();
  }
}
