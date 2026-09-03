import { prisma } from "@livegrid/database";
import type { ParticipantRole, RoomType } from "@livegrid/types";

export type CreateRoomData = {
  code: string;
  name?: string;
  type: RoomType;
  hostTokenHash: string;
  hostId?: string;
  serverId?: string;
  channelId?: string;
};

export type CreateParticipantData = {
  roomId: string;
  userId?: string;
  guestIdentity: string;
  displayName: string;
  role: ParticipantRole;
};

export class RoomRepository {
  async create(data: CreateRoomData) {
    return prisma.room.create({
      data,
    });
  }

  async findByCode(code: string) {
    return prisma.room.findUnique({
      where: { code },
      include: {
        participants: {
          where: { leftAt: null },
          orderBy: { joinedAt: "asc" },
        },
      },
    });
  }

  async findParticipantById(participantId: string) {
    return prisma.roomParticipant.findUnique({
      where: { id: participantId },
      include: { room: true },
    });
  }

  async createParticipant(data: CreateParticipantData) {
    return prisma.roomParticipant.create({
      data,
    });
  }

  async findServerMember(serverId: string, userId: string) {
    return prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId,
          userId,
        },
      },
    });
  }

  async findVoiceChannel(serverId: string, channelId: string) {
    return prisma.voiceChannel.findFirst({
      where: {
        id: channelId,
        serverId,
      },
    });
  }

  async endRoom(roomId: string) {
    return prisma.room.update({
      where: { id: roomId },
      data: {
        status: "ENDED",
        endedAt: new Date(),
      },
    });
  }
}
