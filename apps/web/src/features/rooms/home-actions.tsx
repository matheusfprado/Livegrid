"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Hash, Radio, Video } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, Input } from "@livegrid/ui";
import type { RoomType } from "@livegrid/types";
import { createRoom } from "@/lib/api";

const hostTokenKey = (code: string) => `livegrid:${code}:hostToken`;

export function HomeActions() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<RoomType | null>(null);

  async function handleCreate(type: RoomType) {
    setError(null);
    setPendingType(type);

    try {
      const response = await createRoom({
        name: type === "CALL" ? "Nova chamada" : "Nova transmissao",
        type,
      });
      window.localStorage.setItem(hostTokenKey(response.room.code), response.hostToken);
      router.push(`/room/${response.room.code}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nao foi possivel criar a sala.");
    } finally {
      setPendingType(null);
    }
  }

  function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = roomCode.trim().toUpperCase();

    if (code.length !== 6) {
      setError("Informe um codigo de 6 caracteres.");
      return;
    }

    router.push(`/room/${code}`);
  }

  return (
    <>
      <section className="grid gap-3 md:grid-cols-2" aria-label="Criar sala">
        <Card className="bg-[#313338]">
          <CardHeader>
            <Video className="text-indigo-300" aria-hidden="true" size={24} />
            <CardTitle>Criar chamada</CardTitle>
            <p className="text-sm leading-6 text-zinc-300">
              Audio, camera e multiplas telas para participantes.
            </p>
          </CardHeader>
          <Button
            className="w-full bg-indigo-500 text-white hover:bg-indigo-400"
            disabled={pendingType !== null}
            onClick={() => void handleCreate("CALL")}
          >
            {pendingType === "CALL" ? "Criando..." : "Criar chamada"}
          </Button>
        </Card>

        <Card className="bg-[#313338]">
          <CardHeader>
            <Radio className="text-emerald-300" aria-hidden="true" size={24} />
            <CardTitle>Criar transmissao</CardTitle>
            <p className="text-sm leading-6 text-zinc-300">
              Host apresenta, viewers assistem com permissao reduzida.
            </p>
          </CardHeader>
          <Button disabled={pendingType !== null} onClick={() => void handleCreate("BROADCAST")} className="w-full">
            {pendingType === "BROADCAST" ? "Criando..." : "Criar transmissao"}
          </Button>
        </Card>
      </section>

      <Card className="bg-[#313338]">
        <form className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end" onSubmit={handleJoin}>
          <div>
            <CardTitle>Entrar em uma sala</CardTitle>
            <label className="mt-4 block text-sm font-medium text-zinc-200" htmlFor="room-code">
              Codigo da sala
            </label>
            <div className="relative mt-2">
              <Hash
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={18}
              />
              <Input
                className="pl-10 uppercase"
                id="room-code"
                inputMode="text"
                maxLength={6}
                onChange={(event) => setRoomCode(event.target.value)}
                placeholder="AB92KD"
                value={roomCode}
              />
            </div>
          </div>
          <Button className="md:min-w-40" type="submit">
            Entrar
          </Button>
        </form>
        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      </Card>
    </>
  );
}
