"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Hash, LogOut, Plus, Send, UserPlus, Users, Volume2 } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Separator,
} from "@livegrid/ui";
import type { ServerMessageSummary } from "@livegrid/types";
import type { ServerDto } from "@/lib/api";
import {
  createInvite,
  createMessage,
  createServerCall,
  createTextChannel,
  createVoiceChannel,
  getServer,
  listMessages,
  listServers,
} from "@/lib/api";

const hostTokenKey = (code: string) => `livegrid:${code}:hostToken`;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function ServerShell({ serverId }: { serverId: string }) {
  const router = useRouter();
  const [server, setServer] = useState<ServerDto | null>(null);
  const [servers, setServers] = useState<ServerDto[]>([]);
  const [selectedTextChannelId, setSelectedTextChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ServerMessageSummary[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [newTextChannelName, setNewTextChannelName] = useState("");
  const [newVoiceChannelName, setNewVoiceChannelName] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingCall, setPendingCall] = useState(false);

  const selectedTextChannel = useMemo(
    () => server?.textChannels.find((channel) => channel.id === selectedTextChannelId) ?? server?.textChannels[0] ?? null,
    [selectedTextChannelId, server?.textChannels],
  );

  const loadServer = useCallback(async () => {
    const [serverResponse, serversResponse] = await Promise.all([getServer(serverId), listServers()]);
    setServer(serverResponse.server);
    setServers(serversResponse.servers);
    setSelectedTextChannelId((current) => current ?? serverResponse.server.textChannels[0]?.id ?? null);
  }, [serverId]);

  useEffect(() => {
    loadServer().catch((cause) => {
      setError(cause instanceof Error ? cause.message : "Nao foi possivel carregar o servidor.");
    });
  }, [loadServer]);

  useEffect(() => {
    if (!selectedTextChannel) {
      setMessages([]);
      return;
    }

    let active = true;

    listMessages(serverId, selectedTextChannel.id)
      .then((response) => {
        if (active) {
          setMessages(response.messages);
        }
      })
      .catch((cause) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Nao foi possivel carregar mensagens.");
        }
      });

    return () => {
      active = false;
    };
  }, [selectedTextChannel, serverId]);

  function logout() {
    window.localStorage.removeItem("livegrid:session");
    router.push("/");
  }

  async function handleInvite() {
    if (!server) {
      return;
    }

    const response = await createInvite(server.id);
    const url = `${window.location.origin}/?invite=${response.invite.code}`;
    setInviteUrl(url);
    await navigator.clipboard.writeText(url);
  }

  async function handleCreateTextChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!server) {
      return;
    }

    const response = await createTextChannel(server.id, { name: newTextChannelName });
    setServer((current) =>
      current ? { ...current, textChannels: [...current.textChannels, response.channel] } : current,
    );
    setSelectedTextChannelId(response.channel.id);
    setNewTextChannelName("");
  }

  async function handleCreateVoiceChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!server) {
      return;
    }

    const response = await createVoiceChannel(server.id, { name: newVoiceChannelName });
    setServer((current) => (current ? { ...current, channels: [...current.channels, response.channel] } : current));
    setNewVoiceChannelName("");
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!server || !selectedTextChannel || !messageContent.trim()) {
      return;
    }

    const response = await createMessage(server.id, selectedTextChannel.id, { content: messageContent });
    setMessages((current) => [...current, response.message]);
    setMessageContent("");
  }

  async function startCall(channelId: string) {
    if (!server) {
      return;
    }

    const channel = server.channels.find((item) => item.id === channelId);

    if (channel?.activeRoom) {
      router.push(`/room/${channel.activeRoom.code}`);
      return;
    }

    setPendingCall(true);
    setError(null);

    try {
      const response = await createServerCall({
        channelId,
        name: channel?.name ?? server.name,
        serverId: server.id,
      });
      window.localStorage.setItem(hostTokenKey(response.room.code), response.hostToken);
      router.push(`/room/${response.room.code}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nao foi possivel iniciar a chamada.");
    } finally {
      setPendingCall(false);
    }
  }

  return (
    <main className="grid min-h-dvh bg-[#1e1f22] text-zinc-50 lg:grid-cols-[72px_320px_minmax(0,1fr)_280px]">
      <aside className="hidden bg-[#1e1f22] p-3 lg:flex lg:flex-col lg:items-center lg:gap-3">
        {servers.map((item) => (
          <button
            aria-label={`Abrir ${item.name}`}
            className={`inline-flex size-12 items-center justify-center rounded-2xl text-sm font-semibold transition-colors hover:rounded-xl ${
              item.id === serverId ? "bg-[#5865f2] text-white" : "bg-[#313338] text-zinc-200 hover:bg-[#5865f2]"
            }`}
            key={item.id}
            onClick={() => router.push(`/servers/${item.id}`)}
            type="button"
          >
            {initials(item.name) || item.name.slice(0, 2).toUpperCase()}
          </button>
        ))}
        <button
          aria-label="Voltar ao inicio"
          className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#313338] text-[#23a559] transition-colors hover:rounded-xl hover:bg-[#23a559] hover:text-white"
          onClick={() => router.push("/")}
          type="button"
        >
          <Plus aria-hidden="true" size={21} />
        </button>
      </aside>

      <aside className="hidden min-h-dvh flex-col bg-[#2b2d31] lg:flex">
        <div className="flex min-h-14 items-center justify-between border-b border-black/30 px-4">
          <h1 className="truncate text-sm font-semibold">{server?.name ?? "Servidor"}</h1>
          <Button aria-label="Sair" onClick={logout} size="icon" variant="ghost">
            <LogOut aria-hidden="true" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto px-3 py-4">
          <nav className="space-y-1" aria-label="Canais">
            <div className="flex items-center justify-between px-2 text-xs font-semibold uppercase text-zinc-500">
              <span>Canais de texto</span>
              <Dialog>
                <DialogTrigger asChild>
                  <Button aria-label="Criar canal de texto" className="size-7 min-h-7" size="icon" variant="ghost">
                    <Plus aria-hidden="true" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar canal de texto</DialogTitle>
                    <DialogDescription>Esse canal sera salvo no servidor.</DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleCreateTextChannel}>
                    <Input
                      minLength={2}
                      onChange={(event) => setNewTextChannelName(event.target.value)}
                      placeholder="batepapo"
                      required
                      value={newTextChannelName}
                    />
                    <Button className="w-full" type="submit">
                      Criar canal
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {server?.textChannels.map((channel) => (
              <button
                className={`flex min-h-10 w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                  channel.id === selectedTextChannel?.id
                    ? "bg-[#404249] text-white"
                    : "text-zinc-300 hover:bg-[#404249] hover:text-white"
                }`}
                key={channel.id}
                onClick={() => setSelectedTextChannelId(channel.id)}
                type="button"
              >
                <Hash aria-hidden="true" size={17} />
                <span className="truncate">{channel.name}</span>
              </button>
            ))}

            <div className="mt-5 flex items-center justify-between px-2 text-xs font-semibold uppercase text-zinc-500">
              <span>Canais de voz</span>
              <Dialog>
                <DialogTrigger asChild>
                  <Button aria-label="Criar canal de voz" className="size-7 min-h-7" size="icon" variant="ghost">
                    <Plus aria-hidden="true" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar canal de voz</DialogTitle>
                    <DialogDescription>Ao entrar nele, a chamada LiveKit e aberta.</DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleCreateVoiceChannel}>
                    <Input
                      minLength={2}
                      onChange={(event) => setNewVoiceChannelName(event.target.value)}
                      placeholder="Geral"
                      required
                      value={newVoiceChannelName}
                    />
                    <Button className="w-full" type="submit">
                      Criar canal
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {server?.channels.map((channel) => (
              <button
                className="flex min-h-10 w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-[#404249] hover:text-white"
                disabled={pendingCall}
                key={channel.id}
                onClick={() => void startCall(channel.id)}
                type="button"
              >
                <Volume2 aria-hidden="true" size={17} />
                <span className="truncate">{channel.name}</span>
                {channel.activeRoom ? (
                  <Badge className="ml-auto rounded bg-red-500 text-white" variant="destructive">
                    AO VIVO
                  </Badge>
                ) : null}
              </button>
            ))}
          </nav>
        </div>

        <div className="border-t border-black/30 bg-[#232428] p-3">
          <div className="flex items-center gap-2">
            <Avatar className="size-9">
              <AvatarFallback className="bg-[#5865f2] text-white">{initials(server?.name ?? "LG") || "LG"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{server?.name ?? "Livegrid"}</p>
              <p className="truncate text-xs text-[#23a559]">Servidor ativo</p>
            </div>
            <Button aria-label="Sair" onClick={logout} size="icon" variant="ghost">
              <LogOut aria-hidden="true" />
            </Button>
          </div>
        </div>
      </aside>

      <section className="flex min-h-dvh min-w-0 flex-col bg-[#313338]">
        <header className="flex min-h-14 items-center justify-between border-b border-black/30 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Hash aria-hidden="true" className="text-zinc-400" size={20} />
            <h2 className="truncate text-sm font-semibold">{selectedTextChannel?.name ?? "geral"}</h2>
          </div>
          <Button onClick={() => void handleInvite()} variant="secondary">
            <UserPlus aria-hidden="true" size={18} />
            Convidar
          </Button>
        </header>

        <div className="grid gap-3 border-b border-black/30 bg-[#2b2d31] p-3 lg:hidden">
          <label className="text-xs font-semibold uppercase text-zinc-400" htmlFor="mobile-server">
            Servidor
          </label>
          <select
            className="min-h-10 rounded-md border border-zinc-700 bg-[#1e1f22] px-3 text-sm text-zinc-100"
            id="mobile-server"
            onChange={(event) => router.push(`/servers/${event.target.value}`)}
            value={serverId}
          >
            {servers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <label className="text-xs font-semibold uppercase text-zinc-400" htmlFor="mobile-text-channel">
            Canal de texto
          </label>
          <select
            className="min-h-10 rounded-md border border-zinc-700 bg-[#1e1f22] px-3 text-sm text-zinc-100"
            disabled={!server?.textChannels.length}
            id="mobile-text-channel"
            onChange={(event) => setSelectedTextChannelId(event.target.value)}
            value={selectedTextChannel?.id ?? ""}
          >
            {server?.textChannels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                #{channel.name}
              </option>
            ))}
          </select>

          <label className="text-xs font-semibold uppercase text-zinc-400" htmlFor="mobile-voice-channel">
            Entrar em voz
          </label>
          <select
            className="min-h-10 rounded-md border border-zinc-700 bg-[#1e1f22] px-3 text-sm text-zinc-100"
            disabled={pendingCall || !server?.channels.length}
            id="mobile-voice-channel"
            onChange={(event) => {
              if (event.target.value) {
                void startCall(event.target.value);
              }
            }}
            value=""
          >
            <option value="">Escolha um canal</option>
            {server?.channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.activeRoom ? `${channel.name} - ao vivo` : channel.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-auto px-4 py-5">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col justify-end pb-6">
              <div className="flex size-16 items-center justify-center rounded-full bg-[#2b2d31]">
                <Hash aria-hidden="true" className="text-zinc-400" size={30} />
              </div>
              <h3 className="mt-4 text-3xl font-bold">Boas-vindas a #{selectedTextChannel?.name ?? "geral"}</h3>
              <p className="mt-2 text-sm text-zinc-400">Este e o inicio do canal. Envie a primeira mensagem.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((message) => (
                <article className="flex gap-3" key={message.id}>
                  <Avatar className="size-10">
                    <AvatarFallback>{initials(message.author.name) || "LG"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-semibold text-zinc-100">{message.author.name}</span>
                      <span className="text-xs text-zinc-500">{formatTime(message.createdAt)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-200">{message.content}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
          {inviteUrl ? (
            <div className="mt-5 rounded-md border border-[#23a559]/40 bg-[#23a559]/10 p-3 text-sm text-emerald-100">
              <div className="flex items-center gap-2">
                <Copy aria-hidden="true" size={16} />
                Link copiado: {inviteUrl}
              </div>
            </div>
          ) : null}
          {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
        </div>

        <form className="border-t border-black/30 p-4" onSubmit={handleSendMessage}>
          <div className="flex items-center gap-3 rounded-lg bg-[#383a40] px-3 py-2">
            <Input
              className="min-h-10 border-none bg-transparent px-0 focus:border-none"
              disabled={!selectedTextChannel}
              onChange={(event) => setMessageContent(event.target.value)}
              placeholder={`Conversar em #${selectedTextChannel?.name ?? "geral"}`}
              value={messageContent}
            />
            <Button aria-label="Enviar mensagem" disabled={!selectedTextChannel || !messageContent.trim()} size="icon" type="submit">
              <Send aria-hidden="true" />
            </Button>
          </div>
        </form>
      </section>

      <aside className="hidden border-l border-black/30 bg-[#2b2d31] px-4 py-5 lg:block">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase text-zinc-400">
          <Users aria-hidden="true" size={16} />
          Membros
        </div>
        <Separator className="my-4" />
        <div className="space-y-2">
          {server?.members.map((member) => (
            <div className="flex items-center gap-2 rounded-md px-2 py-2 text-sm" key={member.id}>
              <Avatar className="size-8">
                <AvatarFallback>{initials(member.user.name) || "LG"}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-zinc-200">{member.user.name}</span>
              <Badge variant={member.role === "HOST" ? "success" : "secondary"}>{member.role}</Badge>
            </div>
          ))}
        </div>
      </aside>
    </main>
  );
}
