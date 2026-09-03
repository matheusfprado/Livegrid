import { Suspense } from "react";
import { DiscordHome } from "@/features/servers/discord-home";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <DiscordHome />
    </Suspense>
  );
}
