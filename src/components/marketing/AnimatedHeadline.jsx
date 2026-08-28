"use client";

import { motion, useReducedMotion } from "framer-motion";

const spring = { type: "spring", stiffness: 380, damping: 28 };

export default function AnimatedHeadline({
  text,
  as: Tag = "h1",
  style,
  className,
}) {
  const reduceMotion = useReducedMotion();
  const words = String(text).split(" ");

  return (
    <Tag className={className} style={style}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          animate={reduceMotion ? false : { opacity: 1, y: 0 }}
          transition={{ ...spring, delay: reduceMotion ? 0 : i * 0.05 }}
          style={{ display: "inline-block", marginRight: "0.22em" }}
        >
          {word}
        </motion.span>
      ))}
    </Tag>
  );
}
