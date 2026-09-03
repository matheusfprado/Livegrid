import type { UserSummary } from "@livegrid/types";
import { loginSchema, registerSchema } from "@livegrid/validation";
import { createSecretToken, hashPassword, hashSecret, verifyPassword } from "../../lib/crypto.js";
import { AuthRepository } from "./repository.js";

export class InvalidCredentialsError extends Error {}
export class EmailAlreadyUsedError extends Error {}

const repository = new AuthRepository();

function serializeUser(user: { id: string; name: string; email: string | null; avatarUrl: string | null }): UserSummary {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}

export class AuthService {
  async register(input: unknown) {
    const data = registerSchema.parse(input);
    const existingUser = await repository.findUserByEmail(data.email);

    if (existingUser) {
      throw new EmailAlreadyUsedError();
    }

    const user = await repository.createUser({
      name: data.name,
      email: data.email,
      passwordHash: hashPassword(data.password),
    });

    return this.createAuthResponse(user);
  }

  async login(input: unknown) {
    const data = loginSchema.parse(input);
    const user = await repository.findUserByEmail(data.email);

    if (!user?.passwordHash || !verifyPassword(data.password, user.passwordHash)) {
      throw new InvalidCredentialsError();
    }

    return this.createAuthResponse(user);
  }

  async getUserByToken(token: string) {
    const session = await repository.findSessionByTokenHash(hashSecret(token));

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return session.user;
  }

  private async createAuthResponse(user: { id: string; name: string; email: string | null; avatarUrl: string | null }) {
    const token = createSecretToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    await repository.createSession({
      tokenHash: hashSecret(token),
      userId: user.id,
      expiresAt,
    });

    return {
      token,
      user: serializeUser(user),
    };
  }
}
