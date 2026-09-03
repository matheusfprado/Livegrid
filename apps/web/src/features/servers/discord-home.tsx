"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Compass, Hash, LogOut, Plus, Server, UserPlus, Video, Volume2 } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Separator,
} from "@livegrid/ui";
import type { ServerDto } from "@/lib/api";
import { createServer, getMe, joinServer, listServers, login, register } from "@/lib/api";
import type { UserSummary } from "@livegrid/types";

type AuthMode = "login" | "register";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function DiscordHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("login");
  const [user, setUser] = useState<UserSummary | null>(null);
  const [servers, setServers] = useState<ServerDto[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverName, setServerName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function loadAccount() {
    try {
      const response = await getMe();
      setUser(response.user);
      const serverResponse = await listServers();
      setServers(serverResponse.servers);
    } catch {
      window.localStorage.removeItem("livegrid:session");
    }
  }

  useEffect(() => {
    const invite = searchParams.get("invite");

    if (invite) {
      setInviteCode(invite);
    }

    if (window.localStorage.getItem("livegrid:session")) {
      void loadAccount();
    }
  }, [searchParams]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response =
        mode === "register" ? await register({ email, name, password }) : await login({ email, password });
      window.localStorage.setItem("livegrid:session", response.token);
      setUser(response.user);
      const serverResponse = await listServers();
      setServers(serverResponse.servers);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nao foi possivel autenticar.");
    } finally {
      setPending(false);
    }
  }

  async function handleCreateServer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const response = await createServer({ name: serverName });
      setServers((current) => [...current, response.server]);
      setServerName("");
      router.push(`/servers/${response.server.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nao foi possivel criar o servidor.");
    }
  }

  async function handleJoinServer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const response = await joinServer(inviteCode);
      setServers((current) => {
        if (current.some((serverItem) => serverItem.id === response.server.id)) {
          return current;
        }

        return [...current, response.server];
      });
      setInviteCode("");
      router.push(`/servers/${response.server.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Convite invalido.");
    }
  }

  function logout() {
    window.localStorage.removeItem("livegrid:session");
    setUser(null);
    setServers([]);
  }

  if (!user) {
    return (
      <main className="grid min-h-dvh bg-[#1e1f22] text-zinc-50 lg:grid-cols-[minmax(0,1fr)_480px]">
        <section className="hidden min-h-dvh flex-col justify-between bg-[#111214] p-10 lg:flex">
          <div>
            <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-[#5865f2] text-white">
              <Video aria-hidden="true" size={28} />
            </div>
            <h1 className="mt-10 max-w-3xl text-5xl font-bold leading-tight">Livegrid</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">
              Crie servidores, convide pessoas e entre em chamadas com audio, video e transmissao de tela.
            </p>
          </div>

          <div className="grid max-w-3xl gap-3 md:grid-cols-3">
            {["Servidores", "Convites", "Chamadas"].map((item) => (
              <div className="rounded-lg bg-[#2b2d31] p-4 ring-1 ring-white/10" key={item}>
                <p className="text-sm font-semibold text-zinc-100">{item}</p>
                <p className="mt-1 text-xs text-zinc-400">Fluxo pronto para uso.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8">
          <Card className="w-full max-w-md border-black/30 bg-[#313338]">
            <CardHeader>
              <CardTitle>{mode === "register" ? "Criar conta" : "Boas-vindas de volta"}</CardTitle>
              <p className="text-sm leading-6 text-zinc-300">
                {mode === "register" ? "Entre no Livegrid e monte seu primeiro servidor." : "Entre para acessar seus servidores."}
              </p>
            </CardHeader>
            <form className="space-y-4" onSubmit={handleAuth}>
              {mode === "register" ? (
                <div>
                  <label className="block text-sm font-medium text-zinc-200" htmlFor="name">
                    Nome
                  </label>
                  <Input id="name" minLength={2} onChange={(event) => setName(event.target.value)} required value={name} />
                </div>
              ) : null}
              <div>
                <label className="block text-sm font-medium text-zinc-200" htmlFor="email">
                  Email
                </label>
                <Input
                  autoComplete="email"
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-200" htmlFor="password">
                  Senha
                </label>
                <Input
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  id="password"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </div>
              {error ? <p className="text-sm text-red-300">{error}</p> : null}
              <Button className="w-full" disabled={pending} type="submit">
                {pending ? "Aguarde..." : mode === "register" ? "Criar conta" : "Entrar"}
              </Button>
            </form>
            <button
              className="mt-4 text-sm text-[#00a8fc] hover:underline"
              onClick={() => setMode(mode === "register" ? "login" : "register")}
              type="button"
            >
              {mode === "register" ? "Ja tenho conta" : "Criar uma conta"}
            </button>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="grid min-h-dvh bg-[#1e1f22] text-zinc-50 lg:grid-cols-[72px_320px_minmax(0,1fr)]">
      <aside className="hidden bg-[#1e1f22] p-3 lg:flex lg:flex-col lg:items-center lg:gap-3">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#5865f2] text-white">
          <Video aria-hidden="true" size={24} />
        </span>
        <Separator className="h-px w-8 bg-white/10" />
        {servers.map((server) => (
          <button
            aria-label={`Abrir ${server.name}`}
            className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#313338] text-sm font-semibold text-zinc-200 transition-colors hover:rounded-xl hover:bg-[#5865f2] hover:text-white"
            key={server.id}
            onClick={() => router.push(`/servers/${server.id}`)}
            type="button"
          >
            {initials(server.name) || server.name.slice(0, 2).toUpperCase()}
          </button>
        ))}
      </aside>

      <aside className="hidden min-h-dvh flex-col bg-[#2b2d31] lg:flex">
        <div className="flex min-h-14 items-center justify-between border-b border-black/30 px-4">
          <h2 className="text-sm font-semibold uppercase text-zinc-300">Livegrid</h2>
          <Button aria-label="Sair" onClick={logout} size="icon" variant="ghost">
            <LogOut aria-hidden="true" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto px-3 py-4">
          <div className="rounded-lg bg-[#1e1f22] p-3">
            <p className="text-xs font-semibold uppercase text-zinc-400">Logado como</p>
            <div className="mt-3 flex items-center gap-2">
              <Avatar className="size-9">
                <AvatarFallback className="bg-[#5865f2] text-white">{initials(user.name) || "LG"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-100">{user.name}</p>
                <p className="truncate text-xs text-[#23a559]">Online</p>
              </div>
            </div>
          </div>

          <nav className="mt-5 space-y-1" aria-label="Servidores">
            <p className="px-2 text-xs font-semibold uppercase text-zinc-500">Servidores</p>
            {servers.length === 0 ? (
              <p className="px-2 py-2 text-sm text-zinc-400">Nenhum servidor ainda.</p>
            ) : (
              servers.map((server) => (
                <button
                  className="flex min-h-10 w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-[#404249] hover:text-white"
                  key={server.id}
                  onClick={() => router.push(`/servers/${server.id}`)}
                  type="button"
                >
                  <Server aria-hidden="true" size={17} />
                  <span className="truncate">{server.name}</span>
                </button>
              ))
            )}
          </nav>
        </div>
      </aside>

      <section className="min-h-dvh bg-[#111214]">
        <header className="flex min-h-14 items-center justify-between border-b border-black/30 bg-[#313338] px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Compass aria-hidden="true" className="text-zinc-400" size={18} />
            <h1 className="truncate text-sm font-semibold">Inicio</h1>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <UserPlus aria-hidden="true" size={18} />
                  Entrar por convite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Entrar por convite</DialogTitle>
                  <DialogDescription>Use o codigo que recebeu para entrar em um servidor.</DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleJoinServer}>
                  <label className="block text-sm font-medium text-zinc-200" htmlFor="invite-code">
                    Codigo do convite
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" aria-hidden="true" size={18} />
                    <Input
                      className="pl-10"
                      id="invite-code"
                      onChange={(event) => setInviteCode(event.target.value)}
                      required
                      value={inviteCode}
                    />
                  </div>
                  <Button className="w-full" type="submit">
                    Entrar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus aria-hidden="true" size={18} />
                  Criar servidor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar servidor</DialogTitle>
                  <DialogDescription>De um nome para seu novo espaco de chamada.</DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleCreateServer}>
                  <label className="block text-sm font-medium text-zinc-200" htmlFor="server-name">
                    Nome do servidor
                  </label>
                  <Input
                    id="server-name"
                    minLength={2}
                    onChange={(event) => setServerName(event.target.value)}
                    required
                    value={serverName}
                  />
                  <Button className="w-full" type="submit">
                    Criar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-sm text-zinc-400">Bem-vindo, {user.name}</p>
            <h2 className="mt-2 text-3xl font-semibold">Seus servidores</h2>
          </div>

          <div className="grid max-w-6xl gap-4 md:grid-cols-2 xl:grid-cols-3">
            {servers.map((server) => (
              <button
                className="rounded-lg border border-black/30 bg-[#313338] p-5 text-left transition-colors hover:bg-[#35373c]"
                key={server.id}
                onClick={() => router.push(`/servers/${server.id}`)}
                type="button"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-12 rounded-2xl">
                    <AvatarFallback className="rounded-2xl bg-[#5865f2] text-white">{initials(server.name) || "LG"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-zinc-50">{server.name}</h3>
                    <p className="text-sm text-zinc-400">{server.members.length} membros</p>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex items-center justify-between text-sm text-zinc-300">
                  <span className="inline-flex items-center gap-2">
                    <Volume2 aria-hidden="true" size={17} />
                    Canal de voz
                  </span>
                  <Badge className="rounded bg-[#23a559]" variant="success">
                    Online
                  </Badge>
                </div>
              </button>
            ))}

            <Card className="border-dashed border-zinc-700 bg-[#2b2d31]">
              <CardHeader>
                <CardTitle>Novo servidor</CardTitle>
                <p className="text-sm text-zinc-400">Crie um espaco ou entre por convite.</p>
              </CardHeader>
              <div className="grid gap-2 sm:grid-cols-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus aria-hidden="true" size={18} />
                      Criar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar servidor</DialogTitle>
                      <DialogDescription>De um nome para seu novo espaco de chamada.</DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={handleCreateServer}>
                      <label className="block text-sm font-medium text-zinc-200" htmlFor="server-name-card">
                        Nome do servidor
                      </label>
                      <Input
                        id="server-name-card"
                        minLength={2}
                        onChange={(event) => setServerName(event.target.value)}
                        required
                        value={serverName}
                      />
                      <Button className="w-full" type="submit">
                        Criar
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary">
                      <UserPlus aria-hidden="true" size={18} />
                      Convite
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Entrar por convite</DialogTitle>
                      <DialogDescription>Use o codigo que recebeu para entrar em um servidor.</DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={handleJoinServer}>
                      <label className="block text-sm font-medium text-zinc-200" htmlFor="invite-code-card">
                        Codigo do convite
                      </label>
                      <Input
                        id="invite-code-card"
                        onChange={(event) => setInviteCode(event.target.value)}
                        required
                        value={inviteCode}
                      />
                      <Button className="w-full" type="submit">
                        Entrar
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          </div>

          {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
        </div>
      </section>
    </main>
  );
}
