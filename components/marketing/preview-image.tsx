"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function PreviewImage() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use a fallback during SSR or before mounting
  const previewSrc =
    resolvedTheme === "dark" ? "/preview-dark.png" : "/preview-light.png";

  if (!mounted) {
    return null;
  }

  return (
    <div className="w-[160vw] sm:w-full sm:max-w-[1248px] overflow-hidden rounded-md border">
      <Image
        src={previewSrc}
        width={2880}
        height={1800}
        alt="Preview of the app"
      />
    </div>
  );
}
