import { RoomExperience } from "@/features/rooms/room-experience";

type RoomPageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default async function RoomPage({ params }: RoomPageProps) {
  const { code } = await params;

  return <RoomExperience code={code.toUpperCase()} />;
}
