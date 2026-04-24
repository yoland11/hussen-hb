"use client";

import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import type { ReactNode } from "react";

type GenieScrollStageProps = {
  children: ReactNode;
};

export function GenieScrollStage({ children }: GenieScrollStageProps) {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothedVelocity = useSpring(scrollVelocity, {
    damping: 34,
    stiffness: 180,
    mass: 0.24,
  });

  const warpStrength = useTransform(smoothedVelocity, (latest) =>
    Math.min(Math.abs(latest) / 5600, 1) * 2.8,
  );
  const edgeInset = useTransform(
    warpStrength,
    (latest) => `${latest.toFixed(3)}%`,
  );
  const waistInset = useTransform(
    warpStrength,
    (latest) => `${(latest * 1.55).toFixed(3)}%`,
  );
  const scaleX = useTransform(warpStrength, [0, 2.8], [1, 0.992]);
  const scaleY = useTransform(warpStrength, [0, 2.8], [1, 1.012]);
  const lift = useTransform(warpStrength, [0, 2.8], [0, -6]);
  const clipPath = useMotionTemplate`polygon(
    0% 0%,
    100% 0%,
    calc(100% - ${edgeInset}) 34%,
    calc(100% - ${waistInset}) 50%,
    calc(100% - ${edgeInset}) 66%,
    100% 100%,
    0% 100%,
    ${edgeInset} 66%,
    ${waistInset} 50%,
    ${edgeInset} 34%
  )`;

  if (reduceMotion) {
    return <>{children}</>;
  }

  return (
    <div className="genie-scroll-stage">
      <motion.div
        className="genie-scroll-stage__inner"
        style={{
          clipPath,
          scaleX,
          scaleY,
          y: lift,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
