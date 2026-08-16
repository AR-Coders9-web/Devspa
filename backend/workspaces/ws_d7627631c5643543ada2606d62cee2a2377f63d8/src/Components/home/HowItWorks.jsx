import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  FileText, 
  BrainCircuit, 
  BarChart3, 
  Download,
  CheckCircle2,
  Cpu,
  Target,
  Presentation,
  ChevronDown,
  ArrowRight,
  Sparkles,
  MoveDown
} from 'lucide-react';
import AnalyzeForm from '../analyze/AnalyzeForm';
import { Link } from 'react-router-dom';

// --- DATA ARRAYS ---
const TIMELINE_STEPS = [
  { 
    icon: Lightbulb, 
    title: 'Describe Your Idea', 
    description: 'Tell FMidea about your startup, business, or app idea.' 
  },
  { 
    icon: FileText, 
    title: 'Complete the Smart Form', 
    description: 'Answer guided questions about your problem, users, market, features, and goals.' 
  },
  { 
    icon: BrainCircuit, 
    title: 'AI Deep Analysis', 
    description: 'FMidea evaluates innovation, feasibility, competitors, business model, risks, and opportunities.' 
  },
  { 
    icon: BarChart3, 
    title: 'Professional Report', 
    description: 'Receive startup scores, SWOT analysis, roadmap, recommendations, and validation insights.' 
  },
  { 
    icon: Download, 
    title: 'Export & Share', 
    description: 'Download your report as PDF and share it with teammates, mentors, or investors.' 
  }
];

const FEATURES = [
  'Executive Summary', 'Idea Score', 'Innovation Score', 
  'SWOT Analysis', 'Competitor Analysis', 'Market Opportunity', 
  'Revenue Model', 'MVP Features', 'Technical Complexity', 
  'Risks', 'AI Suggestions', 'Roadmap', 'PDF Export'
];

const BENEFITS = [
  { 
    title: 'AI-Powered Analysis', 
    icon: Cpu, 
    description: 'Advanced neural models validate your concepts with pinpoint accuracy.' 
  },
  { 
    title: 'Startup-Focused Insights', 
    icon: Target, 
    description: 'Actionable metrics tailored specifically for early-stage growth and scaling.' 
  },
  { 
    title: 'Professional Reports', 
    icon: Presentation, 
    description: 'Investor-ready documentation generated automatically in seconds.' 
  }
];

const FAQS = [
  { 
    q: 'How long does analysis take?', 
    a: 'Our AI engines process your data and generate a comprehensive validation report in under 60 seconds.' 
  },
  { 
    q: 'Is my idea private?', 
    a: 'Absolutely. All submissions are encrypted, kept strictly confidential, and never used to train public models.' 
  },
  { 
    q: 'Can I export the report?', 
    a: 'Yes, you can instantly export your full analysis as a beautifully formatted PDF to share with investors.' 
  },
  { 
    q: 'Can I analyze unlimited ideas?', 
    a: 'Premium members get unlimited validations, while standard users receive up to 5 comprehensive reports per month.' 
  }
];

