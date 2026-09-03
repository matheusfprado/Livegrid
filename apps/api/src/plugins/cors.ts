import { env } from "../config/env.js";

const developmentOrigins = new Set([
  env.WEB_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
]);

export function isAllowedOrigin(origin: string | undefined) {
  if (!origin) {
    return true;
  }

  if (developmentOrigins.has(origin)) {
    return true;
  }

  return /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/.test(origin);
}
