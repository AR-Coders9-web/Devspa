import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const productLinks = [
  "Idea Validation",
  "Competitor Analysis",
  "AI Research",
  "Roadmap Generator",
];

const resourcesLinks = [
  "Documentation",
  "API",
  "FAQs",
  "Support",
];

const companyLinks = [
  "About",
  "Contact",
  "Privacy",
  "Terms",
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[#1F2937] bg-[#030712]">

      {/* Top Glow */}

      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#7C3AED]/20 blur-[140px]" />

      <div className="relative mx-auto max-w-6xl px-6 py-20">

        {/* Links */}

        <div className="grid grid-cols-1 gap-12 text-center md:grid-cols-3 md:text-left">

          {/* Product */}

          <div>

            <h3 className="mb-6 text-xl font-semibold text-[#F8FAFC]">
              Product
            </h3>

            <div className="space-y-4">

              {productLinks.map((item) => (
                <motion.a
                  key={item}
                  href="#"
                  whileHover={{ x: 5 }}
                  className="block text-[#94A3B8] transition hover:text-white"
                >
                  {item}
                </motion.a>
              ))}

            </div>

          </div>

          {/* Resources */}

          <div>

            <h3 className="mb-6 text-xl font-semibold text-[#F8FAFC]">
              Resources
            </h3>

            <div className="space-y-4">

              {resourcesLinks.map((item) => (
                <motion.a
                  key={item}
                  href="#"
                  whileHover={{ x: 5 }}
                  className="block text-[#94A3B8] transition hover:text-white"
                >
                  {item}
                </motion.a>
              ))}

            </div>

          </div>

          {/* Company */}

          <div>

            <h3 className="mb-6 text-xl font-semibold text-[#F8FAFC]">
              Company
            </h3>

            <div className="space-y-4">

              {companyLinks.map((item) => (
                <motion.a
                  key={item}
                  href="#"
                  whileHover={{ x: 5 }}
                  className="block text-[#94A3B8] transition hover:text-white"
                >
                  {item}
                </motion.a>
              ))}

            </div>

          </div>

        </div>

        {/* Divider */}

        <div className="my-14 h-px bg-gradient-to-r from-transparent via-[#1F2937] to-transparent" />

        {/* Bottom */}

        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">

          <p className="text-center text-sm text-[#94A3B8]">
            © {new Date().getFullYear()} FMidea AI. All rights reserved.
          </p>

          <motion.button
            whileHover={{
              scale: 1.05,
            }}
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="group flex items-center gap-2 rounded-xl border border-[#1F2937] bg-[#111827] px-5 py-3 text-sm font-medium text-[#F8FAFC] transition-all hover:border-[#7C3AED]"
          >
            Back to Top

            <ArrowUpRight
              size={16}
              className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
            />
          </motion.button>

        </div>

      </div>

    </footer>
  );
}