import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Page from "@/app/(marketing)/home/page";

export default async function RootPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/my-projects");
  } else {
    return <Page />;
  }
}
