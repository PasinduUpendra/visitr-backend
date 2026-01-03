// src/types/visa.ts

export type TravelPurpose =
  | "tourism"
  | "family_visit"
  | "business"
  | "study"
  | "work"
  | "transit"
  | "other";

export type VisaVerdict = "VISA_FREE" | "VISA_REQUIRED" | "CHECK_NEEDED";

export interface VisaStats {
  maxStayDays?: number;
  feeEstimate?: string;
  processingTimeEstimate?: string;
}

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
  verdict?: VisaVerdict;
  stats?: VisaStats;
  rawModelResponse?: string;
}
