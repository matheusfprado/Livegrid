"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Copy,
  Grid2X2,
  Hash,
  Headphones,
  LogOut,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  ScreenShare,
  ScreenShareOff,
  Settings,
  Signal,
  UserPlus,
  Users,
  VideoOff,
  Volume2,
} from "lucide-react";
import {
  LocalTrack,
  RemoteTrack,
  Room,
  RoomEvent,
  Track,
  type LocalTrackPublication,
  type RemoteParticipant,
  type RemoteTrackPublication,
} from "livekit-client";
import { Avatar, AvatarFallback, Badge, Button, Card, CardHeader, CardTitle, Input, Separator } from "@livegrid/ui";
import type { ParticipantDto, RoomSummaryDto } from "@/lib/api";
import { createRoomToken, endRoom, getRoom, joinRoom } from "@/lib/api";

type ConnectionState = "lobby" | "connecting" | "connected" | "media-unconfigured" | "error";

type RenderTrack = {
  key: string;
  participantName: string;
  label: string;
  source: Track.Source;
  track: RemoteTrack | LocalTrack;
};

const hostTokenKey = (code: string) => `livegrid:${code}:hostToken`;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function VideoTrackView({ featured = false, renderTrack }: { featured?: boolean; renderTrack: RenderTrack }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element || renderTrack.track.kind !== Track.Kind.Video) {
      return;
    }

    renderTrack.track.attach(element);

    return () => {
      renderTrack.track.detach(element);
    };
  }, [renderTrack.track]);

  return (
    <article
      className={
        featured
          ? "group relative flex min-h-[360px] overflow-hidden bg-black md:min-h-[520px]"
          : "group relative h-28 min-w-44 overflow-hidden rounded-lg bg-[#18191c] ring-1 ring-white/10"
      }
    >
      <video ref={ref} autoPlay className="size-full object-contain" playsInline />
      <div className="absolute bottom-3 left-3 inline-flex max-w-[80%] items-center gap-2 rounded-md bg-black/75 px-2 py-1 text-xs font-semibold text-zinc-100">
        {renderTrack.source === Track.Source.ScreenShare ? (
          <MonitorUp aria-hidden="true" size={14} />
        ) : (
          <Camera aria-hidden="true" size={14} />
        )}
        <span className="truncate">{renderTrack.participantName}</span>
      </div>
      {featured ? (
        <Badge className="absolute right-4 top-4 rounded-md bg-red-500 text-white" variant="destructive">
          AO VIVO
        </Badge>
      ) : null}
    </article>
  );
}

function ParticipantTile({ name }: { name: string }) {
  return (
    <article className="flex h-28 min-w-40 flex-col items-center justify-center gap-2 rounded-lg bg-[#2b2d31] px-3 ring-1 ring-white/10">
      <Avatar className="size-14">
        <AvatarFallback className="bg-[#5865f2] text-white">{initials(name) || "LG"}</AvatarFallback>
      </Avatar>
      <span className="max-w-full truncate text-sm font-medium text-zinc-100">{name}</span>
    </article>
  );
}

function EmptyStage({ canPublish }: { canPublish: boolean }) {
  return (
    <div className="flex min-h-[360px] flex-1 flex-col items-center justify-center gap-4 bg-[#111214] p-6 text-center md:min-h-[520px]">
      <div className="flex size-20 items-center justify-center rounded-full bg-[#313338] text-zinc-300">
        <MonitorUp aria-hidden="true" size={34} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">Nenhuma tela transmitindo</h3>
        <p className="mt-1 text-sm text-zinc-400">
          {canPublish ? "Compartilhe sua tela ou ative a camera para aparecer aqui." : "Aguarde alguem iniciar a transmissao."}
        </p>
      </div>
    </div>
  );
}

