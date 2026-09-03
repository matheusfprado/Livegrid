import { AccessToken, type VideoGrant } from "livekit-server-sdk";
import type { ParticipantRole } from "@livegrid/types";

export type LiveKitPermission = {
  canPublish: boolean;
  canSubscribe: boolean;
  canPublishData: boolean;
};

export const liveKitIntegrationStatus = "planned" as const;

export function permissionsForRole(role: ParticipantRole): LiveKitPermission {
  if (role === "VIEWER") {
    return {
      canPublish: false,
      canSubscribe: true,
      canPublishData: false,
    };
  }

  return {
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  };
}

export type CreateLiveKitTokenInput = {
  apiKey: string;
  apiSecret: string;
  roomName: string;
  identity: string;
  displayName: string;
  role: ParticipantRole;
};

export async function createLiveKitToken(input: CreateLiveKitTokenInput) {
  const permissions = permissionsForRole(input.role);
  const token = new AccessToken(input.apiKey, input.apiSecret, {
    identity: input.identity,
    name: input.displayName,
  });

  const grant: VideoGrant = {
    room: input.roomName,
    roomJoin: true,
    canPublish: permissions.canPublish,
    canSubscribe: permissions.canSubscribe,
    canPublishData: permissions.canPublishData,
  };

  token.addGrant(grant);

  return token.toJwt();
}
