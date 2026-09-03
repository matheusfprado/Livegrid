import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import type { ApiErrorResponse } from "../../lib/api-error.js";
import { isDatabaseSchemaMissingError, isDatabaseUnavailableError } from "../../lib/database-error.js";
import { getCurrentUser } from "../auth/middleware.js";
import {
  ChannelNotFoundError,
  InviteNotFoundError,
  ServerForbiddenError,
  ServerNotFoundError,
  ServerService,
} from "./service.js";

const service = new ServerService();

function toErrorResponse(error: unknown): { statusCode: number; body: ApiErrorResponse } {
  if (error instanceof ZodError) {
    return { statusCode: 400, body: { error: { code: "INVALID_TOKEN", message: "Dados invalidos." } } };
  }

  if (error instanceof ServerNotFoundError || error instanceof InviteNotFoundError || error instanceof ChannelNotFoundError) {
    return { statusCode: 404, body: { error: { code: "ROOM_NOT_FOUND", message: "Servidor, canal ou convite nao encontrado." } } };
  }

  if (error instanceof ServerForbiddenError) {
    return { statusCode: 403, body: { error: { code: "NOT_AUTHORIZED", message: "Voce nao participa deste servidor." } } };
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

export async function serverRoutes(app: FastifyInstance) {
  app.get("/servers", async (request, reply) => {
    const user = await getCurrentUser(request);

    if (!user) {
      return reply.status(401).send({ error: { code: "NOT_AUTHORIZED", message: "Sessao invalida." } });
    }

    return service.listServers(user.id);
  });

  app.post("/servers", async (request, reply) => {
    const user = await getCurrentUser(request);

    if (!user) {
      return reply.status(401).send({ error: { code: "NOT_AUTHORIZED", message: "Sessao invalida." } });
    }

    try {
      return await service.createServer(user.id, request.body);
    } catch (error) {
      request.log.error(error);
      const response = toErrorResponse(error);
      return reply.status(response.statusCode).send(response.body);
    }
  });

  app.get("/servers/:serverId", async (request, reply) => {
    const user = await getCurrentUser(request);

    if (!user) {
      return reply.status(401).send({ error: { code: "NOT_AUTHORIZED", message: "Sessao invalida." } });
    }

    try {
      const params = request.params as { serverId: string };
      return await service.getServer(user.id, params.serverId);
    } catch (error) {
      const response = toErrorResponse(error);
      return reply.status(response.statusCode).send(response.body);
    }
  });

  app.post("/servers/:serverId/invites", async (request, reply) => {
    const user = await getCurrentUser(request);

    if (!user) {
      return reply.status(401).send({ error: { code: "NOT_AUTHORIZED", message: "Sessao invalida." } });
    }

    try {
      const params = request.params as { serverId: string };
      return await service.createInvite(user.id, params.serverId, request.body);
    } catch (error) {
      request.log.error(error);
      const response = toErrorResponse(error);
      return reply.status(response.statusCode).send(response.body);
    }
  });

  app.post("/servers/:serverId/text-channels", async (request, reply) => {
    const user = await getCurrentUser(request);

    if (!user) {
      return reply.status(401).send({ error: { code: "NOT_AUTHORIZED", message: "Sessao invalida." } });
    }

    try {
      const params = request.params as { serverId: string };
      return await service.createTextChannel(user.id, params.serverId, request.body);
    } catch (error) {
      request.log.error(error);
      const response = toErrorResponse(error);
      return reply.status(response.statusCode).send(response.body);
    }
  });

  app.post("/servers/:serverId/voice-channels", async (request, reply) => {
    const user = await getCurrentUser(request);

    if (!user) {
      return reply.status(401).send({ error: { code: "NOT_AUTHORIZED", message: "Sessao invalida." } });
    }

    try {
      const params = request.params as { serverId: string };
      return await service.createVoiceChannel(user.id, params.serverId, request.body);
    } catch (error) {
      request.log.error(error);
      const response = toErrorResponse(error);
      return reply.status(response.statusCode).send(response.body);
    }
  });

  app.get("/servers/:serverId/text-channels/:channelId/messages", async (request, reply) => {
    const user = await getCurrentUser(request);

    if (!user) {
      return reply.status(401).send({ error: { code: "NOT_AUTHORIZED", message: "Sessao invalida." } });
    }

    try {
      const params = request.params as { channelId: string; serverId: string };
      return await service.listMessages(user.id, params.serverId, params.channelId);
    } catch (error) {
      const response = toErrorResponse(error);
      return reply.status(response.statusCode).send(response.body);
    }
  });

  app.post("/servers/:serverId/text-channels/:channelId/messages", async (request, reply) => {
    const user = await getCurrentUser(request);

    if (!user) {
      return reply.status(401).send({ error: { code: "NOT_AUTHORIZED", message: "Sessao invalida." } });
    }

    try {
      const params = request.params as { channelId: string; serverId: string };
      return await service.createMessage(user.id, params.serverId, params.channelId, request.body);
    } catch (error) {
      request.log.error(error);
      const response = toErrorResponse(error);
      return reply.status(response.statusCode).send(response.body);
    }
  });

  app.post("/servers/join", async (request, reply) => {
    const user = await getCurrentUser(request);

    if (!user) {
      return reply.status(401).send({ error: { code: "NOT_AUTHORIZED", message: "Sessao invalida." } });
    }

    try {
      return await service.joinByInvite(user.id, request.body);
    } catch (error) {
      const response = toErrorResponse(error);
      return reply.status(response.statusCode).send(response.body);
    }
  });
}
