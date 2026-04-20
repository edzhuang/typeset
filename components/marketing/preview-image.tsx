"use client";

import Image from "next/image";

export function PreviewImage({ onLoad }: { onLoad?: () => void }) {
  return (
    <div className="w-[160vw] sm:w-full sm:max-w-[1248px] overflow-hidden rounded-md border bg-background">
      {/* Light theme image - hidden in dark mode via CSS */}
      <Image
        src="/preview-light.png"
        width={2940}
        height={1840}
        priority
        alt="Preview of the app"
        className="dark:hidden"
        onLoad={onLoad}
      />
      {/* Dark theme image - hidden in light mode via CSS */}
      <Image
        src="/preview-dark.png"
        width={2940}
        height={1840}
        priority
        alt="Preview of the app"
        className="hidden dark:block"
        onLoad={onLoad}
      />
    </div>
  );
}
