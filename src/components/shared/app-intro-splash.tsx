"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const INTRO_DURATION_MS = 4000;
const EXIT_DURATION_MS = 600;
const EXIT_DELAY_MS = INTRO_DURATION_MS - EXIT_DURATION_MS;

export function AppIntroSplash() {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const exitTimer = window.setTimeout(() => {
      setIsExiting(true);
    }, EXIT_DELAY_MS);

    const removeTimer = window.setTimeout(() => {
      document.body.style.overflow = previousOverflow;
      setIsVisible(false);
    }, INTRO_DURATION_MS);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`intro-splash ${isExiting ? "is-exiting" : ""}`.trim()}
      aria-hidden="true"
    >
      <div className="intro-splash__logo logo">
        <div className="logo-badge intro-splash__badge">
          <Image
            src="/intro-logo.png"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 84vw, 360px"
          />
        </div>
      </div>
    </div>
  );
}
