import dotenv from "dotenv";

dotenv.config();

type Env = {
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
};

const NODE_ENV = (process.env.NODE_ENV as Env["NODE_ENV"]) || "development";
const PORT = Number(process.env.PORT || 4000);

export const env: Env = {
  NODE_ENV,
  PORT
};
