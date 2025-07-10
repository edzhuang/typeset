import { currentUser } from "@clerk/nextjs/server";
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

// Function to generate a random color
function generateRandomColor(): string {
  const colors = [
    "#E74C3C",
    "#8E44AD",
    "#6C5CE7",
    "#2E86AB",
    "#1E3A8A",
    "#059669",
    "#D97706",
    "#DC2626",
    "#7C2D12",
    "#92400E",
    "#78350F",
    "#374151",
    "#059669",
    "#0D9488",
    "#7C3AED",
    "#5B21B6",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export async function POST() {
  const user = await currentUser();

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  const userColor = generateRandomColor();
  const emailAddress = user.emailAddresses[0].emailAddress;

  // Identify the user and return the result
  const { status, body } = await liveblocks.identifyUser(emailAddress, {
    userInfo: {
      name: user.fullName || "Unnamed User",
      imageUrl: user.imageUrl,
      color: userColor,
    },
  });

  return new Response(body, { status });
}
