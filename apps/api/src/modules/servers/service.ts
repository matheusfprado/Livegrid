import {
  createChannelSchema,
  createInviteSchema,
  createMessageSchema,
  createServerSchema,
  joinServerByInviteSchema,
} from "@livegrid/validation";
import { createSecretToken } from "../../lib/crypto.js";
import { ServerRepository } from "./repository.js";

export class ServerNotFoundError extends Error {}
export class ServerForbiddenError extends Error {}
export class InviteNotFoundError extends Error {}
export class ChannelNotFoundError extends Error {}

const repository = new ServerRepository();

async function ensureSerializableServer(serverId: string) {
  await repository.ensureDefaultTextChannel(serverId);
  const server = await repository.findById(serverId);

  if (!server) {
    throw new ServerNotFoundError();
  }

  return server;
}

function serializeRoom(room: {
  id: string;
  code: string;
  name: string | null;
  type: "CALL" | "BROADCAST";
  status: "ACTIVE" | "ENDED";
  serverId: string | null;
  channelId: string | null;
  createdAt: Date;
  endedAt: Date | null;
}) {
  return {
    id: room.id,
    code: room.code,
    name: room.name,
    type: room.type,
    status: room.status,
    serverId: room.serverId,
    channelId: room.channelId,
    createdAt: room.createdAt.toISOString(),
    endedAt: room.endedAt?.toISOString() ?? null,
  };
}

function serializeTextChannel(channel: { id: string; serverId: string; name: string; createdAt: Date }) {
  return {
    id: channel.id,
    serverId: channel.serverId,
    name: channel.name,
    createdAt: channel.createdAt.toISOString(),
  };
}

function serializeVoiceChannel(channel: {
  id: string;
  serverId: string;
  name: string;
  rooms?: Array<{
    id: string;
    code: string;
    name: string | null;
    type: "CALL" | "BROADCAST";
    status: "ACTIVE" | "ENDED";
    serverId: string | null;
    channelId: string | null;
    createdAt: Date;
    endedAt: Date | null;
  }>;
}) {
  return {
    id: channel.id,
    serverId: channel.serverId,
    name: channel.name,
    activeRoom: channel.rooms?.[0] ? serializeRoom(channel.rooms[0]) : null,
  };
}

function serializeMessage(message: {
  id: string;
  serverId: string;
  channelId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string; email: string | null; avatarUrl: string | null };
}) {
  return {
    id: message.id,
    serverId: message.serverId,
    channelId: message.channelId,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
    author: {
      id: message.author.id,
      name: message.author.name,
      email: message.author.email,
      avatarUrl: message.author.avatarUrl,
    },
  };
}

function serializeServer(server: {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  channels: Array<Parameters<typeof serializeVoiceChannel>[0]>;
  textChannels: Array<{ id: string; serverId: string; name: string; createdAt: Date }>;
  members: Array<{
    id: string;
    role: string;
    user: { id: string; name: string; email: string | null; avatarUrl: string | null };
  }>;
}) {
  return {
    id: server.id,
    name: server.name,
    ownerId: server.ownerId,
    createdAt: server.createdAt.toISOString(),
    channels: server.channels.map(serializeVoiceChannel),
    textChannels: server.textChannels.map(serializeTextChannel),
    members: server.members.map((member) => ({
      id: member.id,
      role: member.role,
      user: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        avatarUrl: member.user.avatarUrl,
      },
    })),
  };
}

export class ServerService {
  async createServer(userId: string, input: unknown) {
    const data = createServerSchema.parse(input);
    const server = await repository.createServer({
      name: data.name,
      ownerId: userId,
    });

    return { server: serializeServer(server) };
  }

  async listServers(userId: string) {
    const servers = await repository.listForUser(userId);

    return {
      servers: servers.map(serializeServer),
    };
  }

  async getServer(userId: string, serverId: string) {
    const member = await repository.findMember(serverId, userId);

    if (!member) {
      throw new ServerForbiddenError();
    }

    const server = await ensureSerializableServer(serverId);

    return { server: serializeServer(server) };
  }

  async createInvite(userId: string, serverId: string, input: unknown) {
    const data = createInviteSchema.parse(input ?? {});
    const member = await repository.findMember(serverId, userId);

    if (!member) {
      throw new ServerForbiddenError();
    }

    const expiresAt = data.expiresInHours ? new Date(Date.now() + data.expiresInHours * 60 * 60 * 1000) : undefined;
    const invite = await repository.createInvite({
      code: createSecretToken().slice(0, 12),
      serverId,
      createdById: userId,
      expiresAt,
    });

    return {
      invite: {
        id: invite.id,
        code: invite.code,
        serverId: invite.serverId,
        createdAt: invite.createdAt.toISOString(),
        expiresAt: invite.expiresAt?.toISOString() ?? null,
      },
    };
  }

  async joinByInvite(userId: string, input: unknown) {
    const data = joinServerByInviteSchema.parse(input);
    const invite = await repository.findInvite(data.inviteCode);

    if (!invite || (invite.expiresAt && invite.expiresAt < new Date())) {
      throw new InviteNotFoundError();
    }

    await repository.addMember(invite.serverId, userId);
    const server = await ensureSerializableServer(invite.serverId);

    return { server: serializeServer(server) };
  }

  async createTextChannel(userId: string, serverId: string, input: unknown) {
    const data = createChannelSchema.parse(input);
    const member = await repository.findMember(serverId, userId);

    if (!member) {
      throw new ServerForbiddenError();
    }

    return { channel: serializeTextChannel(await repository.createTextChannel(serverId, data.name)) };
  }

  async createVoiceChannel(userId: string, serverId: string, input: unknown) {
    const data = createChannelSchema.parse(input);
    const member = await repository.findMember(serverId, userId);

    if (!member) {
      throw new ServerForbiddenError();
    }

    return { channel: serializeVoiceChannel(await repository.createVoiceChannel(serverId, data.name)) };
  }

  async listMessages(userId: string, serverId: string, channelId: string) {
    const member = await repository.findMember(serverId, userId);

    if (!member) {
      throw new ServerForbiddenError();
    }

    const channel = await repository.findTextChannel(serverId, channelId);

    if (!channel) {
      throw new ChannelNotFoundError();
    }

    return { messages: (await repository.listMessages(serverId, channelId)).map(serializeMessage) };
  }

  async createMessage(userId: string, serverId: string, channelId: string, input: unknown) {
    const data = createMessageSchema.parse(input);
    const member = await repository.findMember(serverId, userId);

    if (!member) {
      throw new ServerForbiddenError();
    }

    const channel = await repository.findTextChannel(serverId, channelId);

    if (!channel) {
      throw new ChannelNotFoundError();
    }

    return { message: serializeMessage(await repository.createMessage({ authorId: userId, channelId, content: data.content, serverId })) };
  }
}
