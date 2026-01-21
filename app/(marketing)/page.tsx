import Page from "@/app/(marketing)/home/page";
import { AuthRedirect } from "@/components/marketing/auth-redirect";

export default function RootPage() {
  return (
    <>
      <AuthRedirect />
      <Page />
    </>
  );
}
