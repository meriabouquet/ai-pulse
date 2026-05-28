"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function MotionListItem({
  children,
  index
}: {
  children: ReactNode;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1],
        delay: Math.min(index * 0.025, 0.18)
      }}
    >
      {children}
    </motion.div>
  );
}
