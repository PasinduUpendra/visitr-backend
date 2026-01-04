// src/utils/validation.ts

/**
 * Detects if a string looks like an ISO country code (2-3 uppercase letters).
 * Returns true if it matches ISO code pattern.
 */
export function looksLikeISOCode(value: string): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }
  
  // ISO 3166-1 alpha-2 (2 letters) or alpha-3 (3 letters)
  // Must be all uppercase letters
  const isoPattern = /^[A-Z]{2,3}$/;
  return isoPattern.test(value.trim());
}

/**
 * Validates that a country field contains a name, not an ISO code.
 * Throws ApiError if validation fails.
 */
export function validateCountryName(value: string, fieldName: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }
  
  if (looksLikeISOCode(value)) {
    throw new Error(
      `Expected country name for ${fieldName}, got ISO code '${value}'. Please use full country names (e.g., 'United States' instead of 'US').`
    );
  }
}

/**
 * Redacts sensitive parts of request payload for logging.
 */
export function redactPayloadForLogging(payload: any): any {
  if (!payload || typeof payload !== "object") {
    return payload;
  }
  
  const redacted: any = {
    nationality: payload.nationality,
    destinationCountry: payload.destinationCountry,
    travelPurpose: payload.travelPurpose
  };
  
  // Include dates if present
  if (payload.plannedStartDate) {
    redacted.plannedStartDate = payload.plannedStartDate;
  }
  if (payload.plannedEndDate) {
    redacted.plannedEndDate = payload.plannedEndDate;
  }
  
  // Truncate additionalContext to 100 chars
  if (payload.additionalContext) {
    const context = String(payload.additionalContext);
    redacted.additionalContext = context.length > 100 
      ? context.substring(0, 100) + "..." 
      : context;
  }
  
  return redacted;
}
