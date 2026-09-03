-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('CALL', 'BROADCAST');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('HOST', 'PRESENTER', 'PARTICIPANT', 'VIEWER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppServer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppServer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerMember" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ParticipantRole" NOT NULL DEFAULT 'PARTICIPANT',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServerMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceChannel" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextChannel" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TextChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerMessage" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerInvite" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ServerInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "type" "RoomType" NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'ACTIVE',
    "hostId" TEXT,
    "serverId" TEXT,
    "channelId" TEXT,
    "hostTokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomParticipant" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT,
    "guestIdentity" TEXT,
    "displayName" TEXT NOT NULL,
    "role" "ParticipantRole" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "RoomParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "AppServer_ownerId_idx" ON "AppServer"("ownerId");
CREATE UNIQUE INDEX "ServerMember_serverId_userId_key" ON "ServerMember"("serverId", "userId");
CREATE INDEX "ServerMember_userId_idx" ON "ServerMember"("userId");
CREATE INDEX "VoiceChannel_serverId_idx" ON "VoiceChannel"("serverId");
CREATE INDEX "TextChannel_serverId_idx" ON "TextChannel"("serverId");
CREATE INDEX "ServerMessage_serverId_idx" ON "ServerMessage"("serverId");
CREATE INDEX "ServerMessage_channelId_idx" ON "ServerMessage"("channelId");
CREATE INDEX "ServerMessage_authorId_idx" ON "ServerMessage"("authorId");
CREATE UNIQUE INDEX "ServerInvite_code_key" ON "ServerInvite"("code");
CREATE INDEX "ServerInvite_serverId_idx" ON "ServerInvite"("serverId");
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");
CREATE INDEX "Room_serverId_idx" ON "Room"("serverId");
CREATE INDEX "Room_channelId_idx" ON "Room"("channelId");
CREATE INDEX "RoomParticipant_roomId_idx" ON "RoomParticipant"("roomId");
CREATE INDEX "RoomParticipant_userId_idx" ON "RoomParticipant"("userId");
CREATE INDEX "RoomParticipant_guestIdentity_idx" ON "RoomParticipant"("guestIdentity");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AppServer" ADD CONSTRAINT "AppServer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServerMember" ADD CONSTRAINT "ServerMember_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "AppServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServerMember" ADD CONSTRAINT "ServerMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceChannel" ADD CONSTRAINT "VoiceChannel_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "AppServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TextChannel" ADD CONSTRAINT "TextChannel_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "AppServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServerMessage" ADD CONSTRAINT "ServerMessage_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "AppServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServerMessage" ADD CONSTRAINT "ServerMessage_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "TextChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServerMessage" ADD CONSTRAINT "ServerMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServerInvite" ADD CONSTRAINT "ServerInvite_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "AppServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Room" ADD CONSTRAINT "Room_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Room" ADD CONSTRAINT "Room_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "AppServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Room" ADD CONSTRAINT "Room_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "VoiceChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoomParticipant" ADD CONSTRAINT "RoomParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomParticipant" ADD CONSTRAINT "RoomParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
