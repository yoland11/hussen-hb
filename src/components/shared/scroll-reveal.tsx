"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

type RevealDirection = "up" | "down" | "left" | "right";
type RevealDistance = "sm" | "md" | "lg";
type RevealTag = keyof HTMLElementTagNameMap;
type InViewOptions = NonNullable<Parameters<typeof useInView>[1]>;
type RevealRootMargin = NonNullable<InViewOptions["margin"]>;

type ScrollRevealProps = {
  as?: RevealTag;
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: RevealDirection;
  distance?: RevealDistance;
  once?: boolean;
  threshold?: number;
  rootMargin?: RevealRootMargin;
} & Omit<
  HTMLMotionProps<RevealTag>,
  "animate" | "as" | "children" | "className" | "initial" | "transition" | "variants"
>;

const DISTANCE_MAP: Record<RevealDistance, number> = {
  sm: 18,
  md: 28,
  lg: 42,
};

function getOffset(direction: RevealDirection, distance: RevealDistance) {
  const value = DISTANCE_MAP[distance];

  if (direction === "down") {
    return { x: 0, y: -value };
  }

  if (direction === "left") {
    return { x: value, y: 0 };
  }

  if (direction === "right") {
    return { x: -value, y: 0 };
  }

  return { x: 0, y: value };
}

const HIDDEN_CLIP_PATH =
  "polygon(8% 0%, 92% 0%, 100% 30%, 94% 50%, 100% 70%, 92% 100%, 8% 100%, 0% 70%, 6% 50%, 0% 30%)";
const VISIBLE_CLIP_PATH =
  "polygon(0% 0%, 100% 0%, 100% 30%, 100% 50%, 100% 70%, 100% 100%, 0% 100%, 0% 70%, 0% 50%, 0% 30%)";

export function ScrollReveal({
  as = "div",
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = "md",
  once = true,
  threshold = 0.14,
  rootMargin = "0px 0px -10% 0px",
  style,
  ...rest
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();
  const isInView = useInView(elementRef, {
    once,
    margin: rootMargin,
    amount: threshold,
  });
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const offset = useMemo(() => getOffset(direction, distance), [direction, distance]);
  const MotionComponent = motion[as as keyof typeof motion] as ComponentType<
    HTMLMotionProps<RevealTag>
  >;

  useEffect(() => {
    const node = elementRef.current;

    if (!node || typeof window === "undefined" || reduceMotion) {
      return;
    }

    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const rect = node.getBoundingClientRect();
    const isInitiallyVisible = rect.top <= viewportHeight * 0.92 && rect.bottom >= 0;

    if (isInitiallyVisible) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setShouldAnimate(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [reduceMotion]);
  const animationState =
    reduceMotion || !shouldAnimate || isInView ? "visible" : "hidden";

  return (
    <MotionComponent
      ref={elementRef}
      initial={false}
      animate={reduceMotion ? "visible" : animationState}
      variants={{
        hidden: {
          opacity: 0,
          x: offset.x,
          y: offset.y,
          scaleX: 0.984,
          scaleY: 0.962,
          clipPath: HIDDEN_CLIP_PATH,
        },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          clipPath: VISIBLE_CLIP_PATH,
        },
      }}
      transition={{
        duration: 0.86,
        delay: delay / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`scroll-reveal ${className}`.trim()}
      style={{
        ...style,
        transformOrigin: "50% 50%",
        willChange: "transform, opacity, clip-path",
      }}
      {...rest}
    >
      {children}
    </MotionComponent>
  );
}
