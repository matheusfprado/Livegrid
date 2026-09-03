import cors from "@fastify/cors";
import Fastify from "fastify";
import { authRoutes } from "./modules/auth/routes.js";
import { roomRoutes } from "./modules/rooms/routes.js";
import { serverRoutes } from "./modules/servers/routes.js";
import { isAllowedOrigin } from "./plugins/cors.js";
import { env } from "./config/env.js";
import { rateLimitPlugin } from "./plugins/rate-limit.js";

export function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      redact: ["LIVEKIT_API_SECRET", "DATABASE_URL"],
    },
  });

  app.get("/health", async () => ({
    status: "ok",
  }));

  app.register(cors, {
    origin: (origin, callback) => {
      callback(null, isAllowedOrigin(origin));
    },
    credentials: false,
  });
  app.register(rateLimitPlugin);
  app.register(authRoutes);
  app.register(roomRoutes);
  app.register(serverRoutes);

  return app;
}

const app = buildServer();

try {
  await app.listen({ host: "0.0.0.0", port: env.PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
