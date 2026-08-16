import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[3px] origin-left z-[9999]
      bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400
      shadow-[0_0_20px_rgba(139,92,246,0.8)]"
    />
  );
}