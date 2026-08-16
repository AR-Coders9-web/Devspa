import { motion } from "framer-motion";
import { Sparkles, BrainCircuit } from "lucide-react";

export default function AnalyzeHeader({onStart}) {
  return (
    <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden">

      {/* Background Glow */}

      <div className="absolute left-1/2 top-20 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#7C3AED]/20 blur-[180px]" />

      {/* Content */}

      <div className="relative z-10 mx-auto flex w-[92%] max-w-6xl flex-col items-center text-center">

        {/* Badge */}

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .6 }}
          className="mb-8 flex items-center gap-2 rounded-full border border-[#1F2937] bg-[#111827]/70 px-5 py-2 backdrop-blur-xl"
        >
          <Sparkles
            size={16}
            className="text-[#7C3AED]"
          />

          <span className="text-sm text-[#94A3B8]">
            AI Powered Startup Research
          </span>
        </motion.div>

        {/* Icon */}

        <motion.div
          initial={{
            opacity: 0,
            scale: .7,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            delay: .2,
            duration: .8,
          }}
          className="
          mb-10
          flex
          h-28
          w-28
          items-center
          justify-center
          rounded-[32px]
          border
          border-[#1F2937]
          bg-[#111827]/80
          backdrop-blur-xl
          "
        >
          <BrainCircuit
            size={48}
            className="text-[#7C3AED]"
          />
        </motion.div>

        {/* Heading */}

        <motion.h1
          initial={{
            opacity: 0,
            y: 40,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: .3,
            duration: .8,
          }}
          className="
          max-w-5xl
          text-5xl
          font-bold
          leading-tight
          text-[#F8FAFC]
          md:text-7xl
          "
        >
          Validate Your
          <span className="bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] bg-clip-text text-transparent">
            {" "}
            Startup Idea
          </span>

          <br />

          Before You Build It
        </motion.h1>

        {/* Description */}

        <motion.p
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: .5,
            duration: .8,
          }}
          className="
          mt-8
          max-w-3xl
          text-lg
          leading-9
          text-[#94A3B8]
          "
        >
          FMIdea uses AI to perform deep startup validation,
          competitor discovery, market research, originality
          analysis, SWOT evaluation, and actionable insights —
          all in one intelligent workspace.
        </motion.p>

        {/* CTA */}

        <motion.button
        onClick={onStart}
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: .7,
            duration: .8,
          }}
          whileHover={{
            scale: 1.05,
          }}
          whileTap={{
            scale: .96,
          }}
          className="
          mt-14
          rounded-2xl
          bg-gradient-to-r
          from-[#7C3AED]
          to-[#3B82F6]
          px-10
          py-5
          text-lg
          font-semibold
          text-white
          shadow-xl
          shadow-purple-700/30
          transition-all
          duration-300
          cursor-pointer
          
          "
        >
          Start AI Analysis
        </motion.button>

      </div>

    </section>
  );
}