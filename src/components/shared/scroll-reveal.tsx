"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type RevealDirection = "up" | "down" | "left" | "right";
type RevealDistance = "sm" | "md" | "lg";

type ScrollRevealProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: RevealDirection;
  distance?: RevealDistance;
  once?: boolean;
  threshold?: number;
  rootMargin?: string;
} & HTMLAttributes<HTMLElement>;

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
  ...rest
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const offset = useMemo(() => getOffset(direction, distance), [direction, distance]);
  const Component = as;

  useEffect(() => {
    const node = elementRef.current;

    if (!node || typeof window === "undefined") {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) {
      return;
    }

    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const rect = node.getBoundingClientRect();
    const isInitiallyVisible = rect.top <= viewportHeight * 0.92;

    if (isInitiallyVisible) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setShouldAnimate(true);
      setIsVisible(false);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry) {
          return;
        }

        window.requestAnimationFrame(() => {
          setShouldAnimate(true);
          setIsVisible(entry.isIntersecting);
        });

        if (entry.isIntersecting && once) {
          observer.unobserve(entry.target);
        }
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(node);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [once, rootMargin, threshold]);

  const style = {
    "--reveal-delay": `${delay}ms`,
    "--reveal-offset-x": `${offset.x}px`,
    "--reveal-offset-y": `${offset.y}px`,
  } as CSSProperties;

  return (
    <Component
      ref={elementRef}
      className={`scroll-reveal ${shouldAnimate ? "is-ready" : ""} ${
        isVisible ? "is-visible" : "is-hidden"
      } ${className}`.trim()}
      style={style}
      {...rest}
    >
      {children}
    </Component>
  );
}
