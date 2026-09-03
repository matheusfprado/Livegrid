import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: ["LIVEKIT_API_SECRET", "DATABASE_URL"],
});
