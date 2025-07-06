import { auth, currentUser } from "@clerk/nextjs/server";
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST() {
  // Get the current user from your database
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await currentUser();

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  // Identify the user and return the result
  const { status, body } = await liveblocks.identifyUser(userId, {
    userInfo: {
      name: user.fullName,
      imageUrl: user.imageUrl,
    },
  });

  return new Response(body, { status });
}
