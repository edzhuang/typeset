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
  const roomDataPromise = liveblocks.getRoom(id);

  return (
    <Providers id={id}>
      <Editor roomDataPromise={roomDataPromise} />
    </Providers>
  );
}
