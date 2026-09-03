import { prisma } from "@livegrid/database";

export class AuthRepository {
  async createUser(data: { name: string; email: string; passwordHash: string }) {
    return prisma.user.create({
      data,
    });
  }

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async createSession(data: { tokenHash: string; userId: string; expiresAt: Date }) {
    return prisma.session.create({
      data,
    });
  }

  async findSessionByTokenHash(tokenHash: string) {
    return prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }
}
