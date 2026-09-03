import type { ParticipantRole, RoomStatus, RoomType, ServerMessageSummary, UserSummary } from "@livegrid/types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export type RoomSummaryDto = {
  id: string;
  code: string;
  name: string | null;
  type: RoomType;
  status: RoomStatus;
  serverId: string | null;
  channelId: string | null;
  createdAt: string;
  endedAt: string | null;
};

export type ServerDto = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  channels: Array<{ activeRoom: RoomSummaryDto | null; id: string; serverId: string; name: string }>;
  textChannels: Array<{ createdAt: string; id: string; serverId: string; name: string }>;
  members: Array<{
    id: string;
    role: string;
    user: UserSummary;
  }>;
};

export type ParticipantDto = {
  id: string;
  displayName: string;
  role: ParticipantRole;
  guestIdentity: string | null;
  joinedAt: string;
  leftAt: string | null;
};

async function requestJson<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  const token = typeof window === "undefined" ? null : window.localStorage.getItem("livegrid:session");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers,
  });

  const body = (await response.json()) as unknown;

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "object" &&
      body.error !== null &&
      "message" in body.error &&
      typeof body.error.message === "string"
        ? body.error.message
        : "Nao foi possivel concluir a acao.";
    throw new Error(message);
  }

  return body as TResponse;
}

export function createRoom(input: { name?: string; type: RoomType }) {
  return requestJson<{ room: RoomSummaryDto; hostToken: string }>("/rooms", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function register(input: { name: string; email: string; password: string }) {
  return requestJson<{ token: string; user: UserSummary }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: { email: string; password: string }) {
  return requestJson<{ token: string; user: UserSummary }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getMe() {
  return requestJson<{ user: UserSummary }>("/auth/me");
}

export function listServers() {
  return requestJson<{ servers: ServerDto[] }>("/servers");
}

export function createServer(input: { name: string }) {
  return requestJson<{ server: ServerDto }>("/servers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getServer(serverId: string) {
  return requestJson<{ server: ServerDto }>(`/servers/${serverId}`);
}

export function createInvite(serverId: string) {
  return requestJson<{ invite: { id: string; code: string; serverId: string; createdAt: string; expiresAt: string | null } }>(
    `/servers/${serverId}/invites`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}

export function createTextChannel(serverId: string, input: { name: string }) {
  return requestJson<{ channel: { createdAt: string; id: string; serverId: string; name: string } }>(
    `/servers/${serverId}/text-channels`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function createVoiceChannel(serverId: string, input: { name: string }) {
  return requestJson<{ channel: { activeRoom: RoomSummaryDto | null; id: string; serverId: string; name: string } }>(
    `/servers/${serverId}/voice-channels`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function listMessages(serverId: string, channelId: string) {
  return requestJson<{ messages: ServerMessageSummary[] }>(`/servers/${serverId}/text-channels/${channelId}/messages`);
}

export function createMessage(serverId: string, channelId: string, input: { content: string }) {
  return requestJson<{ message: ServerMessageSummary }>(`/servers/${serverId}/text-channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function joinServer(inviteCode: string) {
  return requestJson<{ server: ServerDto }>("/servers/join", {
    method: "POST",
    body: JSON.stringify({ inviteCode }),
  });
}

export function createServerCall(input: { name: string; serverId: string; channelId: string }) {
  return requestJson<{ room: RoomSummaryDto; hostToken: string }>("/rooms", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      type: "CALL",
      serverId: input.serverId,
      channelId: input.channelId,
    }),
  });
}

export function getRoom(code: string) {
  return requestJson<{ room: RoomSummaryDto; participants: ParticipantDto[] }>(`/rooms/${code}`);
}

export function joinRoom(code: string, input: { displayName: string; hostToken?: string }) {
  return requestJson<{ participant: ParticipantDto }>(`/rooms/${code}/join`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createRoomToken(code: string, participantId: string) {
  return requestJson<{ token: string; liveKitUrl: string }>(`/rooms/${code}/token`, {
    method: "POST",
    body: JSON.stringify({ participantId }),
  });
}

export function endRoom(code: string, hostToken: string) {
  return requestJson<{ room: RoomSummaryDto }>(`/rooms/${code}/end`, {
    method: "POST",
    body: JSON.stringify({ hostToken }),
  });
}
