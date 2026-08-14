import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import AnimatedBackground from "../home/AnimatedBackground";
import AnalyzeHeader from "./AnalyzeHeader";
import AnalyzeForm from "./AnalyzeForm";

export default function AnalyzeWorkspace() {
  const [showForm, setShowForm] = useState(false);

  return (
    <main className="relative overflow-hidden bg-[#030712]">

      {/* Background */}

      <AnimatedBackground />

      {/* Header */}

      <AnimatePresence mode="wait">

        {!showForm ? (
          <motion.div
            key="header"
            initial={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
              y: -120,
              filter: "blur(20px)",
            }}
            transition={{
              duration: 0.7,
            }}
          >
            <AnalyzeHeader
              onStart={() => setShowForm(true)}
            />
          </motion.div>
        ) : (
          <motion.section
            key="workspace"
            initial={{
              opacity: 0,
              y: 120,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
            className="relative z-10 min-h-screen py-24"
          >

            <div className="mx-auto w-[92%] max-w-7xl">

              {/* Page Title */}

            

              {/* Form */}

              <AnalyzeForm />

            </div>

          </motion.section>
        )}

      </AnimatePresence>

    </main>
  );
}