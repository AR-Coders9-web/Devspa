import { useState } from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Sparkles,
  Clipboard,
  Check,
} from "lucide-react";

export default function SummaryCard({ report }) {
  if (!report) return null;

  const summary =
    report.summary ||
    "No executive summary was generated.";

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111827]/70 p-8 backdrop-blur-xl shadow-2xl"
    >
      {/* Background Glow */}

      <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#7C3AED]/20 blur-[120px]" />

      {/* Header */}

      <div className="relative z-10 flex items-center justify-between">

        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] shadow-lg">
            <BrainCircuit size={28} />
          </div>

          <div>

            <div className="flex items-center gap-2">
              <Sparkles
                size={16}
                className="text-purple-400"
              />

              <span className="text-sm text-purple-300">
                AI Generated
              </span>
            </div>

            <h2 className="mt-1 text-3xl font-bold text-white">
              Executive Summary
            </h2>

          </div>

        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#030712] px-4 py-3 transition hover:border-purple-500"
        >
          {copied ? (
            <>
              <Check
                size={18}
                className="text-green-400"
              />
              <span className="text-sm text-green-400">
                Copied
              </span>
            </>
          ) : (
            <>
              <Clipboard size={18} />
              <span className="text-sm">
                Copy
              </span>
            </>
          )}
        </button>

      </div>

      <div className="my-8 h-px bg-white/10" />

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 text-lg leading-9 text-[#CBD5E1]"
      >
        {summary}
      </motion.p>

      <div className="relative z-10 mt-10 flex flex-wrap gap-3">

        <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-300">
          AI Research
        </span>

        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
          Market Validation
        </span>

        <span className="rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-300">
          Startup Analysis
        </span>

      </div>

    </motion.section>
  );
}