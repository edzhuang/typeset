import { Providers } from "@/components/project/providers";
import Editor from "@/components/project/editor";
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const room = await liveblocks.getRoom(id);
  const title = room.metadata.title as string;

  return (
    <Providers id={id}>
      <Editor title={title} />
    </Providers>
  );
}
