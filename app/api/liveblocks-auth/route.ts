import { auth, currentUser } from "@clerk/nextjs/server";
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

// Function to generate a random color
function generateRandomColor(): string {
  const colors = [
    "#E74C3C", // Dark red
    "#C0392B", // Darker red
    "#8E44AD", // Dark purple
    "#6C5CE7", // Dark indigo
    "#2E86AB", // Dark blue
    "#1E3A8A", // Navy blue
    "#059669", // Dark green
    "#047857", // Darker green
    "#D97706", // Dark orange
    "#B45309", // Darker orange
    "#DC2626", // Red
    "#7C2D12", // Dark brown
    "#92400E", // Dark amber
    "#78350F", // Dark brown
    "#374151", // Dark gray
    "#1F2937", // Darker gray
    "#059669", // Dark teal
    "#0D9488", // Dark cyan
    "#7C3AED", // Dark violet
    "#5B21B6", // Dark purple
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

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

  // Generate a random color for the user
  const userColor = generateRandomColor();

  // Identify the user and return the result
  const { status, body } = await liveblocks.identifyUser(userId, {
    userInfo: {
      name: user.fullName,
      imageUrl: user.imageUrl,
      color: userColor,
    },
  });

  return new Response(body, { status });
}
