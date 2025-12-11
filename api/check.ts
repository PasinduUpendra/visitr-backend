// api/check.ts
// Vercel serverless function for /api/check.

export default function handler(req: any, res: any): void {
  res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString()
  });
}
