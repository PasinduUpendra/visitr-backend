// src/utils/responseValidator.ts

import { VisaVerdict, VisaStats } from "../types/visa";

/**
 * Validates and sanitizes verdict to ensure it's a valid enum value.
 * Falls back to CHECK_NEEDED if invalid or missing.
 */
export function validateVerdict(verdict?: any): VisaVerdict {
  const validVerdicts: VisaVerdict[] = ["VISA_FREE", "VISA_REQUIRED", "CHECK_NEEDED"];
  
  if (typeof verdict === "string" && validVerdicts.includes(verdict as VisaVerdict)) {
    return verdict as VisaVerdict;
  }
  
  // Default to safe fallback
  return "CHECK_NEEDED";
}

/**
 * Validates and sanitizes caveats array.
 * Ensures it's always an array of strings.
 */
export function validateCaveats(caveats?: any): string[] {
  if (!Array.isArray(caveats)) {
    return [];
  }
  
  return caveats
    .filter((item) => typeof item === "string")
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);
}

/**
 * Validates and sanitizes stats object.
 * Omits invalid fields rather than throwing errors.
 */
export function validateStats(stats?: any): VisaStats | undefined {
  if (!stats || typeof stats !== "object") {
    return undefined;
  }
  
  const validated: VisaStats = {};
  
  // Validate maxStayDays
  if (typeof stats.maxStayDays === "number" && 
      Number.isFinite(stats.maxStayDays) && 
      stats.maxStayDays > 0) {
    validated.maxStayDays = Math.floor(stats.maxStayDays);
  }
  
  // Validate feeEstimate
  if (typeof stats.feeEstimate === "string" && stats.feeEstimate.trim().length > 0) {
    validated.feeEstimate = stats.feeEstimate.trim();
  }
  
  // Validate processingTimeEstimate
  if (typeof stats.processingTimeEstimate === "string" && 
      stats.processingTimeEstimate.trim().length > 0) {
    validated.processingTimeEstimate = stats.processingTimeEstimate.trim();
  }
  
  // Return undefined if no valid fields
  return Object.keys(validated).length > 0 ? validated : undefined;
}

/**
 * Validates the entire evaluation result to ensure it's safe for frontend consumption.
 * This prevents breaking the app if AI output changes or is malformed.
 */
export function validateEvaluationResult(result: any): {
  summary: string;
  recommendedRoute: string;
  caveats: string[];
  verdict: VisaVerdict;
  stats?: VisaStats;
} {
  return {
    summary: typeof result.summary === "string" ? result.summary : "Unable to generate summary.",
    recommendedRoute: typeof result.recommendedRoute === "string" 
      ? result.recommendedRoute 
      : "Please check with the destination country's embassy for specific requirements.",
    caveats: validateCaveats(result.caveats),
    verdict: validateVerdict(result.verdict),
    stats: validateStats(result.stats)
  };
}
