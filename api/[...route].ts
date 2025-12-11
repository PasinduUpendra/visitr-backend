// api/[...route].ts
// Catch-all Vercel API route that forwards all /api/* requests
// to the Express app via serverless-http.

import serverless from "serverless-http";
import { app } from "../src/app";

// Wrap the Express app in a serverless handler.
const expressHandler = serverless(app);

// Vercel passes any /api/* request here (except more specific routes like api/hello.ts).
// We await the handler so Vercel knows when to finish the request.
export default async function handler(req: any, res: any): Promise<void> {
  await expressHandler(req, res);
}
