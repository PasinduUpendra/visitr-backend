// src/utils/verdict.ts

import { VisaVerdict } from "../types/visa";

export interface VerdictInput {
  /**
   * Structured verdict from AI model or data source.
   * If true: visa is required
   * If false: visa is NOT required (visa-free)
   * If undefined: uncertain/insufficient data
   */
  requiresVisa?: boolean;
  
  /**
   * Raw verdict string from AI (fallback for text-based parsing)
   */
  verdictText?: string;
}

/**
 * Deterministic classifier that returns a structured verdict.
 * Does NOT parse summary text - only uses structured inputs.
 * 
 * @param input Structured verdict data
 * @returns VisaVerdict enum value
 */
export function classifyVerdict(input: VerdictInput): VisaVerdict {
  // Priority 1: Use structured boolean if available
  if (input.requiresVisa === true) {
    return "VISA_REQUIRED";
  }
  
  if (input.requiresVisa === false) {
    return "VISA_FREE";
  }
  
  // Priority 2: Parse structured verdict text if available
  if (input.verdictText) {
    const normalized = input.verdictText.toUpperCase().trim();
    
    if (normalized.includes("VISA_FREE") || normalized === "VISA FREE") {
      return "VISA_FREE";
    }
    
    if (normalized.includes("VISA_REQUIRED") || normalized === "VISA REQUIRED") {
      return "VISA_REQUIRED";
    }
    
    if (normalized.includes("CHECK_NEEDED") || normalized === "CHECK NEEDED") {
      return "CHECK_NEEDED";
    }
  }
  
  // Default: Conservative fallback when data is uncertain or missing
  return "CHECK_NEEDED";
}
