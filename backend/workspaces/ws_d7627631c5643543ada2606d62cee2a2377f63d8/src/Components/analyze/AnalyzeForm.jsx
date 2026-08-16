import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, ArrowRight, ArrowLeft, Check, AlertCircle, Loader2, BrainCircuit, 
  Activity, Zap, Shield, Target, Rocket, Lightbulb, TrendingUp, DollarSign, 
  Users, Globe, Cpu, CheckCircle2 
} from 'lucide-react';
import gsap from 'gsap';
import Lenis from 'lenis';
import { analyzeStartup } from "../../services/gemini";
import { searchStartup } from "../../services/tavily";

// ==========================================
// THEME & CONSTANTS
// ==========================================
const COLORS = {
  bg: '#030712',
  surface: '#111827',
  border: '#1F2937',
  primary: '#7C3AED',
  secondary: '#3B82F6',
  success: '#22C55E',
  error: '#EF4444',
  text: '#F8FAFC',
  muted: '#94A3B8'
};

const LOADING_PHASES = [
  "Initializing AI Engine...",
  "Scanning Competitor Landscape...",
  "Analyzing Market Dynamics...",
  "Evaluating Patent Possibilities...",
  "Building SWOT Analysis...",
  "Structuring Product Roadmap...",
  "Generating Final Report..."
];

const PREFILL_SUGGESTIONS = [
  {
    title: "AI Healthcare SaaS",
    icon: <Activity className="w-5 h-5 text-blue-400" />,
    data: {
      startupName: "MediMind AI", tagline: "Predictive diagnostics for proactive care",
      pitch: "An AI-powered diagnostic tool that analyzes patient history and real-time vitals to predict severe health events before they happen.",
      industry: "Healthcare", stage: "Prototyping",
      problemStatement: "Doctors are overloaded and reactive rather than proactive.",
      solution: "Predictive AI models analyzing multimodal health data in real-time."
    }
  },
  {
    title: "FinTech Infrastructure",
    icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
    data: {
      startupName: "LedgerFlow", tagline: "Unified API for cross-border DeFi",
      pitch: "A B2B API that bridges traditional banking ledgers with decentralized finance protocols for instant, zero-fee cross-border settlements.",
      industry: "FinTech", stage: "Seed",
      problemStatement: "Cross-border B2B payments are slow (T+3) and expensive (3-5% fees).",
      solution: "Smart-contract unified ledger settling transactions in seconds."
    }
  }
];

// ==========================================
// FORM CONFIGURATION (6 STEPS)
// ==========================================
const FORM_STEPS = [
  {
    id: 1,
    title: "Startup Basics",
    icon: <Globe />,
    fields: [
      {
        name: "startupName",
        label: "Startup Name",
        type: "text",
        required: true,
        half: true,
      },
      {
        name: "industry",
        label: "Industry",
        type: "select",
        options: [
          "AI",
          "SaaS",
          "Healthcare",
          "FinTech",
          "EdTech",
          "Marketplace",
          "Other",
        ],
        half: true,
      },
      {
        name: "pitch",
        label: "One-line Pitch",
        type: "textarea",
        required: true,
        max: 150,
      },
      {
        name: "stage",
        label: "Current Stage",
        type: "select",
        options: ["Idea", "MVP", "Growth"],
        half: true,
      },
    ],
  },

  {
    id: 2,
    title: "Problem",
    icon: <Lightbulb />,
    fields: [
      {
        name: "problemStatement",
        label: "Problem Statement",
        type: "textarea",
      },
      {
        name: "targetAudience",
        label: "Target Audience",
        type: "textarea",
      },
      {
        name: "businessModel",
        label: "Business Model",
        type: "select",
        options: ["B2B", "B2C", "Marketplace", "B2B2C"],
      },
    ],
  },

  {
    id: 3,
    title: "Technology",
    icon: <Cpu />,
    fields: [
      {
        name: "techStack",
        label: "Tech Stack",
        type: "text",
        half: true,
      },
      {
        name: "aiUsage",
        label: "How are you using AI?",
        type: "textarea",
      },
      {
        name: "competitors",
        label: "Top Competitors (Optional)",
        type: "text",
      },
    ],
  },

  {
    id: 4,
    title: "Goals",
    icon: <Rocket />,
    fields: [
      {
        name: "revenueModel",
        label: "Revenue Model",
        type: "select",
        options: [
          "Subscription",
          "Freemium",
          "Ads",
          "Marketplace",
          "One-time",
        ],
      },
      {
        name: "specificQuestions",
        label: "What do you want AI to analyze?",
        type: "textarea",
      },
    ],
  },
];

