import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ParticipantRole, RoomStatus, RoomType } from "@livegrid/types";
import { ChannelNotFoundError, NotAuthorizedError, RoomService, type RoomServiceRepository } from "./service.js";

type RoomRecord = Awaited<ReturnType<RoomServiceRepository["findByCode"]>>;
type CreateRoomData = Parameters<RoomServiceRepository["create"]>[0];
type CreateParticipantData = Parameters<RoomServiceRepository["createParticipant"]>[0];

const now = new Date("2026-01-01T00:00:00.000Z");

function room(overrides: Partial<NonNullable<RoomRecord>> = {}): NonNullable<RoomRecord> {
  return {
    channelId: null,
    code: "ABC123",
    createdAt: now,
    endedAt: null,
    hostId: "host-user",
    hostTokenHash: "hash",
    id: "room-id",
    name: "Geral",
    participants: [],
    serverId: null,
    status: "ACTIVE" as RoomStatus,
    type: "CALL" as RoomType,
    updatedAt: now,
    ...overrides,
  };
}

function repository(overrides: Partial<RoomServiceRepository> = {}): RoomServiceRepository {
  return {
    async create(data: CreateRoomData) {
      return room({
        channelId: data.channelId ?? null,
        hostId: data.hostId ?? null,
        hostTokenHash: data.hostTokenHash,
        name: data.name ?? null,
        serverId: data.serverId ?? null,
        type: data.type,
      });
    },
    async createParticipant(data: CreateParticipantData) {
      return {
        displayName: data.displayName,
        guestIdentity: data.guestIdentity,
        id: "participant-id",
        joinedAt: now,
        leftAt: null,
        role: data.role as ParticipantRole,
        roomId: data.roomId,
        userId: data.userId ?? null,
      };
    },
    async endRoom(roomId: string) {
      return room({ endedAt: now, id: roomId, status: "ENDED" });
    },
    async findByCode() {
      return room();
    },
    async findParticipantById() {
      return null;
    },
    async findServerMember() {
      return null;
    },
    async findVoiceChannel() {
      return null;
    },
    ...overrides,
  };
}

describe("RoomService permissions", () => {
  it("requires an authenticated member to create a server room", async () => {
    const service = new RoomService(repository());

    await assert.rejects(
      service.createRoom({
        channelId: "00000000-0000-4000-8000-000000000002",
        name: "Geral",
        serverId: "00000000-0000-4000-8000-000000000001",
        type: "CALL",
      }),
      NotAuthorizedError,
    );
  });

  it("requires the voice channel to belong to the server", async () => {
    const service = new RoomService(
      repository({
        async findServerMember() {
          return {
            id: "member-id",
            joinedAt: now,
            role: "PARTICIPANT",
            serverId: "00000000-0000-4000-8000-000000000001",
            userId: "user-id",
          };
        },
      }),
    );

    await assert.rejects(
      service.createRoom(
        {
          channelId: "00000000-0000-4000-8000-000000000002",
          name: "Geral",
          serverId: "00000000-0000-4000-8000-000000000001",
          type: "CALL",
        },
        { id: "user-id" },
      ),
      ChannelNotFoundError,
    );
  });

  it("requires an authenticated member to join a server room", async () => {
    const service = new RoomService(
      repository({
        async findByCode() {
          return room({ serverId: "00000000-0000-4000-8000-000000000001" });
        },
      }),
    );

    await assert.rejects(
      service.joinRoom("ABC123", {
        displayName: "Guest User",
      }),
      NotAuthorizedError,
    );
  });
});
