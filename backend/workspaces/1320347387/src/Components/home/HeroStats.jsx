import { motion } from "framer-motion";
import CountUp from "react-countup";
import { Sparkles, Rocket, ShieldCheck } from "lucide-react";

const stats = [
  {
    id: 1,
    icon: Sparkles,
    value: 10000,
    suffix: "+",
    title: "Ideas Validated",
    color: "from-[#7C3AED] to-[#8B5CF6]",
  },
  {
    id: 2,
    icon: Rocket,
    value: 98,
    suffix: "%",
    title: "AI Accuracy",
    color: "from-[#3B82F6] to-[#60A5FA]",
  },
  {
    id: 3,
    icon: ShieldCheck,
    value: 500,
    suffix: "+",
    title: "Winning Projects",
    color: "from-[#22C55E] to-[#4ADE80]",
  },
];

export default function HeroStats() {
  return (
    <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3 ">

      {stats.map((item, index) => {
        const Icon = item.icon;

        return (
          <motion.div
            key={item.id}
            initial={{
              opacity: 0,
              y: 40,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.5,
              delay: index * 0.15,
            }}
            whileHover={{
              y: -8,
              scale: 1.03,
            }}
            className="group relative flex justify-center items-center overflow-hidden rounded-3xl border border-[#1F2937] bg-[#111827]/70 p-6 backdrop-blur-xl"
          >
            {/* Background Glow */}

            <div
              className={`absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100 bg-gradient-to-br ${item.color}`}
              style={{
                filter: "blur(120px)",
              }}
            />

            <div className="relative z-10">

              {/* Icon */}

              <div
                className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color}`}
              >
                <Icon className="text-white" size={24} />
              </div>

              {/* Value */}
              <h2 className="text-4xl font-bold text-[#F8FAFC]">
                {item.value}
                {item.suffix}
              </h2>

              {/* Label */}

              <p className="mt-3 text-sm text-[#94A3B8]">
                {item.title}
              </p>

            </div>

          </motion.div>
        );
      })}
    </div>
  );
}