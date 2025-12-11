// api/hello.ts
// Simple test endpoint to confirm Vercel's /api routing.

export default function handler(req: any, res: any): void {
  res.status(200).json({ message: "hello from visitr-backend" });
}
