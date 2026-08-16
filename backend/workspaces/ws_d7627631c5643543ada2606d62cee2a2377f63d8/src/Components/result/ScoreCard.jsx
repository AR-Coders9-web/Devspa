import { motion } from "framer-motion";
import {
  Trophy,
  Brain,
  TrendingUp,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const ScoreItem = ({ icon, title, score, color }) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    className="rounded-2xl border border-white/10 bg-[#111827]/70 p-5 backdrop-blur-xl"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ background: color }}
        >
          {icon}
        </div>

        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold text-white">{score}</h3>
        </div>
      </div>
    </div>

    <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1 }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  </motion.div>
);

export default function ScoreCard({ report }) {

  if (!report) return null;

  const overall = report.overallScore ?? 0;
  const originality = report.originalityScore ?? 0;
  const market = report.marketScore ?? 0;
  const risk = report.riskScore ?? 0;
  return (
    <section className="mb-10">

      {/* Hero */}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/10 bg-[#111827]/70 p-8 backdrop-blur-xl"
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="mb-4 flex items-center gap-2 text-purple-400">
              <Sparkles size={18} />
              <span>AI Startup Score</span>
            </div>

            <h1 className="text-5xl font-bold text-white">
              {overall}
              <span className="text-purple-400">/100</span>
            </h1>

            <p className="mt-4 max-w-xl text-slate-400">
              {report.summary}
            </p>

          </div>

          <div className="relative">

            <div className="flex h-48 w-48 items-center justify-center rounded-full border-[12px] border-purple-600">

              <div className="text-center">

                <Trophy
                  className="mx-auto mb-3 text-yellow-400"
                  size={40}
                />

                <h2 className="text-5xl font-bold text-white">
                  {overall}
                </h2>

                <p className="text-slate-400">
                  Overall
                </p>

              </div>

            </div>

          </div>

        </div>
      </motion.div>

      {/* Metrics */}

      <div className="mt-8 grid gap-6 md:grid-cols-3">

        <ScoreItem
          title="Originality"
          score={originality}
          color="#7C3AED"
          icon={<Brain className="text-white" />}
        />

        <ScoreItem
          title="Market Potential"
          score={market}
          color="#2563EB"
          icon={<TrendingUp className="text-white" />}
        />

        <ScoreItem
          title="Risk Level"
          score={100 - risk}
          color="#16A34A"
          icon={<ShieldCheck className="text-white" />}
        />

      </div>

    </section>
  );
}