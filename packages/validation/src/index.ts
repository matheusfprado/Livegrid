import { z } from "zod";

export const roomTypeSchema = z.enum(["CALL", "BROADCAST"]);
export const roomStatusSchema = z.enum(["ACTIVE", "ENDED"]);
export const participantRoleSchema = z.enum(["HOST", "PRESENTER", "PARTICIPANT", "VIEWER"]);

export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6}$/, "Room code must contain 6 uppercase letters or digits.");

export const displayNameSchema = z.string().trim().min(2).max(80);
export const emailSchema = z.email().trim().toLowerCase();
export const passwordSchema = z.string().min(8).max(120);
export const serverNameSchema = z.string().trim().min(2).max(80);
export const inviteCodeSchema = z.string().trim().min(8).max(24);
export const channelNameSchema = z.string().trim().min(2).max(40);
export const messageContentSchema = z.string().trim().min(1).max(2000);

export const registerSchema = z.object({
  name: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const createRoomSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  type: roomTypeSchema,
  serverId: z.uuid().optional(),
  channelId: z.uuid().optional(),
});

export const joinRoomSchema = z.object({
  displayName: displayNameSchema,
  hostToken: z.string().min(32).optional(),
});

export const roomTokenSchema = z.object({
  participantId: z.string().uuid(),
});

export const endRoomSchema = z.object({
  hostToken: z.string().min(32),
});

export const createServerSchema = z.object({
  name: serverNameSchema,
});

export const createInviteSchema = z.object({
  expiresInHours: z.number().int().positive().max(24 * 30).optional(),
});

export const joinServerByInviteSchema = z.object({
  inviteCode: inviteCodeSchema,
});

export const createChannelSchema = z.object({
  name: channelNameSchema,
});

export const createMessageSchema = z.object({
  content: messageContentSchema,
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type RoomTokenInput = z.infer<typeof roomTokenSchema>;
export type EndRoomInput = z.infer<typeof endRoomSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateServerInput = z.infer<typeof createServerSchema>;
export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type JoinServerByInviteInput = z.infer<typeof joinServerByInviteSchema>;
export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
