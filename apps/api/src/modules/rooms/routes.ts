import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import type { ApiErrorResponse } from "../../lib/api-error.js";
import { isDatabaseSchemaMissingError, isDatabaseUnavailableError } from "../../lib/database-error.js";
import {
  LiveKitNotConfiguredError,
  ChannelNotFoundError,
  NotAuthorizedError,
  RoomEndedError,
  RoomNotFoundError,
  RoomService,
} from "./service.js";
import { getCurrentUser } from "../auth/middleware.js";

const service = new RoomService();

function toErrorResponse(error: unknown): { statusCode: number; body: ApiErrorResponse } {
  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      body: { error: { code: "INVALID_ROOM_CODE", message: "Dados invalidos." } },
    };
  }

  if (error instanceof RoomNotFoundError || error instanceof ChannelNotFoundError) {
    return {
      statusCode: 404,
      body: { error: { code: "ROOM_NOT_FOUND", message: "Sala nao encontrada." } },
    };
  }

  if (error instanceof RoomEndedError) {
    return {
      statusCode: 409,
      body: { error: { code: "ROOM_ENDED", message: "Esta sala ja foi encerrada." } },
    };
  }

  if (error instanceof NotAuthorizedError) {
    return {
      statusCode: 403,
      body: { error: { code: "NOT_AUTHORIZED", message: "Voce nao tem permissao para esta acao." } },
    };
  }

  if (error instanceof LiveKitNotConfiguredError) {
    return {
      statusCode: 503,
      body: { error: { code: "MEDIA_ERROR", message: "LiveKit ainda nao foi configurado no servidor." } },
    };
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

  return {
    statusCode: 500,
    body: { error: { code: "INTERNAL_ERROR", message: "Erro interno." } },
  };
}

export async function roomRoutes(app: FastifyInstance) {
  app.get("/rooms/health", async () => ({
    module: "rooms",
    status: "ready",
  }));

  app.post("/rooms", async (request, reply) => {
    try {
      const user = await getCurrentUser(request);
      return await service.createRoom(request.body, user ?? undefined);
    } catch (error) {
      request.log.error(error);
      const response = toErrorResponse(error);
      return reply.status(response.statusCode).send(response.body);
    }
  });

  app.get("/rooms/:code", async (request, reply) => {
    try {
      const params = request.params as { code: string };
      return await service.getRoom(params.code);
    } catch (error) {
      const response = toErrorResponse(error);
      return reply.status(response.statusCode).send(response.body);
    }
  });

  app.post("/rooms/:code/join", async (request, reply) => {
    try {
      const params = request.params as { code: string };
      const user = await getCurrentUser(request);
      return await service.joinRoom(params.code, request.body, user ?? undefined);
    } catch (error) {
      request.log.error(error);
      const response = toErrorResponse(error);
      return reply.status(response.statusCode).send(response.body);
    }
  });

  app.post("/rooms/:code/token", async (request, reply) => {
    try {
      const params = request.params as { code: string };
      return await service.createToken(params.code, request.body);
    } catch (error) {
      request.log.error(error);
      const response = toErrorResponse(error);
      return reply.status(response.statusCode).send(response.body);
    }
  });

  app.post("/rooms/:code/end", async (request, reply) => {
    try {
      const params = request.params as { code: string };
      return await service.endRoom(params.code, request.body);
    } catch (error) {
      request.log.error(error);
      const response = toErrorResponse(error);
      return reply.status(response.statusCode).send(response.body);
    }
  });
}
