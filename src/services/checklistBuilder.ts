// src/services/checklistBuilder.ts

import { VisaChecklistResponse, ChecklistItem } from "../types/checklist";
import { TravelPurpose } from "../types/visa";

export function buildChecklist(params: {
  nationality: string;
  destinationCountry: string;
  travelPurpose: TravelPurpose;
}): VisaChecklistResponse {
  const { nationality, destinationCountry, travelPurpose } = params;

  const baseItems: ChecklistItem[] = [
    {
      label: "Valid passport (usually 3+ months beyond planned departure, with blank pages)",
      optional: false
    },
    {
      label: "Completed visa application form for the destination country",
      optional: false
    },
    {
      label: "Recent passport-sized photos meeting consulate specifications",
      optional: false
    },
    {
      label: "Travel medical insurance covering the Schengen area (if applicable)",
      optional: false,
      notes: "For Schengen, coverage is usually at least EUR 30,000."
    },
    {
      label: "Proof of accommodation (hotel booking, invitation letter, or rental)",
      optional: false
    },
    {
      label: "Proof of sufficient funds (bank statements, sponsor letter, etc.)",
      optional: false
    },
    {
      label: "Round-trip or onward travel booking/itinerary",
      optional: false
    },
    {
      label: "Evidence of ties to home country (employment, business, property, family)",
      optional: true
    }
  ];

  const additional: ChecklistItem[] = [];

  if (travelPurpose === "study") {
    additional.push({
      label: "Proof of enrolment or admission letter from educational institution",
      optional: false
    });
  }

  if (travelPurpose === "work" || travelPurpose === "business") {
    additional.push({
      label: "Work contract, assignment letter, or employer support letter",
      optional: false
    });
  }

  if (travelPurpose === "family_visit") {
    additional.push({
      label: "Invitation letter from family member or friend in destination country",
      optional: false
    });
  }

  const title = `Suggested ${normalizePurposeLabel(travelPurpose)} visa checklist for travel from ${nationality} to ${destinationCountry}`;

  const description =
    "This checklist is a general guide only. Always verify exact requirements with the official consulate or visa application center.";

  return {
    title,
    description,
    items: [...baseItems, ...additional]
  };
}

function normalizePurposeLabel(p: TravelPurpose): string {
  switch (p) {
    case "tourism":
      return "tourist";
    case "family_visit":
      return "family visit";
    default:
      return p.replace("_", " ");
  }
}
