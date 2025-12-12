// src/types/visa.ts

export type TravelPurpose =
  | "tourism"
  | "family_visit"
  | "business"
  | "study"
  | "work"
  | "transit"
  | "other";

export interface VisaEvaluationInput {
  nationality: string;
  destinationCountry: string;
  travelPurpose: TravelPurpose;
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
