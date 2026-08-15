import { useEffect, useRef, useState } from "react";
import { Power, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
function BootScreen({ onBootComplete }) {

    const navigate = useNavigate();
  const [booting, setBooting] = useState(false);
  const [fading, setFading] = useState(false);

  const audioRef = useRef(null);
  const bootTimerRef = useRef(null);

  const handleBoot = async () => {
    if (booting) return;

    setBooting(true);

    // ==========================================
    // DEVSPACE BOOT SOUND
    // Replace this file with your actual sound.
    // ==========================================
    try {
      audioRef.current = new Audio("/sound/a.mp3");
      audioRef.current.volume = 0.9;

      await audioRef.current.play();
    } catch (error) {
      console.warn("DEVSPACE boot sound could not be played:", error);
    }

    /*
      The logo reveal animation is a standalone HTML
      animation placed inside /public/intro/.

      Adjust this duration if your animation is longer/shorter.
    */
    bootTimerRef.current = setTimeout(() => {
      handleAnimationComplete();
    }, 7000);
  };

const handleAnimationComplete = async () => {
  if (bootTimerRef.current) {
    clearTimeout(bootTimerRef.current);
    bootTimerRef.current = null;
  }

  // Cinematic fade
  setFading(true);

  setTimeout(async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (data.authenticated === true) {
        // Existing logged-in user
        navigate("/home", { replace: true });
      } else {
        // First-time / logged-out user
        navigate("/login", { replace: true });
      }
    } catch (error) {
      console.error("Authentication check failed:", error);

      // If backend is unavailable, send user to login
      navigate("/login", { replace: true });
    }
  }, 900);
};

  useEffect(() => {
    return () => {
      if (bootTimerRef.current) {
        clearTimeout(bootTimerRef.current);
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // =========================================================
  // BOOT / LOGO REVEAL SCREEN
  // =========================================================

  if (booting) {
    return (
      <main
        className={`fixed inset-0 z-[9999] h-screen w-screen overflow-hidden bg-black transition-opacity duration-1000 ${
          fading ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* 
          YOUR LOGO REVEAL ANIMATION

          Place:
          public/intro/devspace-logo-reveal.html
        */}
        <iframe
          src="/intro/devspace-logo-reveal.html"
          title="DEVSPACE boot animation"
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay"
        />

        {/* Cinematic black overlay */}
        <div
          className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-900 ${
            fading ? "opacity-100" : "opacity-0"
          }`}
        />
      </main>
    );
  }

  // =========================================================
  // INITIAL DEVSPACE BOOT SCREEN
  // =========================================================

  return (
    <main className="fixed inset-0 z-[9999] h-screen w-screen overflow-hidden bg-[#030303] text-white">
      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.025] blur-[120px]" />

      {/* Technical grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Subtle scan line */}
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full animate-pulse bg-white/10" />

      {/* =====================================================
          TOP SYSTEM INFORMATION
      ====================================================== */}

      <div className="absolute left-6 top-6 flex items-center gap-3 sm:left-10 sm:top-8">
        <div className="h-2 w-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)]" />

        <div className="font-mono text-[9px] font-medium uppercase tracking-[0.28em] text-white/40 sm:text-[10px]">
          DEVSPACE SYSTEM
        </div>
      </div>

      <div className="absolute right-6 top-6 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 sm:right-10 sm:top-8">
        CORE 0.1
      </div>

      {/* =====================================================
          CENTER
      ====================================================== */}

      <section className="absolute inset-0 flex flex-col items-center justify-center px-6">
        {/* Logo frame */}
      
      <div className="relative mb-8">
  {/* Outer ring */}
  <div className="absolute -inset-5 rounded-full border border-white/[0.06]" />

  {/* Inner ring */}
  <div className="absolute -inset-2 rounded-full border border-white/[0.10]" />

  {/* Logo glow */}
  <div className="absolute inset-0 scale-75 rounded-full bg-white/[0.05] blur-2xl" />

  {/* EXACT CENTER */}
  <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
    <img
      src="/logo.png"
      alt="DEVSPA logo"
      className="block h-full w-full object-contain"
      draggable="false"
    />
  </div>
</div>

        {/* Brand */}
        <h1 className="select-none text-4xl font-semibold tracking-[0.22em] text-white sm:text-5xl md:text-6xl">
          DEVSPA
        </h1>

        <p className="mt-4 select-none text-[10px] font-medium uppercase tracking-[0.38em] text-white/40 sm:text-xs">
          The Developer OS
        </p>

        <p className="mt-3 select-none font-mono text-[10px] tracking-[0.18em] text-white/25">
          Understand. Debug. Build.
        </p>

        {/* =================================================
            BOOT BUTTON
        ================================================== */}

        <button
          type="button"
          onClick={handleBoot}
          className="
            group
            relative
            mt-12
            flex
            items-center
            gap-3
            overflow-hidden
            rounded-xl
            border
            border-white/15
            bg-white/[0.035]
            px-7
            py-3.5
            text-[11px]
            font-medium
            uppercase
            tracking-[0.2em]
            text-white/80
            backdrop-blur-xl
            transition-all
            duration-300
            hover:-translate-y-0.5
            hover:border-white/30
            hover:bg-white/[0.07]
            hover:text-white
            hover:shadow-[0_0_40px_rgba(255,255,255,0.06)]
            active:translate-y-0
            active:scale-[0.98]
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-white/40
          "
        >
          {/* Button shine */}
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-transform duration-700 group-hover:translate-x-full" />

          <Power
            size={15}
            strokeWidth={1.5}
            className="relative transition-transform duration-300 group-hover:rotate-90"
          />

          <span className="relative">Boot DEVSPACE</span>

          <ChevronRight
            size={14}
            strokeWidth={1.5}
            className="relative transition-transform duration-300 group-hover:translate-x-1"
          />
        </button>
      </section>

      {/* =====================================================
          BOTTOM SYSTEM STATUS
      ====================================================== */}

      <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-5 whitespace-nowrap sm:bottom-9">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-white/70" />

          <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/35 sm:text-[9px]">
            System Ready
          </span>
        </div>

        <span className="h-3 w-px bg-white/10" />

        <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/25 sm:text-[9px]">
          Secure Boot
        </span>

        <span className="hidden h-3 w-px bg-white/10 sm:block" />

        <span className="hidden font-mono text-[8px] uppercase tracking-[0.18em] text-white/25 sm:block sm:text-[9px]">
          DEVSPACE Core v0.1
        </span>
      </div>
    </main>
  );
}

export default BootScreen;
