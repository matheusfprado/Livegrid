import { ServerShell } from "@/features/servers/server-shell";

type ServerPageProps = {
  params: Promise<{
    serverId: string;
  }>;
};

export default async function ServerPage({ params }: ServerPageProps) {
  const { serverId } = await params;

  return <ServerShell serverId={serverId} />;
}
