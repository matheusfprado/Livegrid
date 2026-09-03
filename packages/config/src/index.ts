import { z } from "zod";

const optionalUrl = z.preprocess((value) => (value === "" ? undefined : value), z.string().url().optional());
const optionalSecret = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z
    .string()
    .refine((value) => !value.includes("•") && !value.includes("â€¢"), "Replace masked secrets with the real value.")
    .optional(),
);
const hasNoPlaceholder = (value: string) =>
  !value.includes("YOUR_PASSWORD") &&
  !value.includes("PROJECT_REF") &&
  !value.includes("abcdefghijklmnopqrst");
const databaseUrl = z
  .string()
  .url()
  .refine(hasNoPlaceholder, "Replace Supabase database placeholders with real project credentials.");
const optionalDatabaseUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().refine(hasNoPlaceholder, "Replace Supabase database placeholders with real project credentials.").optional(),
);

export const roomLimits = {
  codeLength: 6,
  maxParticipants: 100,
  maxScreenSharesPerParticipant: 8,
} as const;

export const apiEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: databaseUrl,
  DIRECT_URL: optionalDatabaseUrl,
  LIVEKIT_URL: optionalUrl,
  LIVEKIT_API_KEY: optionalSecret,
  LIVEKIT_API_SECRET: optionalSecret,
  WEB_URL: z.string().url().default("http://localhost:3000"),
});

export const webEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),
  NEXT_PUBLIC_LIVEKIT_URL: optionalUrl,
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
