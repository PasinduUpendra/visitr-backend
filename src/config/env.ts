import dotenv from "dotenv";

dotenv.config();

type Env = {
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  OPENAI_API_KEY: string | null;
  OPENAI_MODEL: string;
};

const NODE_ENV = (process.env.NODE_ENV as Env["NODE_ENV"]) || "development";
const PORT = Number(process.env.PORT || 4000);

// OpenAI config
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1";

export const env: Env = {
  NODE_ENV,
  PORT,
  OPENAI_API_KEY,
  OPENAI_MODEL
};
