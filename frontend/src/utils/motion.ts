import type { Variants } from "framer-motion";

export const staggerContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export const fadeScale: Variants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};
