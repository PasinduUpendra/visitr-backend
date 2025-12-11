// api/health.ts
// Vercel serverless function for /api/health.

import { env } from "../src/config/env";

export default function handler(req: any, res: any): void {
  res.status(200).json({
    status: "ok",
    env: env.NODE_ENV
  });
}
