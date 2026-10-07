import type { Metadata } from "next";
import { LandingHero } from "@/components/marketing/landing-hero";

// Keep /home available to signed-in users, while consolidating search results at /.
export const metadata: Metadata = {
  alternates: {
    canonical: "https://www.typeset.im/",
  },
};

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <LandingHero />
    </div>
  );
}
