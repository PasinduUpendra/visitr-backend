// api/[...route].ts
// Catch-all Vercel API route that forwards all /api/* requests
// to the Express app via serverless-http.

import serverless from "serverless-http";
import { app } from "../src/app";

// Wrap the Express app in a serverless handler.
const expressHandler = serverless(app);

// Vercel will pass any /api/* request here (that doesn't match a more
// specific file like api/hello.ts). We simply delegate to the Express handler.
export default function handler(req: any, res: any): void {
  expressHandler(req, res);
}
