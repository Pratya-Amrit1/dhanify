"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";

const Logo = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent server/client mismatch
  if (!mounted) {
    return (
      <div className="relative h-6 w-20 sm:h-7 sm:w-24 md:h-8 md:w-28 lg:w-36" />
    );
  }

  const src =
    resolvedTheme === "dark"
      ? "/asset3.svg" // light logo on dark bg
      : "/asset3-light.svg"; // dark logo on light bg

  return (
    <div
      className="relative h-6 w-20 sm:h-7 sm:w-24 md:h-8 md:w-28 lg:w-36"
      suppressHydrationWarning
    >
      <Image
        src={src}
        alt="Dhanify Logo"
        fill
        className="object-contain"
        priority
        sizes="(max-width: 640px) 112px, (max-width: 768px) 128px, 144px"
      />
    </div>
  );
};

export default Logo;
