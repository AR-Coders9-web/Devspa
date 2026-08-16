import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

export default function MouseGlow() {
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  const x = useSpring(mouseX, {
    stiffness: 120,
    damping: 25,
  });

  const y = useSpring(mouseY, {
    stiffness: 120,
    damping: 25,
  });

  useEffect(() => {
    const move = (e) => {
      mouseX.set(e.clientX - 200);
      mouseY.set(e.clientY - 200);
    };

    window.addEventListener("mousemove", move);

    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
   <>
  <motion.div
    style={{ x, y }}
    className="
      pointer-events-none
      fixed
      left-0
      top-0
      h-[380px]
      w-[380px]
      rounded-full
      bg-[#7C3AED]
      opacity-20
      blur-[130px]
      z-0
    "
  />

  <motion.div
    style={{
      x,
      y,
      translateX: 80,
      translateY: 60,
    }}
    className="
      pointer-events-none
      fixed
      left-0
      top-0
      h-[260px]
      w-[260px]
      rounded-full
      bg-[#3B82F6]
      opacity-15
      blur-[110px]
      z-0
    "
  />
</>
  );
}