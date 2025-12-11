import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    env: env.NODE_ENV
  });
});

app.get("/check", (_req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);
