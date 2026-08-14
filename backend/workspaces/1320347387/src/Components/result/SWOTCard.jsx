import { motion } from "framer-motion";
import {
  ShieldCheck,
  CircleAlert,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

const SWOTBox = ({
  title,
  icon,
  color,
  bg,
  items = [],
}) => (
  <motion.div
    initial={{ opacity: 0, y: 25 }}
    whileInView={{ opacity: 1, y: 0 }}
    whileHover={{
      y: -8,
      scale: 1.02,
    }}
    viewport={{ once: true }}
    className="rounded-3xl border border-white/10 bg-[#111827]/70 backdrop-blur-xl p-6 shadow-xl"
  >
    <div className="mb-6 flex items-center gap-4">

      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: bg }}
      >
        {icon}
      </div>

      <h3
        className="text-2xl font-bold"
        style={{ color }}
      >
        {title}
      </h3>

    </div>

    <div className="space-y-4">

      {items.length === 0 ? (

        <div className="rounded-xl bg-[#030712]/70 border border-white/5 p-4">
          <p className="text-slate-400">
            No data available.
          </p>
        </div>

      ) : (

        items.map((item, index) => (

          <div
            key={index}
            className="rounded-xl bg-[#030712]/70 border border-white/5 p-4"
          >
            <p className="leading-7 text-slate-300">
              • {item}
            </p>
          </div>

        ))

      )}

    </div>

  </motion.div>
);

export default function SWOTCard({ report }) {

  if (!report) return null;

  const swot = report.swot || {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
  };

  return (
    <section className="space-y-10">

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-4xl font-bold text-white">
          SWOT Analysis
        </h2>

        <p className="mt-3 max-w-2xl text-slate-400">
          AI analyzed your startup's strengths, weaknesses,
          opportunities and threats.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">

        <SWOTBox
          title="Strengths"
          color="#22C55E"
          bg="rgba(34,197,94,.15)"
          icon={<ShieldCheck className="text-green-400" />}
          items={swot.strengths}
        />

        <SWOTBox
          title="Weaknesses"
          color="#EF4444"
          bg="rgba(239,68,68,.15)"
          icon={<CircleAlert className="text-red-400" />}
          items={swot.weaknesses}
        />

        <SWOTBox
          title="Opportunities"
          color="#3B82F6"
          bg="rgba(59,130,246,.15)"
          icon={<TrendingUp className="text-blue-400" />}
          items={swot.opportunities}
        />

        <SWOTBox
          title="Threats"
          color="#F59E0B"
          bg="rgba(245,158,11,.15)"
          icon={<TriangleAlert className="text-yellow-400" />}
          items={swot.threats}
        />

      </div>

    </section>
  );
}