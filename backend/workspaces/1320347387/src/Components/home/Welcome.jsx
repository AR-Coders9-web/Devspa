import { motion } from "framer-motion";
import { Typewriter } from "react-simple-typewriter";

const typewriterTexts = [
  "Every Great Startup Begins With Validation.",
  "Don't Just Build. Verify First.",
  "Deep Research. Instant Insights.",
  "Know What's New. Know What Matters.",
  "The AI Research Engine for Innovators.",
];

export default function Welcome() {
  return (
    <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-24">

      {/* Badge */}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="
        mb-8
        inline-flex
        items-center
        gap-2
        rounded-full
        border
        border-[#7C3AED]/30
        bg-[#111827]/70
        px-5
        py-2
        backdrop-blur-xl
        shadow-[0_0_30px_rgba(124,58,237,0.25)]
        "
      >
        <div className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse"></div>

        <span className="text-sm text-[#94A3B8] tracking-wide">
          AI Powered Startup Validation Platform
        </span>
      </motion.div>

      {/* Main Heading */}

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="
        text-5xl
        md:text-7xl
        lg:text-8xl
        font-black
        leading-tight
        tracking-tight
        "
      >
        <span className="text-[#F8FAFC]">
          Welcome to
        </span>

        <br />

        <span
          className="
          bg-gradient-to-r
          from-[#7C3AED]
          via-[#8B5CF6]
          to-[#3B82F6]
          bg-clip-text
          text-transparent
          "
        >
          FMIdea AI
        </span>
      </motion.h1>

      {/* Subtitle */}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="
        mt-8
        max-w-3xl
        text-lg
        md:text-xl
        text-[#94A3B8]
        leading-relaxed
        "
      >
        Discover startup opportunities, validate ideas using AI,
        analyze trends, and build products people actually need.
      </motion.p>

      {/* Typewriter */}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="
        mt-14
        flex
        items-center
        justify-center
        rounded-2xl
        border
        border-[#1F2937]
        bg-[#111827]/70
        backdrop-blur-xl
        px-8
        py-5
        shadow-[0_0_50px_rgba(124,58,237,0.18)]
        max-w-4xl
        w-full
        "
      >
        <span
          className="
          text-xl
          md:text-2xl
          font-semibold
          bg-gradient-to-r
          from-[#7C3AED]
          to-[#3B82F6]
          bg-clip-text
          text-transparent
          "
        >
          <Typewriter
            words={typewriterTexts}
            loop={0}
            cursor
            cursorStyle="|"
            typeSpeed={60}
            deleteSpeed={35}
            delaySpeed={1800}
          />
        </span>
      </motion.div>

      {/* CTA */}

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-14 flex flex-wrap items-center justify-center gap-5"
      >
        <button
          className="
          rounded-xl
          bg-gradient-to-r
          from-[#7C3AED]
          to-[#3B82F6]
          px-8
          py-4
          font-semibold
          text-white
          transition-all
          duration-300
          hover:scale-105
          hover:shadow-[0_0_35px_rgba(124,58,237,0.45)]
          "
        >
          Start Exploring
        </button>

        <button
          className="
          rounded-xl
          border
          border-[#1F2937]
          bg-[#111827]
          px-8
          py-4
          font-semibold
          text-[#F8FAFC]
          transition-all
          duration-300
          hover:border-[#7C3AED]
          hover:bg-[#151d2d]
          "
        >
          Watch Demo
        </button>
      </motion.div>

    </section>
  );
}