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

  // Main entry point: evaluate a visa scenario and return structured result.
  async evaluateVisa(input: VisaEvaluationInput): Promise<VisaEvaluationResult> {
    const prompt = this.buildPrompt(input);

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert travel visa assistant. Analyze user situations conservatively. Do not promise approval."
        },
        { role: "user", content: prompt }
      ]
    });

    const text = completion.choices[0]?.message?.content ?? "";

    return this.parseResponse(text);
  }

  private buildPrompt(input: VisaEvaluationInput): string {
    return `Analyze this visa situation and answer in the following format with clear section headers:

SUMMARY:
...short summary...

RECOMMENDED_ROUTE:
...short description of the most realistic visa path...

CAVEATS:
- bullet 1
- bullet 2
- bullet 3

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
    const summary = this.extractSection("SUMMARY", text);
    const recommendedRoute = this.extractSection("RECOMMENDED_ROUTE", text);
    const caveatsRaw = this.extractSection("CAVEATS", text);

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

  private extractSection(section: string, text: string): string {
    const regex = new RegExp(section + ":([\\n\\r]+([\\s\\S]*?))(\\n[A-Z_]+:|$)");
    const match = text.match(regex);
    if (!match) return "";

    // match[1] contains everything after the section header up to the next header
    return match[1].trim();
  }
}