// ==========================================
// UTILITY COMPONENTS
// ==========================================

const BackgroundEffects = () => (
  <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#030712]">
    {/* Noise Texture */}
    <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" 
         style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
    {/* Animated Auroras */}
    <motion.div 
      animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#7C3AED] rounded-full blur-[120px]" 
    />
    <motion.div 
      animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[#3B82F6] rounded-full blur-[120px]" 
    />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
  </div>
);

const MagneticButton = ({ children, onClick, className = '', disabled = false }) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!buttonRef.current || disabled) return;
    const xTo = gsap.quickTo(buttonRef.current, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const yTo = gsap.quickTo(buttonRef.current, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { height, width, left, top } = buttonRef.current.getBoundingClientRect();
      const x = clientX - (left + width / 2);
      const y = clientY - (top + height / 2);
      xTo(x * 0.2);
      yTo(y * 0.2);
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
    };

    const el = buttonRef.current;
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [disabled]);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden group ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  );
};

const AnimatedInput = ({ field, value, onChange, error }) => {
  const [isFocused, setIsFocused] = useState(false);
  const isPopulated = value && value.length > 0;

  const baseClasses =
  "w-full rounded-2xl border border-white/10 bg-[#0F172A]/70 backdrop-blur-xl px-5 pt-7 pb-4 text-white text-base outline-none transition-all duration-300 hover:border-violet-500/40 focus:border-violet-500";
  
  const focusClasses = isFocused
  ? "border-violet-500 shadow-[0_0_35px_rgba(124,58,237,.35)] scale-[1.02]"
  : "";
  const errorClasses = error ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "";

  return (
    <motion.div 
      className={`relative flex flex-col ${field.half ? 'md:col-span-1' : 'col-span-1 md:col-span-2'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <label 
        className={`
    absolute
    left-5
    pointer-events-none
    origin-left
    transition-all
    duration-300
    ease-out
    z-10
    ${
      isFocused || isPopulated
        ? "top-2 scale-90 text-violet-400 font-medium"
        : "top-1/2 -translate-y-1/2 scale-100 text-slate-500"
    }
  `}
        >
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        
        {field.type === 'textarea' ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={4}
            className={`${baseClasses} ${focusClasses} ${errorClasses} resize-none pt-8 min-h-[150px]`}
          />
        ) : field.type === 'select' ? (
    <select
  name={field.name}
  value={value ?? ""}
  onChange={(e) => onChange(field.name, e.target.value)}
  onFocus={() => setIsFocused(true)}
  onBlur={() => setIsFocused(false)}
  className={`
    ${baseClasses}
    ${focusClasses}
    ${errorClasses}
    appearance-none
    pt-7
    pb-3
    px-5
    cursor-pointer
    text-white
  `}
>
  <option value="" disabled hidden>
    Select {field.label}
  </option>

  {field.options.map((opt) => (
    <option
      key={opt}
      value={opt}
      className="bg-[#111827] text-white"
    >
      {opt}
    </option>
  ))}
</select>
        ) : (
          <input
            type={field.type}
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`${baseClasses} ${focusClasses} ${errorClasses} pt-7`}
          />
        )}
        
        {/* Validation Icon */}
        <div className="absolute right-4 top-4">
          {error && <motion.div initial={{scale:0}} animate={{scale:1}}><AlertCircle className="w-5 h-5 text-red-500" /></motion.div>}
          {!error && isPopulated && <motion.div initial={{scale:0}} animate={{scale:1}}><CheckCircle2 className="w-5 h-5 text-green-400" /></motion.div>}
        </div>
      </div>
      
      {field.max && (
        <div className="text-right mt-1 text-xs text-[#94A3B8]">
          {(value || '').length} / {field.max}
        </div>
      )}
    </motion.div>
  );
};


// ==========================================
// MAIN FORM COMPONENT
// ==========================================
export default function AnalyzeForm() {
  const navigate = useNavigate();
  
  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  // Compute Completion
  const totalFields = FORM_STEPS.reduce((acc, step) => acc + step.fields.length, 0);
  const filledFields = Object.values(formData).filter(v => v && v.toString().trim().length > 0).length;
  const completionPercentage = Math.round((filledFields / totalFields) * 100);

  // Handlers
  const handleInputChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null })); // clear error on type
  }, [errors]);

  const prefillData = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

const validateStep = () => {
  const stepFields = FORM_STEPS[currentStep - 1].fields;

  const newErrors = {};

  let isValid = true;

  for (const field of stepFields) {

    const value = (formData[field.name] ?? "").toString().trim();

    if (!field.required) continue;

    if (value === "") {
      newErrors[field.name] = "This field is required.";
      isValid = false;
      continue;
    }

    switch (field.name) {

      case "startupName":
        if (value.length < 3) {
          newErrors[field.name] = "Startup name is too short.";
          isValid = false;
        }
        break;

      case "pitch":
        if (value.length < 40) {
          newErrors[field.name] = "Pitch should be at least 40 characters.";
          isValid = false;
        }
        break;

      case "problemStatement":
        if (value.length < 80) {
          newErrors[field.name] = "Problem statement should be detailed.";
          isValid = false;
        }
        break;

      case "targetAudience":
        if (value.length < 30) {
          newErrors[field.name] = "Describe your target audience.";
          isValid = false;
        }
        break;

      default:
        break;
    }
  }

  setErrors(newErrors);

  return isValid;
};

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, FORM_STEPS.length));
      window.scrollTo({ top: 600, behavior: 'smooth' });
    } else {
      // Shake animation on error via GSAP
      gsap.fromTo('.form-container', { x: -10 }, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)", clearProps: "all" });
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

const startAnalysis = async () => {

  if (!validateStep()) return;

  const totalInput = Object.values(formData)
    .join(" ")
    .trim();

  if (totalInput.length < 500) {
    alert(
      "Please provide more detailed startup information before running AI analysis."
    );
    return;
  }

  setIsAnalyzing(true);

  try {
    for (let i = 0; i < LOADING_PHASES.length; i++) {
      setLoadingPhase(i);
      await new Promise((res) => setTimeout(res, 600));
    }

    // Build search query
    const searchQuery = `
      ${formData.startupName || ""}
      ${formData.pitch || ""}
      ${formData.industry || ""}
      ${formData.problemStatement || ""}
    `;

    // Tavily
  let tavilyData = {
  query: searchQuery,
  answer: "",
  results: [],
};

try {
  tavilyData = await searchStartup(searchQuery);
} catch (e) {
  console.warn("Skipping Tavily:", e);
}

const report = await analyzeStartup(formData, tavilyData);

    // Invalid report check
    if (report?.status === "invalid") {
      alert(report.reason);
      return;
    }

    console.log("FINAL REPORT");
    console.log(report);

    navigate("/result", {
      state: { report },
    });

  } 
  
  catch (err) {
  console.error("Full Error:", err);

  if (err instanceof Error) {
    alert(err.message);
  } else if (typeof err === "object") {
    alert(JSON.stringify(err, null, 2));
  } else {
    alert(String(err));
  }
} finally {
    setIsAnalyzing(false);
  }
};


const getAIHint = () => {
  switch (currentStep) {
    case 1: {
  const missing = [];

  if (!formData.startupName) missing.push("Startup Name");
  if (!formData.pitch) missing.push("One-line Pitch");
  if (!formData.industry) missing.push("Industry");
  if (!formData.stage) missing.push("Startup Stage");

  if (missing.length > 0) {
    return `⚠️ Missing: ${missing.join(", ")}. Complete these fields to help AI accurately understand your startup identity, market category, and business positioning. A strong foundation significantly improves the quality of the final analysis.`;
  }

  if (formData.pitch.length < 80) {
    return "💡 Your pitch looks good, but adding more detail about the problem, target users, and unique value proposition will greatly improve AI accuracy.";
  }

  return "✅ Excellent! Your startup identity is complete. AI now has enough information to understand your startup before moving to deeper business validation.";
}
case 2: {
  const missing = [];

  if (!formData.problemStatement) missing.push("Problem Statement");
  if (!formData.currentSolutions) missing.push("Current Solutions");
  if (!formData.innovationLevel) missing.push("Innovation Level");

  if (missing.length > 0)
    return `⚠️ Missing: ${missing.join(", ")}. Clearly explaining the market problem and existing alternatives helps AI identify opportunities and competitive advantages.`;

  return "✅ Great! The AI has enough information to evaluate problem severity, innovation, and market differentiation.";
}

case 3: {
  const missing = [];

  if (!formData.targetAudience) missing.push("Target Audience");
  if (!formData.idealCustomer) missing.push("Ideal Customer Persona");
  if (!formData.painPoints) missing.push("Pain Points");

  if (missing.length > 0)
    return `⚠️ Missing: ${missing.join(", ")}. Better customer information enables more accurate market validation and customer-fit analysis.`;

  return "✅ Audience profiling looks excellent. AI can now estimate customer demand and market potential.";
}
case 4: {
  const missing = [];

  if (!formData.businessModel) missing.push("Business Model");
  if (!formData.revenueModel) missing.push("Revenue Model");
  if (!formData.pricingStrategy) missing.push("Pricing Strategy");

  if (missing.length > 0)
    return `⚠️ Missing: ${missing.join(", ")}. Revenue and pricing information helps AI estimate scalability and long-term sustainability.`;

  return "✅ Business model looks complete. Ready for profitability analysis.";
}
case 5: {
  const missing = [];

  if (!formData.techStack) missing.push("Tech Stack");
  if (!formData.aiUsage) missing.push("AI Usage");
  if (!formData.dataSource) missing.push("Data Source");
  if (!formData.scalabilityPlan) missing.push("Scalability Plan");

  if (missing.length > 0) {
    return `⚠️ Missing: ${missing.join(", ")}.

The AI requires these technical details to evaluate innovation, technical feasibility, scalability, security, and long-term maintainability.

Providing detailed technical information will significantly improve the quality and confidence of the final AI analysis.`;
  }

  return `✅ Excellent!

Your technical architecture looks complete.

The AI now has enough information to evaluate:
• Technical feasibility
• AI implementation
• Scalability
• Security
• Competitive advantage`;
}
case 6: {
  const missing = [];

  if (!formData.fundingStage) missing.push("Funding");
  if (!formData.teamSize) missing.push("Team Size");
  if (!formData.launchTimeline) missing.push("Launch Timeline");

  if (missing.length > 0)
    return `⚠️ Missing: ${missing.join(", ")}. Final execution details are required before generating your AI Startup Validation Report.`;

  return "🚀 Everything is complete. Click 'Start AI Research' to generate your Startup Report.";
}
default:
      return "Provide as much accurate and detailed information as possible. Rich context allows the AI to generate a significantly more reliable startup validation report, identify real competitors, estimate market opportunities, and produce actionable business insights.";
  }
};
  // Render Full Screen Loading
  if (isAnalyzing) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030712] text-white">
        <BackgroundEffects />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative flex flex-col items-center"
        >
          {/* Glowing Orb */}
          <div className="relative w-32 h-32 mb-8">
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-t-2 border-l-2 border-[#7C3AED] opacity-80"
            />
            <motion.div 
              animate={{ rotate: -360 }} 
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 rounded-full border-b-2 border-r-2 border-[#3B82F6] opacity-60"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <BrainCircuit className="w-12 h-12 text-white animate-pulse" />
            </div>
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#7C3AED] to-[#3B82F6] blur-2xl opacity-30 rounded-full mix-blend-screen" />
          </div>

          <motion.h2 
            key={loadingPhase}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 tracking-tight"
          >
            {LOADING_PHASES[loadingPhase]}
          </motion.h2>
          
          <div className="mt-8 w-64 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#7C3AED] to-[#3B82F6]"
              initial={{ width: "0%" }}
              animate={{ width: `${((loadingPhase + 1) / LOADING_PHASES.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#F8FAFC] font-sans selection:bg-[#7C3AED]/30">
      <BackgroundEffects />

      {/* HEADER SECTION */}
      <header className="relative pt-24 pb-12 px-6 md:px-12 flex flex-col items-center text-center z-10">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"
        >
          <Sparkles className="w-4 h-4 text-[#7C3AED]" />
          <span className="text-sm font-medium text-white/80 tracking-wide uppercase">AI Startup Research Engine </span>
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tighter max-w-4xl leading-[1.1]"
        >
          Validate Your Startup <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#3B82F6]">
            Before You Build It
          </span>
        </motion.h1>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg md:text-xl text-[#94A3B8] max-w-2xl font-light"
        >
          Provide the core details of your vision. Our proprietary AI will generate a complete SWOT analysis, market validation, and roadmap.
        </motion.p>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-6 pb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* LEFT/TOP: Form Area (8 cols) */}
        <div className="lg:col-span-8 space-y-8 form-container">
          
          {/* Progress Toolbar */}
          <div className="bg-[#111827]/40 border border-white/5 backdrop-blur-xl rounded-2xl p-6 sticky top-6 z-20">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="text-sm font-medium text-[#94A3B8] uppercase tracking-wider mb-1">
                  Step {currentStep} of {FORM_STEPS.length}
                </h3>
                <div className="text-xl font-semibold text-white flex items-center gap-3">
                  {FORM_STEPS[currentStep - 1].icon}
                  {FORM_STEPS[currentStep - 1].title}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#22C55E] to-[#3B82F6]">
                  {completionPercentage}%
                </div>
                <div className="text-xs text-[#94A3B8]">Data Completeness</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#7C3AED] to-[#3B82F6]"
                initial={{ width: "0%" }}
                animate={{ width: `${(currentStep / FORM_STEPS.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>

          {/* Form Step Container */}
          <div className="bg-[#111827]/40 border border-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-10 shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {FORM_STEPS[currentStep - 1].fields.map((field) => (
                  <AnimatedInput 
                    key={field.name}
                    field={field}
                    value={formData[field.name]}
                    onChange={handleInputChange}
                    error={errors[field.name]}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="mt-12 flex justify-between items-center pt-6 border-t border-white/10">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  currentStep === 1 
                    ? 'opacity-0 pointer-events-none' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              
              {currentStep < FORM_STEPS.length ? (
                <MagneticButton 
                  onClick={nextStep}
                  className="bg-white text-black px-8 py-3 rounded-xl font-semibold hover:scale-[1.02] transition-transform"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </MagneticButton>
              ) : (
                <MagneticButton 
                  onClick={startAnalysis}
                  className="bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] text-white px-8 py-3 rounded-xl font-semibold shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_50px_rgba(124,58,237,0.5)] transition-all"
                >
                  <Sparkles className="w-4 h-4" /> Start AI Research
                </MagneticButton>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Smart Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Pre-fill Suggestions (Only Step 1) */}
          <AnimatePresence>
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-lg overflow-hidden"
              >
                <div className="flex items-center gap-2 text-sm text-[#94A3B8] mb-4">
                  <Zap className="w-4 h-4 text-yellow-500" /> Hackathon Quick Fill
                </div>
                <div className="space-y-3">
                  {PREFILL_SUGGESTIONS.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => prefillData(sug.data)}
                      className="w-full text-left p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all flex items-start gap-3 group"
                    >
                      <div className="p-2 rounded-lg bg-[#030712] border border-white/10 group-hover:scale-110 transition-transform">
                        {sug.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm">{sug.title}</div>
                        <div className="text-xs text-[#94A3B8] mt-1 truncate w-48">{sug.data.startupName} - {sug.data.tagline}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Live Analysis Panel */}
          <div className="bg-gradient-to-b from-[#111827]/80 to-[#111827]/40 border border-[#7C3AED]/20 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group">
            {/* Animated Glow in Panel */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#7C3AED] rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <BrainCircuit className="w-6 h-6 text-[#7C3AED]" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
              </div>
              <h3 className="font-semibold text-white">AI Co-Pilot</h3>
            </div>

            <div className="space-y-4 text-sm text-[#94A3B8]">
              <div className="p-4 rounded-xl bg-black/30 border border-white/5 border-l-2 border-l-[#7C3AED]">
                <p>{getAIHint()}</p>
              </div>

              {/* Confidence Meter Simulate */}
              <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between text-xs mb-2">
                  <span>Validation Readiness</span>
                  <span className="text-[#3B82F6] font-medium">{Math.min(completionPercentage * 1.5, 98).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-[#3B82F6]"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(completionPercentage * 1.5, 98)}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Security/Trust Badge */}
          <div className="flex items-center gap-3 text-xs text-[#94A3B8] justify-center pt-4 opacity-60">
            <Shield className="w-4 h-4" />
            Your data is analyzed securely and never trained upon.
          </div>

        </div>
      </main>
    </div>
  );
}