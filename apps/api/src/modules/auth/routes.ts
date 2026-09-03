import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import type { ApiErrorResponse } from "../../lib/api-error.js";
import { isDatabaseSchemaMissingError, isDatabaseUnavailableError } from "../../lib/database-error.js";
import { EmailAlreadyUsedError, InvalidCredentialsError, AuthService } from "./service.js";
import { getCurrentUser } from "./middleware.js";

const service = new AuthService();

function toErrorResponse(error: unknown): { statusCode: number; body: ApiErrorResponse } {
  if (error instanceof ZodError) {
    return { statusCode: 400, body: { error: { code: "INVALID_TOKEN", message: "Dados invalidos." } } };
  }

  if (error instanceof EmailAlreadyUsedError) {
    return { statusCode: 409, body: { error: { code: "NOT_AUTHORIZED", message: "Este email ja esta em uso." } } };
  }

  if (error instanceof InvalidCredentialsError) {
    return { statusCode: 401, body: { error: { code: "NOT_AUTHORIZED", message: "Email ou senha invalidos." } } };
  }

  if (isDatabaseUnavailableError(error)) {
    return {
      statusCode: 503,
      body: {
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Banco de dados indisponivel. Inicie o Postgres e tente novamente.",
        },
      },
    };
  }

  if (isDatabaseSchemaMissingError(error)) {
    return {
      statusCode: 503,
      body: {
        error: {
          code: "DATABASE_SCHEMA_MISSING",
          message: "Schema do banco nao aplicado. Execute pnpm db:push.",
        },
      },
    };
  }

  return { statusCode: 500, body: { error: { code: "INTERNAL_ERROR", message: "Erro interno." } } };
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    try {
      return await service.register(request.body);
    } catch (error) {
      request.log.error(error);
      const response = toErrorResponse(error);
      return reply.status(response.statusCode).send(response.body);
    }
  });

  app.post("/auth/login", async (request, reply) => {
    try {
      return await service.login(request.body);
    } catch (error) {
      const response = toErrorResponse(error);
      return reply.status(response.statusCode).send(response.body);
    }
  });

  app.get("/auth/me", async (request, reply) => {
    const user = await getCurrentUser(request);

    if (!user) {
      return reply.status(401).send({ error: { code: "NOT_AUTHORIZED", message: "Sessao invalida." } });
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    };
  });
}
