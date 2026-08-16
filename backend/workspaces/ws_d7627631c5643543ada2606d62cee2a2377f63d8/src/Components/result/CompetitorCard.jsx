import { motion } from "framer-motion";
import {
  Building2,
  ExternalLink,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const SimilarityBar = ({ value }) => (
  <div className="mt-3">
    <div className="mb-2 flex justify-between text-sm">
      <span className="text-slate-400">Similarity</span>
      <span className="font-semibold text-purple-400">{value}%</span>
    </div>

    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${value}%` }}
        transition={{ duration: 1 }}
        className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#3B82F6]"
      />
    </div>
  </div>
);

export default function CompetitorCard({ report }) {

  if (!report) return null;

  const competitors = report.competitors || [];

  return (
    <section className="space-y-8">

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-4xl font-bold text-white">
          Competitor Analysis
        </h2>

        <p className="mt-3 max-w-2xl text-slate-400">
          AI identified the closest competitors based on your startup idea.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">

        {competitors.length === 0 ? (

          <div className="rounded-2xl border border-white/10 bg-[#111827]/70 p-6 text-slate-400">
            No competitors found.
          </div>

        ) : (

          competitors.map((item, index) => (

            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="rounded-3xl border border-white/10 bg-[#111827]/70 p-6 backdrop-blur-xl shadow-xl"
            >

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="rounded-xl bg-purple-600/20 p-3">
                    <Building2 className="text-purple-400" />
                  </div>

                  <div>

                    <h3 className="text-xl font-bold text-white">
                      {item.name}
                    </h3>

                    <p className="text-sm text-slate-400">
                      AI Detected Competitor
                    </p>

                  </div>

                </div>

                <ExternalLink
                  className="text-slate-500"
                  size={18}
                />

              </div>

              <SimilarityBar
                value={parseInt(item.similarity) || 0}
              />

              <div className="mt-6 space-y-4">

                <div className="flex items-center justify-between">

                  <span className="text-slate-400">
                    Similarity
                  </span>

                  <div className="flex items-center gap-2">

                    <TrendingUp
                      size={16}
                      className="text-green-400"
                    />

                    <span className="font-semibold text-white">
                      {item.similarity}
                    </span>

                  </div>

                </div>

                <div className="rounded-xl bg-slate-900/60 p-4">

                  <div className="mb-3 flex items-center gap-2">

                    <CheckCircle2
                      className="text-green-400"
                      size={18}
                    />

                    <span className="font-semibold text-white">
                      Strength
                    </span>

                  </div>

                  <p className="text-slate-400">
                    {item.strength}
                  </p>

                </div>

                <div className="rounded-xl bg-slate-900/60 p-4">

                  <div className="mb-3 flex items-center gap-2">

                    <AlertTriangle
                      className="text-red-400"
                      size={18}
                    />

                    <span className="font-semibold text-white">
                      Weakness
                    </span>

                  </div>

                  <p className="text-slate-400">
                    {item.weakness}
                  </p>

                </div>

              </div>

            </motion.div>

          ))

        )}

      </div>

    </section>
  );
}