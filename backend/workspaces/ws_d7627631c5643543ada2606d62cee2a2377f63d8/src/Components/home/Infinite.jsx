import { motion } from "framer-motion";
import {
  Sparkles,
  Brain,
  Trophy,
  Database,
  ScanSearch,
} from "lucide-react";

const stats = [
  {
    icon: Sparkles,
    value: "10K+",
    title: "Ideas Validated",
    color: "from-[#7C3AED] to-[#8B5CF6]",
  },
  {
    icon: Brain,
    value: "98%",
    title: "AI Accuracy",
    color: "from-[#3B82F6] to-[#60A5FA]",
  },
  {
    icon: Trophy,
    value: "500+",
    title: "Winning Projects",
    color: "from-[#22C55E] to-[#4ADE80]",
  },
  {
    icon: Database,
    value: "100+",
    title: "Research Sources",
    color: "from-[#F59E0B] to-[#FBBF24]",
  },
  {
    icon: ScanSearch,
    value: "24/7",
    title: "Real-time Analysis",
    color: "from-[#7C3AED] to-[#3B82F6]",
  },
];

const items = [...stats, ...stats];

export default function Infinite() {
  return (
    <section className="relative mt-24 w-full overflow-hidden">

      {/* Left Fade */}

      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-40 bg-gradient-to-r from-[#030712] to-transparent" />

      {/* Right Fade */}

      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-40 bg-gradient-to-l from-[#030712] to-transparent" />

      <motion.div
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex w-max gap-6"
      >
        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={index}
              className="
                group
                flex
                min-w-[300px]
                items-center
                gap-5
                rounded-3xl
                border
                border-[#1F2937]
                bg-[#111827]/70
                px-7
                py-6
                backdrop-blur-xl
                transition-all
                duration-500
                hover:border-[#7C3AED]/50
              "
            >
              {/* Icon */}

              <div
                className={`
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-gradient-to-br
                  ${item.color}
                `}
              >
                <Icon
                  size={24}
                  className="text-white"
                />
              </div>

              {/* Text */}

              <div>
                <h2 className="text-3xl font-bold text-[#F8FAFC]">
                  {item.value}
                </h2>

                <p className="mt-1 text-sm text-[#94A3B8]">
                  {item.title}
                </p>
              </div>
            </div>
          );
        })}
      </motion.div>
    </section>
  );
}