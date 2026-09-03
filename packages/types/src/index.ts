export type RoomType = "CALL" | "BROADCAST";

export type RoomStatus = "ACTIVE" | "ENDED";

export type ParticipantRole = "HOST" | "PRESENTER" | "PARTICIPANT" | "VIEWER";

export type MediaTrackType = "CAMERA" | "MICROPHONE" | "SCREEN_SHARE";

export type MediaTrack = {
  id: string;
  participantId: string;
  type: MediaTrackType;
  isMuted: boolean;
  createdAt: Date;
};

export type ScreenShareTrack = MediaTrack & {
  type: "SCREEN_SHARE";
  participantName: string;
  label?: string;
  source: "SCREEN_SHARE";
};

export type ParticipantMedia = {
  participantId: string;
  cameraTracks: MediaTrack[];
  microphoneTracks: MediaTrack[];
  screenShareTracks: ScreenShareTrack[];
};

export type RoomSummary = {
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

export type RoomParticipantSummary = {
  id: string;
  displayName: string;
  role: ParticipantRole;
  guestIdentity: string | null;
  joinedAt: string;
  leftAt: string | null;
};

export type UserSummary = {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
};

export type ServerSummary = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
};

export type VoiceChannelSummary = {
  id: string;
  serverId: string;
  name: string;
  activeRoom: RoomSummary | null;
};

export type TextChannelSummary = {
  id: string;
  serverId: string;
  name: string;
  createdAt: string;
};

export type ServerMessageSummary = {
  id: string;
  serverId: string;
  channelId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: UserSummary;
};

export type ServerInviteSummary = {
  id: string;
  code: string;
  serverId: string;
  createdAt: string;
  expiresAt: string | null;
};
