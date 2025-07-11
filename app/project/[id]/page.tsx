import { Providers } from "@/components/project/providers";
import Editor from "@/components/project/editor";
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

const getTitle = async (projectId: string) => {
  const room = await liveblocks.getRoom(projectId);
  return room.metadata.title as string;
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const title = getTitle(id);

  return (
    <Providers id={id}>
      <Editor title={title} />
    </Providers>
  );
}
