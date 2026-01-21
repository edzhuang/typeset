import Page from "@/app/(marketing)/home/page";

// Allow static generation, auth check happens at runtime via middleware
export const dynamic = "force-static";

export default async function RootPage() {
  return <Page />;
}
