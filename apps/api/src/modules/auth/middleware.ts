import type { FastifyRequest } from "fastify";
import { AuthService } from "./service.js";

const service = new AuthService();

export async function getCurrentUser(request: FastifyRequest) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return service.getUserByToken(authorization.slice("Bearer ".length));
}