export function RoomExperience({ code }: { code: string }) {
  const [roomInfo, setRoomInfo] = useState<RoomSummaryDto | null>(null);
  const [participants, setParticipants] = useState<ParticipantDto[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [participant, setParticipant] = useState<ParticipantDto | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("lobby");
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [micEnabled, setMicEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [renderTracks, setRenderTracks] = useState<RenderTrack[]>([]);
  const [localScreenShares, setLocalScreenShares] = useState<LocalTrackPublication[]>([]);

  const hostToken = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(hostTokenKey(code));
  }, [code]);

  const isHost = participant?.role === "HOST";
  const canPublish = participant?.role !== "VIEWER";
  const screenTracks = renderTracks.filter((renderTrack) => renderTrack.source === Track.Source.ScreenShare);
  const cameraTracks = renderTracks.filter((renderTrack) => renderTrack.source !== Track.Source.ScreenShare);
  const featuredTrack = screenTracks[0] ?? cameraTracks[0] ?? null;
  const thumbnailTracks = renderTracks.filter((renderTrack) => renderTrack.key !== featuredTrack?.key);
  const activeParticipants = useMemo(() => {
    const byId = new Map<string, ParticipantDto>();

    [...participants, ...(participant ? [participant] : [])].forEach((item) => {
      byId.set(item.id, item);
    });

    return Array.from(byId.values());
  }, [participant, participants]);

  useEffect(() => {
    let active = true;

    getRoom(code)
      .then((response) => {
        if (!active) {
          return;
        }

        setRoomInfo(response.room);
        setParticipants(response.participants);
      })
      .catch((cause) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Sala nao encontrada.");
        }
      });

    return () => {
      active = false;
    };
  }, [code]);

  function refreshTracks(activeRoom: Room) {
    const tracks: RenderTrack[] = [];

    activeRoom.remoteParticipants.forEach((remoteParticipant: RemoteParticipant) => {
      remoteParticipant.trackPublications.forEach((publication: RemoteTrackPublication) => {
        if (!publication.track || publication.track.kind !== Track.Kind.Video) {
          return;
        }

        tracks.push({
          key: `${remoteParticipant.identity}:${publication.trackSid}`,
          participantName: remoteParticipant.name || remoteParticipant.identity,
          label: publication.source === Track.Source.ScreenShare ? publication.trackName || "Tela" : "Camera",
          source: publication.source,
          track: publication.track,
        });
      });
    });

    activeRoom.localParticipant.trackPublications.forEach((publication: LocalTrackPublication) => {
      if (!publication.track || publication.track.kind !== Track.Kind.Video) {
        return;
      }

      tracks.push({
        key: `local:${publication.trackSid}`,
        participantName: participant?.displayName ?? "Voce",
        label: publication.source === Track.Source.ScreenShare ? publication.trackName || "Tela" : "Camera",
        source: publication.source,
        track: publication.track,
      });
    });

    setRenderTracks(tracks);
  }

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setConnectionState("connecting");

    try {
      const joined = await joinRoom(code, {
        displayName,
        hostToken: hostToken ?? undefined,
      });
      setParticipant(joined.participant);

      const tokenResponse = await createRoomToken(code, joined.participant.id);
      const livekitRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      livekitRoom
        .on(RoomEvent.TrackSubscribed, () => refreshTracks(livekitRoom))
        .on(RoomEvent.TrackUnsubscribed, () => refreshTracks(livekitRoom))
        .on(RoomEvent.LocalTrackPublished, () => refreshTracks(livekitRoom))
        .on(RoomEvent.LocalTrackUnpublished, () => refreshTracks(livekitRoom))
        .on(RoomEvent.ParticipantConnected, () => refreshTracks(livekitRoom))
        .on(RoomEvent.ParticipantDisconnected, () => refreshTracks(livekitRoom))
        .on(RoomEvent.Disconnected, () => setConnectionState("lobby"));

      await livekitRoom.connect(tokenResponse.liveKitUrl, tokenResponse.token);
      setRoom(livekitRoom);
      setConnectionState("connected");
      refreshTracks(livekitRoom);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Nao foi possivel entrar na sala.";
      setError(message);
      setConnectionState(message.includes("LiveKit") ? "media-unconfigured" : "error");
    }
  }

  async function toggleMicrophone() {
    if (!room || !canPublish) {
      return;
    }

    const nextValue = !micEnabled;
    await room.localParticipant.setMicrophoneEnabled(nextValue);
    setMicEnabled(nextValue);
  }

  async function toggleCamera() {
    if (!room || !canPublish) {
      return;
    }

    const nextValue = !cameraEnabled;
    await room.localParticipant.setCameraEnabled(nextValue);
    setCameraEnabled(nextValue);
    refreshTracks(room);
  }

  async function shareAnotherScreen() {
    if (!room || !canPublish) {
      return;
    }

    const stream = await navigator.mediaDevices.getDisplayMedia({
      audio: false,
      video: true,
    });
    const [track] = stream.getVideoTracks();

    if (!track) {
      return;
    }

    const publication = await room.localParticipant.publishTrack(track, {
      name: track.label || `Tela ${localScreenShares.length + 1}`,
      source: Track.Source.ScreenShare,
    });

    setLocalScreenShares((current) => [...current, publication]);
    track.addEventListener("ended", () => {
      void room.localParticipant.unpublishTrack(track);
      setLocalScreenShares((current) => current.filter((item) => item.trackSid !== publication.trackSid));
      refreshTracks(room);
    });
    refreshTracks(room);
  }

  async function stopScreenShare(publication: LocalTrackPublication) {
    if (!room || !publication.track) {
      return;
    }

    await room.localParticipant.unpublishTrack(publication.track);
    publication.track.stop();
    setLocalScreenShares((current) => current.filter((item) => item.trackSid !== publication.trackSid));
    refreshTracks(room);
  }

  function disconnect() {
    room?.disconnect();
    setRoom(null);
    setParticipant(null);
    setRenderTracks([]);
    setLocalScreenShares([]);
    setMicEnabled(false);
    setCameraEnabled(false);
    setConnectionState("lobby");
  }

  async function handleEndRoom() {
    if (!hostToken) {
      return;
    }

    await endRoom(code, hostToken);
    disconnect();
    setRoomInfo((current) => (current ? { ...current, status: "ENDED", endedAt: new Date().toISOString() } : current));
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(window.location.href);
  }

  if (connectionState !== "connected") {
    return (
      <main className="grid min-h-dvh bg-[#1e1f22] text-zinc-50 lg:grid-cols-[72px_320px_1fr]">
        <aside className="hidden bg-[#1e1f22] p-3 lg:flex lg:flex-col lg:items-center lg:gap-3">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#5865f2] text-white">
            <MonitorUp aria-hidden="true" size={24} />
          </span>
        </aside>

        <aside className="hidden bg-[#2b2d31] px-4 py-5 lg:block">
          <div className="flex min-h-12 items-center justify-between">
            <h2 className="truncate text-sm font-semibold">{roomInfo?.name ?? `Sala ${code}`}</h2>
            <Headphones aria-hidden="true" className="text-zinc-400" size={18} />
          </div>
          <Separator className="-mx-4 w-[calc(100%+2rem)]" />
          <div className="mt-4 rounded-md bg-[#404249] px-3 py-2 text-sm text-white">
            <Hash aria-hidden="true" className="mr-2 inline" size={16} />
            lobby
          </div>
        </aside>

        <section className="flex items-center justify-center px-4 py-8">
          <Card className="w-full max-w-lg border-black/30 bg-[#313338]">
            <CardHeader>
              <CardTitle>Entrar na sala {code}</CardTitle>
              <p className="text-sm leading-6 text-zinc-300">
                {roomInfo?.type === "BROADCAST"
                  ? "Broadcast: convidados entram como viewers por padrao."
                  : "Call: convidados entram como participantes."}
              </p>
            </CardHeader>

            <form className="space-y-4" onSubmit={handleJoin}>
              <div>
                <label className="block text-sm font-medium text-zinc-200" htmlFor="display-name">
                  Nome
                </label>
                <Input
                  id="display-name"
                  minLength={2}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Matheus"
                  required
                  value={displayName}
                />
              </div>

              {error ? <p className="text-sm text-red-300">{error}</p> : null}

              {connectionState === "media-unconfigured" ? (
                <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
                  Configure LIVEKIT_URL, LIVEKIT_API_KEY e LIVEKIT_API_SECRET na API para conectar audio/video.
                </p>
              ) : null}

              <Button className="w-full" disabled={connectionState === "connecting"} type="submit">
                {connectionState === "connecting" ? "Conectando..." : "Entrar"}
              </Button>
            </form>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="grid min-h-dvh bg-[#1e1f22] text-zinc-50 lg:grid-cols-[72px_360px_minmax(0,1fr)]">
      <aside className="hidden bg-[#1e1f22] p-3 lg:flex lg:flex-col lg:items-center lg:gap-3">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#5865f2] text-white">
          <MonitorUp aria-hidden="true" size={24} />
        </span>
        <button
          aria-label="Copiar convite"
          className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#313338] text-zinc-300 transition-colors hover:rounded-xl hover:bg-[#5865f2] hover:text-white"
          onClick={() => void copyInvite()}
          type="button"
        >
          <Copy aria-hidden="true" size={21} />
        </button>
        <button
          aria-label="Convidar pessoas"
          className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#313338] text-zinc-300 transition-colors hover:rounded-xl hover:bg-[#23a559] hover:text-white"
          onClick={() => void copyInvite()}
          type="button"
        >
          <UserPlus aria-hidden="true" size={21} />
        </button>
      </aside>

      <aside className="hidden min-h-dvh flex-col bg-[#2b2d31] lg:flex">
        <div className="flex min-h-14 items-center justify-between border-b border-black/30 px-4">
          <h1 className="truncate text-sm font-semibold">{roomInfo?.name ?? `Sala ${code}`}</h1>
          <Button aria-label="Copiar convite" onClick={() => void copyInvite()} size="icon" variant="ghost">
            <UserPlus aria-hidden="true" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto px-3 py-4">
          <nav className="space-y-1" aria-label="Canais da sala">
            <p className="px-2 text-xs font-semibold uppercase text-zinc-500">Canal de voz</p>
            <div className="rounded-md bg-[#404249] px-2 py-2 text-sm text-white">
              <div className="flex items-center gap-2">
                <Volume2 aria-hidden="true" className="text-[#23a559]" size={18} />
                <span className="font-semibold">{roomInfo?.name ?? "Geral"}</span>
                <span className="ml-auto text-xs text-[#23a559]">{activeParticipants.length}</span>
              </div>
              <p className="ml-7 mt-1 truncate text-xs text-zinc-400">Chamada real via LiveKit</p>
            </div>
          </nav>

          <div className="mt-6">
            <div className="flex items-center justify-between px-2 text-xs font-semibold uppercase text-zinc-500">
              <span>Participantes</span>
              <Users aria-hidden="true" size={14} />
            </div>
            <div className="mt-2 space-y-1">
              {activeParticipants.map((item) => (
                <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-300" key={item.id}>
                  <Avatar className="size-7">
                    <AvatarFallback>{initials(item.displayName) || "LG"}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{item.displayName}</span>
                  {item.role === "HOST" ? (
                    <Badge className="ml-auto rounded bg-[#23a559]" variant="success">
                      HOST
                    </Badge>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-black/30 bg-[#232428] p-2">
          <div className="mb-2 rounded-md bg-[#1e1f22] p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#23a559]">
              <Signal aria-hidden="true" size={18} />
              Voz conectada
            </div>
            <p className="mt-1 truncate text-xs text-zinc-400">
              {participant?.displayName} / {roomInfo?.name ?? code}
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              <Button aria-label="Camera" disabled={!canPublish} onClick={() => void toggleCamera()} size="icon" variant="secondary">
                {cameraEnabled ? <Camera aria-hidden="true" /> : <VideoOff aria-hidden="true" />}
              </Button>
              <Button aria-label="Compartilhar tela" disabled={!canPublish} onClick={() => void shareAnotherScreen()} size="icon" variant="secondary">
                <ScreenShare aria-hidden="true" />
              </Button>
              <Button aria-label="Layout" size="icon" variant="secondary">
                <Grid2X2 aria-hidden="true" />
              </Button>
              <Button aria-label="Configurar" size="icon" variant="secondary">
                <Settings aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-1 py-2">
            <Avatar className="size-8">
              <AvatarFallback className="bg-[#5865f2] text-white">
                {initials(participant?.displayName ?? "Voce") || "LG"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{participant?.displayName ?? "Voce"}</p>
              <p className="truncate text-xs text-[#23a559]">Em voz</p>
            </div>
            <Button aria-label="Microfone" disabled={!canPublish} onClick={() => void toggleMicrophone()} size="icon" variant="ghost">
              {micEnabled ? <Mic aria-hidden="true" /> : <MicOff aria-hidden="true" />}
            </Button>
            <Button aria-label="Sair" onClick={disconnect} size="icon" variant="ghost">
              <LogOut aria-hidden="true" />
            </Button>
          </div>
        </div>
      </aside>

      <section className="flex min-h-dvh min-w-0 flex-col bg-[#111214]">
        <div className="flex min-h-9 items-center gap-3 bg-[#7d001b] px-4 text-xs font-semibold text-white">
          <span className="truncate">
            {micEnabled ? "Chamada conectada." : "Microfone desligado. Ative quando quiser falar."}
          </span>
          <Button className="ml-auto h-7 min-h-7 border-white/70 px-3 text-xs" size="sm" variant="outline">
            Configurar
          </Button>
        </div>

        <header className="flex min-h-14 items-center justify-between border-b border-black/30 bg-[#111214] px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Volume2 aria-hidden="true" className="text-zinc-400" size={20} />
            <h2 className="truncate text-base font-semibold">{participant?.displayName ?? "Livegrid"}</h2>
            {featuredTrack ? <span className="truncate text-sm text-zinc-400">transmitindo {featuredTrack.label}</span> : null}
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Badge className="rounded-md bg-[#404249]" variant="secondary">
              1080p 60FPS
            </Badge>
            {featuredTrack ? (
              <Badge className="rounded-md bg-red-500 text-white" variant="destructive">
                AO VIVO
              </Badge>
            ) : null}
          </div>
        </header>

        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black">
            {featuredTrack ? <VideoTrackView featured renderTrack={featuredTrack} /> : <EmptyStage canPublish={canPublish} />}
          </div>

          <div className="border-t border-white/10 bg-[#111214] px-3 py-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {thumbnailTracks.map((renderTrack) => (
                <VideoTrackView key={renderTrack.key} renderTrack={renderTrack} />
              ))}
              {activeParticipants.slice(0, Math.max(1, 6 - thumbnailTracks.length)).map((item) => (
                <ParticipantTile key={item.id} name={item.displayName} />
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-4">
            <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-[#18191c]/95 p-2 shadow-2xl ring-1 ring-white/10">
              <Button aria-label="Alternar microfone" disabled={!canPublish} onClick={() => void toggleMicrophone()} size="icon" variant="secondary">
                {micEnabled ? <Mic aria-hidden="true" /> : <MicOff aria-hidden="true" />}
              </Button>
              <Button aria-label="Alternar camera" disabled={!canPublish} onClick={() => void toggleCamera()} size="icon" variant="secondary">
                {cameraEnabled ? <Camera aria-hidden="true" /> : <VideoOff aria-hidden="true" />}
              </Button>
              <Separator className="h-8 bg-white/10" orientation="vertical" />
              <Button aria-label="Compartilhar tela" disabled={!canPublish} onClick={() => void shareAnotherScreen()} size="icon" variant="secondary">
                <ScreenShare aria-hidden="true" />
              </Button>
              <Button aria-label="Copiar convite" onClick={() => void copyInvite()} size="icon" variant="secondary">
                <UserPlus aria-hidden="true" />
              </Button>
              {localScreenShares.map((publication) => (
                <Button
                  aria-label="Parar compartilhamento"
                  key={publication.trackSid}
                  onClick={() => void stopScreenShare(publication)}
                  size="icon"
                  variant="secondary"
                >
                  <ScreenShareOff aria-hidden="true" />
                </Button>
              ))}
              <Button aria-label="Sair da chamada" onClick={disconnect} size="icon" variant="danger">
                <PhoneOff aria-hidden="true" />
              </Button>
              {isHost ? (
                <Button className="px-3" onClick={() => void handleEndRoom()} size="sm" variant="danger">
                  Encerrar
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
