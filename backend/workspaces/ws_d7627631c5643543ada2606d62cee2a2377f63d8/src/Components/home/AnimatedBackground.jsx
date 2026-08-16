import { motion } from "framer-motion";
import MouseGlow from "./MouseGlow";

export default function AnimatedBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-[#030712]">

    <MouseGlow />    
      {/* Aurora Gradient */}

      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_top,#7C3AED25,transparent_35%),radial-gradient(circle_at_bottom_right,#3B82F620,transparent_35%),radial-gradient(circle_at_left,#22C55E15,transparent_30%)]
        "
      />

      {/* Grid */}

      <div
        className="
          absolute
          inset-0
          bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]
          bg-[size:60px_60px]
        "
      />

      {/* Main Purple Glow */}

      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
        }}
        className="
          absolute
          -top-56
          left-1/2
          h-[650px]
          w-[650px]
          -translate-x-1/2
          rounded-full
          bg-[#7C3AED]
          blur-[220px]
        "
      />

      {/* Blue Glow */}

      <motion.div
        animate={{
          x: [-30, 30, -30],
          y: [-20, 20, -20],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
        }}
        className="
          absolute
          bottom-0
          right-0
          h-[420px]
          w-[420px]
          rounded-full
          bg-[#3B82F6]
          opacity-30
          blur-[180px]
        "
      />

      {/* Green Accent */}

      <motion.div
        animate={{
          y: [0, 35, 0],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
        }}
        className="
          absolute
          left-0
          bottom-20
          h-[300px]
          w-[300px]
          rounded-full
          bg-[#22C55E]
          opacity-15
          blur-[170px]
        "
      />

      {/* Floating Particles */}

      {[...Array(18)].map((_, i) => (
        <motion.span
          key={i}
          animate={{
            y: [0, -40, 0],
            opacity: [0.15, 0.7, 0.15],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.4,
          }}
          className="absolute rounded-full bg-white/20"
          style={{
            width: Math.random() * 5 + 2,
            height: Math.random() * 5 + 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}

      {/* Bottom Fade */}

      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#030712] to-transparent" />

    </div>
  );
}