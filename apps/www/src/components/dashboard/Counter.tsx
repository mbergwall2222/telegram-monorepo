"use client";
import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { usePrevious } from "@uidotdev/usehooks";

/**
 *
 * @param root0
 * @param root0.value
 */
export default function Counter({
  value,
  direction = "up",
  formatter,
}: {
  value: number;
  direction?: "up" | "down";
  formatter?: (value: number) => string;
}) {
  const prevValue = usePrevious(value);
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === "down" ? value : 0);
  const springValue = useSpring(motionValue, {
    damping: 100,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      motionValue.set(direction === "down" ? 0 : value);
    }
  }, [motionValue, isInView]);

  useEffect(() => {
    if (prevValue != value && value) {
      motionValue.set(value);
    }
  }, [prevValue, value]);

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = formatter
            ? formatter(latest)
            : Intl.NumberFormat("en-US").format(latest.toFixed(0));
        }
      }),
    [springValue]
  );

  return <span ref={ref} />;
}
