// api/index.ts
// Vercel serverless function entry that wraps the Express app.

import serverless from "serverless-http";
import { app } from "../src/app";

// Wrap the Express app in a serverless handler so each request
// is handled correctly in Vercel's serverless environment.
const expressHandler = serverless(app);

// Default export is the handler Vercel will call for /api/* routes.
export default function handler(req: any, res: any): void {
  expressHandler(req, res);
}
