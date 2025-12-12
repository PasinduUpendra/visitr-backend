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

    const response = await this.client.responses.create({
      model: this.model,
      input: prompt
    });

    const content = response.output[0].content
      .map((block: any) => (block.text ? block.text : ""))
      .join("\n");

    return this.parseResponse(content);
  }

  private buildPrompt(input: VisaEvaluationInput): string {
    return `You are an expert travel visa assistant. Analyze the user's situation and respond in three sections:

1) SUMMARY
2) RECOMMENDED_ROUTE
3) CAVEATS

User:
Nationality: ${input.nationality}
Destination: ${input.destinationCountry}
Purpose: ${input.travelPurpose}
Start: ${input.plannedStartDate ?? "unknown"}
End: ${input.plannedEndDate ?? "unknown"}
Context: ${input.additionalContext ?? "none"}

Keep answers concise and realistic.`;
  }

  private parseResponse(text: string): VisaEvaluationResult {
    const summary = this.extract("SUMMARY", text);
    const recommendedRoute = this.extract("RECOMMENDED_ROUTE", text);
    const caveatsRaw = this.extract("CAVEATS", text);

    const caveats = caveatsRaw
      .split("\n")
      .map((l) => l.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);

    return {
      summary,
      recommendedRoute,
      caveats,
      rawModelResponse: text
    };
  }

  private extract(section: string, text: string): string {
    const regex = new RegExp(section + ":([\\s\\S]*?)(\\n[A-Z_]+:|$)");
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  }
}
