import { motion } from "framer-motion";
import {
  Sparkles,
  Rocket,
  Lightbulb,
  Users,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

const getIcon = (title = "") => {
  const text = title.toLowerCase();

  if (text.includes("user")) return <Users size={22} />;
  if (text.includes("mvp")) return <Rocket size={22} />;
  if (text.includes("revenue") || text.includes("pricing"))
    return <DollarSign size={22} />;
  if (text.includes("security") || text.includes("privacy"))
    return <ShieldCheck size={22} />;

  return <Lightbulb size={22} />;
};

const getColor = (priority = "Medium") => {
  switch (priority) {
    case "High":
      return "from-red-500 to-pink-500";
    case "Medium":
      return "from-yellow-500 to-orange-500";
    case "Low":
      return "from-green-500 to-emerald-500";
    default:
      return "from-purple-500 to-blue-500";
  }
};

const PriorityBadge = ({ priority }) => {
  const styles = {
    High: "bg-red-500/20 text-red-400 border-red-500/30",
    Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Low: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        styles[priority] || styles.Medium
      }`}
    >
      {priority} Priority
    </span>
  );
};

export default function RecommendationCard({ report }) {
  if (!report) return null;

  const recommendations = report.recommendations || [];

  return (
    <section className="space-y-10">

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="mb-3 flex items-center gap-2 text-purple-400">
          <Sparkles size={18} />
          <span>AI Recommendations</span>
        </div>

        <h2 className="text-4xl font-bold text-white">
          Action Plan
        </h2>

        <p className="mt-3 max-w-3xl text-slate-400">
          Based on your startup analysis, AI recommends these next steps.
        </p>
      </motion.div>

      <div className="grid gap-6">

        {recommendations.length === 0 ? (

          <div className="rounded-3xl border border-white/10 bg-[#111827]/70 p-6 text-slate-400">
            No recommendations available.
          </div>

        ) : (

          recommendations.map((item, index) => (

            <motion.div
              key={index}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{
                scale: 1.01,
                y: -4,
              }}
              viewport={{ once: true }}
              className="rounded-3xl border border-white/10 bg-[#111827]/70 backdrop-blur-xl p-6 shadow-xl"
            >

              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

                <div className="flex gap-5">

                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r ${getColor(item.priority)}`}
                  >
                    {getIcon(item.title)}
                  </div>

                  <div>

                    <h3 className="text-2xl font-semibold text-white">
                      {item.title}
                    </h3>

                    <p className="mt-3 leading-7 text-slate-400">
                      {item.description}
                    </p>

                  </div>

                </div>

                <PriorityBadge priority={item.priority} />

              </div>

              <div className="mt-6 flex items-center gap-2 text-green-400">

                <CheckCircle2 size={18} />

                <span className="text-sm">
                  Recommended by FMIdea AI
                </span>

              </div>

            </motion.div>

          ))

        )}

      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-8 text-center"
      >

        <h3 className="text-2xl font-bold text-white">
          🚀 Next Step
        </h3>

        <p className="mx-auto mt-4 max-w-3xl leading-8 text-slate-300">
          Validate your idea with real users, build a lean MVP, and iterate
          quickly using customer feedback.
        </p>

      </motion.div>

    </section>
  );
}