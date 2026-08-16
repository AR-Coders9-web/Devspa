import { motion } from "framer-motion";
import {
  Sparkles,
  Target,
  Rocket,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

const analysis = [
  {
    icon: Sparkles,
    title: "Innovation Score",
    value: "94 / 100",
    color: "text-[#7C3AED]",
  },
  {
    icon: Target,
    title: "Market Fit",
    value: "High",
    color: "text-[#3B82F6]",
  },
  {
    icon: Rocket,
    title: "MVP Ready",
    value: "6 Features",
    color: "text-[#22C55E]",
  },
  {
    icon: ShieldCheck,
    title: "Judge Rating",
    value: "Excellent",
    color: "text-[#F59E0B]",
  },
];

export default function HeroDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9 }}
      className="relative w-[100%]"
    >
      {/* Glow */}

      <div className="absolute inset-0 rounded-[35px] bg-gradient-to-r from-[#7C3AED]/20 to-[#3B82F6]/20 blur-3xl" />

      {/* Dashboard */}

      <div className=" relative overflow-hidden rounded-[32px] border border-[#1F2937] bg-[#111827]/80 p-7 backdrop-blur-xl">

        {/* Header */}

        <div className="mb-8 flex items-center justify-between">

          <div>

            <p className="text-sm text-[#94A3B8]">
              AI Analysis
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">
              FMidea Report
            </h2>

          </div>

          <motion.div
            animate={{
              rotate: [0, 15, -15, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
            }}
            className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] p-3"
          >
            <Sparkles className="text-white" size={22} />
          </motion.div>

        </div>

        {/* Cards */}

        <div className="grid grid-cols-2 gap-4">

          {analysis.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={index}
                whileHover={{
                  scale: 1.04,
                  y: -4,
                }}
                transition={{
                  duration: .25,
                }}
                className="rounded-2xl border border-[#1F2937] bg-[#030712]/80 p-5"
              >

                <Icon
                  size={22}
                  className={`${item.color} mb-4`}
                />

                <h3 className="text-sm text-[#94A3B8]">
                  {item.title}
                </h3>

                <p className="mt-2 text-xl font-bold text-white">
                  {item.value}
                </p>

              </motion.div>
            );
          })}

        </div>

        {/* Progress */}

        <div className="mt-8">

          <div className="mb-3 flex items-center justify-between">

            <span className="text-sm text-[#94A3B8]">
              AI Confidence
            </span>

            <span className="text-sm font-semibold text-[#22C55E]">
              98%
            </span>

          </div>

          <div className="h-2 overflow-hidden rounded-full bg-[#1F2937]">

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "98%" }}
              transition={{
                duration: 1.5,
              }}
              className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#3B82F6]"
            />

          </div>

        </div>

        {/* Bottom Card */}

        <motion.div
          animate={{
            y: [0, -6, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
          }}
          className="mt-8 rounded-2xl border border-[#1F2937] bg-gradient-to-r from-[#7C3AED]/10 to-[#3B82F6]/10 p-5"
        >

          <div className="flex items-center gap-3">

            <TrendingUp
              className="text-[#22C55E]"
              size={22}
            />

            <div>

              <h3 className="font-semibold text-white">
                AI Recommendation
              </h3>

              <p className="mt-1 text-sm leading-6 text-[#94A3B8]">
                Your project has high innovation potential.
                Focus on a polished MVP and demonstrate
                your USP clearly for maximum impact.
              </p>

            </div>

          </div>

        </motion.div>

      </div>
    </motion.div>
  );
}