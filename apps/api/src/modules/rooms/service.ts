import { createLiveKitToken } from "@livegrid/livekit";
import type { ParticipantRole, RoomStatus, RoomSummary, RoomType } from "@livegrid/types";
import { createRoomSchema, endRoomSchema, joinRoomSchema, roomCodeSchema, roomTokenSchema } from "@livegrid/validation";
import { env } from "../../config/env.js";
import { createGuestIdentity, createRoomCode, createSecretToken, hashSecret } from "../../lib/crypto.js";
import { RoomRepository } from "./repository.js";

type RoomRecord = {
  id: string;
  code: string;
  name: string | null;
  type: RoomType;
  status: RoomStatus;
  serverId: string | null;
  channelId: string | null;
  createdAt: Date;
  endedAt: Date | null;
};

export class RoomNotFoundError extends Error {}
export class RoomEndedError extends Error {}
export class NotAuthorizedError extends Error {}
export class LiveKitNotConfiguredError extends Error {}
export class ChannelNotFoundError extends Error {}

export type RoomServiceRepository = Pick<
  RoomRepository,
  | "create"
  | "createParticipant"
  | "endRoom"
  | "findByCode"
  | "findParticipantById"
  | "findServerMember"
  | "findVoiceChannel"
>;

function serializeRoom(room: RoomRecord): RoomSummary {
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

function roleForJoin(roomType: RoomType, isHost: boolean): ParticipantRole {
  if (isHost) {
    return "HOST";
  }

  return roomType === "BROADCAST" ? "VIEWER" : "PARTICIPANT";
}

export class RoomService {
  constructor(private readonly repository: RoomServiceRepository = new RoomRepository()) {}

  async createRoom(input: unknown, user?: { id: string }) {
    const data = createRoomSchema.parse(input);
    const hostToken = createSecretToken();
    let room = null;

    if (data.serverId) {
      if (!user) {
        throw new NotAuthorizedError();
      }

      const member = await this.repository.findServerMember(data.serverId, user.id);

      if (!member) {
        throw new NotAuthorizedError();
      }

      if (data.channelId) {
        const channel = await this.repository.findVoiceChannel(data.serverId, data.channelId);

        if (!channel) {
          throw new ChannelNotFoundError();
        }
      }
    } else if (data.channelId) {
      throw new ChannelNotFoundError();
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        room = await this.repository.create({
          code: createRoomCode(),
          name: data.name,
          type: data.type,
          hostTokenHash: hashSecret(hostToken),
          hostId: user?.id,
          serverId: data.serverId,
          channelId: data.channelId,
        });
        break;
      } catch (error) {
        if (attempt === 4) {
          throw error;
        }
      }
    }

    if (!room) {
      throw new Error("Unable to create room.");
    }

    return {
      room: serializeRoom(room),
      hostToken,
    };
  }

  async getRoom(codeInput: unknown) {
    const code = roomCodeSchema.parse(codeInput);
    const room = await this.repository.findByCode(code);

    if (!room) {
      throw new RoomNotFoundError();
    }

    return {
      room: serializeRoom(room),
      participants: room.participants.map((participant) => ({
        id: participant.id,
        displayName: participant.displayName,
        role: participant.role,
        guestIdentity: participant.guestIdentity,
        joinedAt: participant.joinedAt.toISOString(),
        leftAt: participant.leftAt?.toISOString() ?? null,
      })),
    };
  }

  async joinRoom(codeInput: unknown, input: unknown, user?: { id: string; name: string }) {
    const code = roomCodeSchema.parse(codeInput);
    const data = joinRoomSchema.parse(input);
    const room = await this.repository.findByCode(code);

    if (!room) {
      throw new RoomNotFoundError();
    }

    if (room.status === "ENDED") {
      throw new RoomEndedError();
    }

    if (room.serverId) {
      if (!user) {
        throw new NotAuthorizedError();
      }

      const member = await this.repository.findServerMember(room.serverId, user.id);

      if (!member) {
        throw new NotAuthorizedError();
      }
    }

    const isHost =
      Boolean(user && room.hostId === user.id) || (data.hostToken ? hashSecret(data.hostToken) === room.hostTokenHash : false);
    const participant = await this.repository.createParticipant({
      roomId: room.id,
      userId: user?.id,
      guestIdentity: createGuestIdentity(),
      displayName: data.displayName || user?.name || "Convidado",
      role: roleForJoin(room.type, isHost),
    });

    return {
      participant: {
        id: participant.id,
        displayName: participant.displayName,
        role: participant.role,
        guestIdentity: participant.guestIdentity,
        joinedAt: participant.joinedAt.toISOString(),
        leftAt: participant.leftAt?.toISOString() ?? null,
      },
    };
  }

  async createToken(codeInput: unknown, input: unknown) {
    const code = roomCodeSchema.parse(codeInput);
    const data = roomTokenSchema.parse(input);
    const room = await this.repository.findByCode(code);

    if (!room) {
      throw new RoomNotFoundError();
    }

    if (room.status === "ENDED") {
      throw new RoomEndedError();
    }

    const participant = await this.repository.findParticipantById(data.participantId);

    if (!participant || participant.roomId !== room.id || participant.leftAt) {
      throw new NotAuthorizedError();
    }

    if (!env.LIVEKIT_URL || !env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
      throw new LiveKitNotConfiguredError();
    }

    const token = await createLiveKitToken({
      apiKey: env.LIVEKIT_API_KEY,
      apiSecret: env.LIVEKIT_API_SECRET,
      roomName: room.code,
      identity: participant.guestIdentity ?? participant.id,
      displayName: participant.displayName,
      role: participant.role,
    });

    return {
      token,
      liveKitUrl: env.LIVEKIT_URL,
    };
  }

  async endRoom(codeInput: unknown, input: unknown) {
    const code = roomCodeSchema.parse(codeInput);
    const data = endRoomSchema.parse(input);
    const room = await this.repository.findByCode(code);

    if (!room) {
      throw new RoomNotFoundError();
    }

    if (hashSecret(data.hostToken) !== room.hostTokenHash) {
      throw new NotAuthorizedError();
    }

    return {
      room: serializeRoom(await this.repository.endRoom(room.id)),
    };
  }
}
