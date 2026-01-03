// src/services/AiClient.ts

import OpenAI from "openai";
import { env } from "../config/env";
import { VisaEvaluationInput, VisaEvaluationResult } from "../types/visa";
import { classifyVerdict } from "../utils/verdict";

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
            "You are an expert travel visa assistant. Analyze user situations conservatively and never promise approval. You MUST respond with valid JSON only, no markdown, no prose."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0]?.message?.content ?? "";

    return this.parseResponse(text);
  }

  private buildPrompt(input: VisaEvaluationInput): string {
    return `Analyze this visa situation and respond with ONLY a valid JSON object. No markdown, no code blocks, no additional text.

Required JSON schema:
{
  "summary": "string - 2-4 sentences about visa requirements",
  "recommendedRoute": "string - 2-4 sentences explaining the most realistic visa path",
  "caveats": ["string array - 3+ important warnings or considerations"],
  "verdict": "VISA_FREE" | "VISA_REQUIRED" | "CHECK_NEEDED",
  "stats": {
    "maxStayDays": number (optional - only if known),
    "feeEstimate": "string with currency" (optional - only if known),
    "processingTimeEstimate": "string" (optional - only if known)
  }
}

Instructions:
- verdict MUST be exactly one of: "VISA_FREE", "VISA_REQUIRED", or "CHECK_NEEDED"
- Use "VISA_FREE" if no visa is needed
- Use "VISA_REQUIRED" if visa is definitely required
- Use "CHECK_NEEDED" if uncertain or depends on circumstances
- Be conservative: if uncertain, use "CHECK_NEEDED"
- Only include stats fields if you have reliable information
- Omit the entire stats object if no reliable data is available

User situation:
- Nationality: ${input.nationality}
- Destination country: ${input.destinationCountry}
- Travel purpose: ${input.travelPurpose}
- Planned start date: ${input.plannedStartDate ?? "unknown"}
- Planned end date: ${input.plannedEndDate ?? "unknown"}
- Additional context: ${input.additionalContext ?? "none"}

Respond with JSON only:`;
  }

  private parseResponse(text: string): VisaEvaluationResult {
    // Try to parse as JSON
    try {
      // Clean up potential markdown code blocks or extra whitespace
      let cleanedText = text.trim();
      
      // Remove markdown code blocks if present
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/```\s*$/, "");
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```\s*/, "").replace(/```\s*$/, "");
      }
      
      cleanedText = cleanedText.trim();

      const parsed = JSON.parse(cleanedText);

      // Extract fields with defaults
      const summary = typeof parsed.summary === "string" 
        ? parsed.summary 
        : "Unable to determine. Please verify with official sources.";
      
      const recommendedRoute = typeof parsed.recommendedRoute === "string"
        ? parsed.recommendedRoute
        : "Check the official embassy or immigration guidance for your specific situation.";
      
      const caveats = Array.isArray(parsed.caveats) 
        ? parsed.caveats.filter((c: any) => typeof c === "string")
        : [];

      // Use deterministic classifier for verdict
      const verdict = classifyVerdict({
        verdictText: parsed.verdict
      });

      // Parse stats if present
      let stats = undefined;
      if (parsed.stats && typeof parsed.stats === "object") {
        const validStats: any = {};
        
        if (typeof parsed.stats.maxStayDays === "number" && Number.isFinite(parsed.stats.maxStayDays)) {
          validStats.maxStayDays = Math.floor(parsed.stats.maxStayDays);
        }
        
        if (typeof parsed.stats.feeEstimate === "string" && parsed.stats.feeEstimate.trim().length > 0) {
          validStats.feeEstimate = parsed.stats.feeEstimate.trim();
        }
        
        if (typeof parsed.stats.processingTimeEstimate === "string" && 
            parsed.stats.processingTimeEstimate.trim().length > 0) {
          validStats.processingTimeEstimate = parsed.stats.processingTimeEstimate.trim();
        }
        
        if (Object.keys(validStats).length > 0) {
          stats = validStats;
        }
      }

      return {
        summary,
        recommendedRoute,
        caveats,
        verdict,
        stats,
        rawModelResponse: text
      };
    } catch (error) {
      // JSON parsing failed - return safe defaults
      console.error("Failed to parse AI response as JSON:", error);
      
      return {
        summary: "Unable to determine visa requirements. Please verify with official sources.",
        recommendedRoute: "Check the official embassy or immigration guidance for your specific situation.",
        caveats: [
          "This response could not be properly generated",
          "Please verify requirements with official sources",
          "Contact the destination country's embassy for accurate information"
        ],
        verdict: "CHECK_NEEDED",
        stats: undefined,
        rawModelResponse: text
      };
    }
  }
}
