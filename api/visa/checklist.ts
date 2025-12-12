// api/visa/checklist.ts

import { z } from "zod";
import { buildChecklist } from "../../src/services/checklistBuilder";
import { TravelPurpose } from "../../src/types/visa";

const schema = z.object({
  nationality: z.string().min(2),
  destinationCountry: z.string().min(2),
  travelPurpose: z.enum([
    "tourism",
    "family_visit",
    "business",
    "study",
    "work",
    "transit",
    "other"
  ])
});

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parse = schema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.flatten() });
  }

  const { nationality, destinationCountry, travelPurpose } = parse.data as {
    nationality: string;
    destinationCountry: string;
    travelPurpose: TravelPurpose;
  };

  const checklist = buildChecklist({
    nationality,
    destinationCountry,
    travelPurpose
  });

  return res.status(200).json(checklist);
}
