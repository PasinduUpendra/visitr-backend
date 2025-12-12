// src/types/visa.ts

export interface VisaEvaluationInput {
  nationality: string;
  destinationCountry: string;
  travelPurpose: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  additionalContext?: string;
}

export interface VisaEvaluationResult {
  summary: string;
  recommendedRoute: string;
  caveats: string[];
  rawModelResponse?: string;
}
