import React, {
    useEffect,
    useState,
    useRef,
    useMemo
} from "react";

import {
    motion,
    AnimatePresence,
    useScroll,
    useSpring,
} from "framer-motion";

import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import gsap from "gsap";
import Lenis from "lenis";

import {
    ArrowLeft,
    ArrowUp,
    Loader2,
    AlertTriangle,
    Share2,
    Sparkles,
    BrainCircuit,
} from "lucide-react";

/* ------------------------------------------------ */
import { exportReportPDF } from "../../services/exportPDF";
import AnimatedBackground from "../home/AnimatedBackground";

import ScoreCard from "./ScoreCard";
import SummaryCard from "./SummaryCard";
import CompetitorCard from "./CompetitorCard";
import SWOTCard from "./SWOTCard";
import RecommendationCard from "./RecommendationCard";


/* ===================================================== */

const COLORS = {
    background: "#030712",
    surface: "#111827",
    border: "#1F2937",
    purple: "#7C3AED",
    blue: "#3B82F6",
    text: "#F8FAFC",
    muted: "#94A3B8",
};

const containerVariants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.12,
        },
    },
};

const fadeUp = {
    hidden: {
        opacity: 0,
        y: 40,
    },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: .6,
        },
    },
};

/* ===================================================== */

export default function AnalysisResult() {

    const navigate = useNavigate();
    const location = useLocation();

    /* -------------------------------- */

    const report = location.state?.report || null;

    /* -------------------------------- */

    const [loading, setLoading] = useState(!report);

    const [error, setError] = useState(null);

    const pageRef = useRef(null);

    /* -------------------------------- */

    const { scrollYProgress } = useScroll();

    const scaleX = useSpring(scrollYProgress, {
        stiffness: 120,
        damping: 25,
    });

    /* -------------------------------- */

    useEffect(() => {

        const lenis = new Lenis({
            duration: 1.2,
            smoothWheel: true,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => lenis.destroy();

    }, []);

    /* -------------------------------- */

    useEffect(() => {

        if (report) {
            setLoading(false);
            return;
        }

        const timer = setTimeout(() => {

            setLoading(false);

            setError(
                "Unable to load the AI report. Please analyze your startup again."
            );

        }, 1500);

        return () => clearTimeout(timer);

    }, [report]);

    /* -------------------------------- */

    // useEffect(() => {

    //     gsap.from(pageRef.current, {
    //         opacity: 0,
    //         y: 40,
    //         duration: 1,
    //         ease: "power3.out",
    //     });

    // }, []);

    /* ===================================================== */
    /* LOADING SCREEN                                        */
    /* ===================================================== */

    if (loading) {

        return (

            <main className="relative flex min-h-screen items-center justify-center bg-[#030712] text-white overflow-hidden">

                <AnimatedBackground />

                <motion.div
                    initial={{
                        opacity: 0,
                        scale: .85,
                    }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                    }}
                    className="relative z-20 flex flex-col items-center"
                >

                    <div className="relative mb-10">

                        <motion.div
                            animate={{
                                rotate: 360,
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 5,
                                ease: "linear",
                            }}
                            className="
              absolute
              inset-0
              rounded-full
              border-t-2
              border-[#7C3AED]
              "
                        />

                        <div
                            className="
              flex
              h-28
              w-28
              items-center
              justify-center
              rounded-full
              border
              border-[#1F2937]
              bg-[#111827]/70
              backdrop-blur-xl
              "
                        >

                            <BrainCircuit
                                size={46}
                                className="text-[#7C3AED]"
                            />

                        </div>

                    </div>

                    <h2
                        className="
            text-4xl
            font-bold
            text-white
            "
                    >
                        Preparing AI Report
                    </h2>

                    <p
                        className="
            mt-5
            max-w-lg
            text-center
            text-[#94A3B8]
            "
                    >
                        Please wait while FMIdea AI generates
                        your complete startup validation report.
                    </p>

                    <Loader2
                        className="
            mt-8
            animate-spin
            text-[#7C3AED]
            "
                        size={34}
                    />

                </motion.div>

            </main>

        );

    }

    /* ===================================================== */
    /* ERROR SCREEN                                          */
    /* ===================================================== */

    if (error) {

        return (

            <main className="relative flex min-h-screen items-center justify-center bg-[#030712]">

                <AnimatedBackground />

                <motion.div

                    initial={{
                        opacity: 0,
                        y: 50,
                    }}

                    animate={{
                        opacity: 1,
                        y: 0,
                    }}

                    className="
          relative
          z-20
          w-[92%]
          max-w-xl
          rounded-3xl
          border
          border-red-500/20
          bg-[#111827]/80
          p-10
          text-center
          backdrop-blur-xl
          "

                >

                    <AlertTriangle
                        size={56}
                        className="mx-auto text-red-500"
                    />

                    <h2
                        className="
            mt-6
            text-3xl
            font-bold
            text-white
            "
                    >
                        Something went wrong
                    </h2>

                    <p
                        className="
            mt-4
            text-[#94A3B8]
            "
                    >
                        {error}
                    </p>

                    <button

                        onClick={() => navigate("/analyze")}

                        className="
            mt-10
            rounded-2xl
            bg-gradient-to-r
            from-[#7C3AED]
            to-[#3B82F6]
            px-8
            py-4
            font-semibold
            text-white
            "

                    >
                        Analyze Again
                    </button>

                </motion.div>

            </main>

        );

    }

    /* ===================================================== */
    /* MAIN PAGE                                             */
    /* ===================================================== */

    return (

        <main
            ref={pageRef}
            className="relative min-h-screen overflow-hidden bg-[#030712] text-white"
        >

            <AnimatedBackground />

            {/* Scroll Progress */}

            <motion.div
                style={{
                    scaleX,
                    transformOrigin: "0%",
                }}
                className="
        fixed
        left-0
        top-0
        z-[200]
        h-[3px]
        w-full
        bg-gradient-to-r
        from-[#7C3AED]
        via-[#9333EA]
        to-[#3B82F6]
        "
            />

            {/* Floating Buttons */}

            <div
                className="
        fixed
        bottom-8
        right-8
        z-50
        flex
        flex-col
        gap-4
        "
            >

                <button

                    onClick={() =>
                        window.scrollTo({
                            top: 0,
                            behavior: "smooth",
                        })
                    }

                    className="
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          border
          border-white/10
          bg-[#111827]/80
          backdrop-blur-xl
          transition
          hover:scale-110
          "

                >
                    <ArrowUp />
                </button>

                <button

                  onClick={() =>
    exportReportPDF(
      "reportToExport",
      report.startupName
    )
  }

                    className="
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          border
          border-white/10
          bg-[#111827]/80
          backdrop-blur-xl
          transition
          hover:scale-110
          "

                >
                    <Share2 />
                </button>

            </div>

       

            <header className="sticky top-0 z-40 border-b border-white/5 bg-[#030712]/70 backdrop-blur-2xl">

                <div className="mx-auto flex w-[92%] max-w-7xl items-center justify-between py-5">

                    {/* Left */}

                    <div className="flex items-center gap-5">

                        <button
                            onClick={() => navigate(-1)}
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#111827]/70 hover:border-[#7C3AED]/40 transition"
                        >
                            <ArrowLeft size={18} />
                        </button>

                        <div>

                            <h1 className="text-xl font-bold">
                                Startup Analysis Report
                            </h1>

                            <p className="text-sm text-[#94A3B8]">
                                Generated by FMIdea AI
                            </p>

                        </div>

                    </div>

                    {/* Right */}

                    <div className="text-sm text-slate-400">
                        FMIdea AI Report
                    </div>

                </div>

            </header>

            {/* ========================================================= */}
            {/* CONTENT */}
            {/* ========================================================= */}

        <motion.section
    variants={containerVariants}
    initial="hidden"
    animate="show"
    className="
    relative
    z-10
    mx-auto
    w-[92%]
    max-w-7xl
    py-16
    space-y-10
"
>

    <motion.div variants={fadeUp}>
        <ScoreCard report={report} />
    </motion.div>

    <motion.div variants={fadeUp}>
        <SummaryCard report={report} />
    </motion.div>

    <motion.div variants={fadeUp}>
        <CompetitorCard report={report} />
    </motion.div>

    <motion.div variants={fadeUp}>
        <SWOTCard report={report} />
    </motion.div>

    <motion.div variants={fadeUp}>
        <RecommendationCard report={report} />
    </motion.div>

</motion.section>
            {/* ========================================================= */}
            {/* FOOTER */}
            {/* ========================================================= */}

            <footer
                className="
  relative
  z-20
  mt-24
  border-t
  border-white/5
  "
            >

                <div
                    className="
    mx-auto
    flex
    w-[92%]
    max-w-7xl
    flex-col
    items-center
    justify-between
    gap-8
    py-14
    md:flex-row
    "
                >

                    <div>

                        <h3
                            className="
        bg-gradient-to-r
        from-[#7C3AED]
        to-[#3B82F6]
        bg-clip-text
        text-2xl
        font-bold
        text-transparent
        "
                        >
                            FMIdea AI
                        </h3>

                        <p className="mt-2 text-sm text-[#94A3B8]">

                            AI Startup Validation Platform

                        </p>

                    </div>

                    <div
                        className="
      flex
      items-center
      gap-3
      rounded-2xl
      border
      border-white/5
      bg-[#111827]/60
      px-6
      py-4
      backdrop-blur-xl
      "
                    >

                        <Sparkles
                            className="text-[#7C3AED]"
                            size={20}
                        />

                        <span className="text-sm text-[#94A3B8]">

                            Built with React • Gemini AI • Tailwind CSS • Framer Motion

                        </span>

                    </div>

                </div>

            </footer>
        </main>

    );

}