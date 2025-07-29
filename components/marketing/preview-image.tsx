"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export function PreviewImage() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="w-[160vw] sm:w-full sm:max-w-[1248px] overflow-hidden rounded-md border">
      <Image
        src={`/preview-${resolvedTheme}.png`}
        width={2940}
        height={1840}
        alt="Preview of the app"
      />
    </div>
  );
}
