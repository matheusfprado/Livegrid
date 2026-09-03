import { prisma } from "@livegrid/database";

const activeRoomSelect = {
  id: true,
  code: true,
  name: true,
  type: true,
  status: true,
  serverId: true,
  channelId: true,
  createdAt: true,
  endedAt: true,
} as const;

export class ServerRepository {
  async createServer(data: { name: string; ownerId: string }) {
    return prisma.appServer.create({
      data: {
        name: data.name,
        ownerId: data.ownerId,
        members: {
          create: {
            userId: data.ownerId,
            role: "HOST",
          },
        },
        channels: {
          create: {
            name: "Geral",
          },
        },
        textChannels: {
          create: {
            name: "geral",
          },
        },
      },
      include: {
        channels: {
          include: {
            rooms: {
              where: { status: "ACTIVE" },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: activeRoomSelect,
            },
          },
        },
        textChannels: {
          orderBy: { createdAt: "asc" },
        },
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async listForUser(userId: string) {
    return prisma.appServer.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        channels: {
          include: {
            rooms: {
              where: { status: "ACTIVE" },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: activeRoomSelect,
            },
          },
        },
        textChannels: {
          orderBy: { createdAt: "asc" },
        },
        members: {
          include: {
            user: true,
          },
          orderBy: {
            joinedAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  async findById(serverId: string) {
    return prisma.appServer.findUnique({
      where: { id: serverId },
      include: {
        channels: {
          include: {
            rooms: {
              where: { status: "ACTIVE" },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: activeRoomSelect,
            },
          },
        },
        textChannels: {
          orderBy: { createdAt: "asc" },
        },
        members: {
          include: {
            user: true,
          },
          orderBy: {
            joinedAt: "asc",
          },
        },
      },
    });
  }

  async ensureDefaultTextChannel(serverId: string) {
    const channel = await prisma.textChannel.findFirst({
      where: { serverId },
      orderBy: { createdAt: "asc" },
    });

    if (channel) {
      return channel;
    }

    return prisma.textChannel.create({
      data: {
        name: "geral",
        serverId,
      },
    });
  }

  async findMember(serverId: string, userId: string) {
    return prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId,
          userId,
        },
      },
    });
  }

  async createInvite(data: { code: string; serverId: string; createdById: string; expiresAt?: Date }) {
    return prisma.serverInvite.create({
      data,
    });
  }

  async findInvite(code: string) {
    return prisma.serverInvite.findUnique({
      where: { code },
      include: { server: true },
    });
  }

  async addMember(serverId: string, userId: string) {
    return prisma.serverMember.upsert({
      where: {
        serverId_userId: {
          serverId,
          userId,
        },
      },
      create: {
        serverId,
        userId,
        role: "PARTICIPANT",
      },
      update: {},
    });
  }

  async createTextChannel(serverId: string, name: string) {
    return prisma.textChannel.create({
      data: {
        name,
        serverId,
      },
    });
  }

  async createVoiceChannel(serverId: string, name: string) {
    return prisma.voiceChannel.create({
      data: {
        name,
        serverId,
      },
      include: {
        rooms: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: activeRoomSelect,
        },
      },
    });
  }

  async findTextChannel(serverId: string, channelId: string) {
    return prisma.textChannel.findFirst({
      where: {
        id: channelId,
        serverId,
      },
    });
  }

  async listMessages(serverId: string, channelId: string) {
    return prisma.serverMessage.findMany({
      where: {
        channelId,
        serverId,
      },
      include: {
        author: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 100,
    });
  }

  async createMessage(data: { authorId: string; channelId: string; content: string; serverId: string }) {
    return prisma.serverMessage.create({
      data,
      include: {
        author: true,
      },
    });
  }
}
