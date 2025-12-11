import { env } from "../config/env";

type LogLevel = "debug" | "info" | "warn" | "error";

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || (env.NODE_ENV === "development" ? "debug" : "info");

function shouldLog(level: LogLevel): boolean {
  return levelOrder[level] >= levelOrder[currentLevel];
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog("debug")) console.debug("[DEBUG]", ...args);
  },
  info: (...args: unknown[]) => {
    if (shouldLog("info")) console.info("[INFO]", ...args);
  },
  warn: (...args: unknown[]) => {
    if (shouldLog("warn")) console.warn("[WARN]", ...args);
  },
  error: (...args: unknown[]) => {
    if (shouldLog("error")) console.error("[ERROR]", ...args);
  }
};