// --- ANIMATION VARIANTS ---
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const fadeUp = {
  hidden: { y: 30, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

// --- SUB-COMPONENTS ---
const GlowingBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#7C3AED]/20 rounded-full blur-[150px] mix-blend-screen" />
    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#3B82F6]/15 rounded-full blur-[150px] mix-blend-screen" />
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDQwTTAgMjBoNDBNMCAzMGg0ME0xMCAwdjQwTTIwIDB2NDBNMzAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
  </div>
);

const AccordionItem = ({ q, a }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
      >
        <span className="text-lg font-medium text-[#F8FAFC] group-hover:text-[#7C3AED] transition-colors">{q}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="text-[#94A3B8]" size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-[#94A3B8] leading-relaxed pr-8">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- MAIN COMPONENT ---
const HowItWorks = () => {
  return (
    <section className="relative min-h-screen bg-[#030712] text-[#F8FAFC] font-sans selection:bg-[#7C3AED]/40">
      <GlowingBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32 flex flex-col gap-32">
        
        {/* HERO SECTION */}
        <motion.div 
          initial="hidden" 
          whileInView="show" 
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center max-w-3xl mx-auto flex flex-col items-center"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
            <Sparkles size={16} className="text-[#7C3AED]" />
            <span className="text-sm font-semibold tracking-wide uppercase text-[#94A3B8]">Validation Engine</span>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 drop-shadow-[0_0_40px_rgba(124,58,237,0.3)]">
            How FMidea Works
          </motion.h1>
          <motion.p variants={fadeUp} className="text-xl text-[#94A3B8] mb-10 leading-relaxed font-light">
            Transform your startup idea into a professional AI-powered business report.
          </motion.p>
          <motion.button 
            variants={fadeUp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative px-8 py-4 bg-transparent rounded-xl overflow-hidden font-medium tracking-wide"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSIvPjwvc3ZnPg==')] opacity-50" />
            <span className="relative z-10 flex items-center gap-2 text-white">
              Read Documentation <MoveDown size={18} className="group-hover:translate-x-1 transition-transform" />
            </span>
            
          </motion.button>
        </motion.div>

        {/* TIMELINE SECTION */}
        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="relative max-w-4xl mx-auto w-full"
        >
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#7C3AED]/50 via-[#3B82F6]/20 to-transparent md:-translate-x-1/2" />
          
          {TIMELINE_STEPS.map((step, idx) => (
            <motion.div 
              key={idx} 
              variants={fadeUp} 
              className={`relative flex items-center mb-16 last:mb-0 ${idx % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row'} flex-row`}
            >
              <div className="hidden md:block md:w-1/2" />
              <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[#111827] border border-[#7C3AED]/40 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.3)] z-10">
                <step.icon size={20} className="text-[#7C3AED]" />
              </div>
              <div className={`w-full pl-20 md:w-1/2 md:pl-0 ${idx % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16 text-left'}`}>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl hover:bg-white/10 transition-colors duration-300">
                  <span className="text-[#7C3AED] font-mono text-sm mb-2 block">Step 0{idx + 1}</span>
                  <h3 className="text-2xl font-bold mb-3 text-white">{step.title}</h3>
                  <p className="text-[#94A3B8] leading-relaxed">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* WHAT YOU'LL RECEIVE SECTION */}
        <div className="space-y-16">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">What You'll Receive</h2>
            <p className="text-[#94A3B8]">A complete analysis covering every angle of your business.</p>
          </div>
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="flex flex-wrap justify-center gap-4 max-w-5xl mx-auto"
          >
            {FEATURES.map((feature, idx) => (
              <motion.div 
                key={idx} 
                variants={fadeUp}
                whileHover={{ y: -5 }}
                className="flex items-center gap-3 bg-[#111827]/60 backdrop-blur-md border border-white/10 px-5 py-3 rounded-xl shadow-lg hover:border-[#3B82F6]/50 transition-colors cursor-default"
              >
                <CheckCircle2 size={18} className="text-[#3B82F6]" />
                <span className="text-[#F8FAFC] font-medium text-sm md:text-base">{feature}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* BENEFITS SECTION */}
        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {BENEFITS.map((benefit, idx) => (
            <motion.div 
              key={idx} 
              variants={fadeUp}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/0 to-[#3B82F6]/0 group-hover:from-[#7C3AED]/10 group-hover:to-[#3B82F6]/10 transition-all duration-500" />
              <div className="relative z-10 flex flex-col items-start text-left">
                <div className="p-3 bg-[#111827] border border-white/10 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-500">
                  <benefit.icon size={28} className="text-[#F8FAFC]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                <p className="text-[#94A3B8] leading-relaxed">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ SECTION */}
        <div className="max-w-3xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Common Questions</h2>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10">
            {FAQS.map((faq, idx) => (
              <AccordionItem key={idx} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>

        {/* FINAL CTA SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative max-w-5xl mx-auto w-full rounded-[2.5rem] p-12 md:p-20 text-center overflow-hidden bg-[#111827]/40 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] ring-1 ring-white/10"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#7C3AED]/30 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#3B82F6]/30 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-4xl md:text-6xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white via-[#94A3B8] to-[#111827]">
              Ready to validate your next big idea?
            </h2>
            <p className="text-[#94A3B8] text-lg mb-10 max-w-2xl">
              Stop guessing. Start building with data-backed confidence and AI-driven precision today.
            </p>
            <Link to="/analyze">
            <motion.button 
            
            whileHover={{ scale: 1 }}
            whileTap={{ scale: 0.9 }}
            className="px-10 py-5 bg-white text-[#030712] font-bold text-lg rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all duration-300 flex items-center gap-3"
            >
              Start Analysis <ArrowRight size={20} />
            </motion.button>
              </Link>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default HowItWorks;