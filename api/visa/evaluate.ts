// api/visa/evaluate.ts

import { AiClient } from "../../src/services/AiClient";
import { VisaEvaluationInput } from "../../src/types/visa";
import { z } from "zod";
import { randomUUID } from "crypto";

const travelPurposeEnum = z.enum([
  "tourism",
  "family_visit",
  "business",
  "study",
  "work",
  "transit",
  "other"
]);

const schema = z.object({
  nationality: z.string().min(2),
  destinationCountry: z.string().min(2),
  travelPurpose: travelPurposeEnum,
  plannedStartDate: z.string().optional(),
  plannedEndDate: z.string().optional(),
  additionalContext: z.string().optional()
});

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parse = schema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() });
  }

  try {
    const ai = new AiClient();
    const input = parse.data as VisaEvaluationInput;
    const result = await ai.evaluateVisa(input);

    const caseId = randomUUID();

    return res.status(200).json({
      caseId,
      summary: result.summary,
      recommendedRoute: result.recommendedRoute,
      caveats: result.caveats
      // rawModelResponse intentionally omitted from public API response for now
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Internal error" });
  }
}
