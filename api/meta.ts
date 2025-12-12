// api/meta.ts
// Returns API metadata that the mobile app can use for configuration.

export default function handler(req: any, res: any): void {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  res.status(200).json({
    apiVersion: "1.0.0",
    travelPurposes: [
      "tourism",
      "family_visit",
      "business",
      "study",
      "work",
      "transit",
      "other"
    ]
  });
}
