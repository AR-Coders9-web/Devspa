import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import Lenis from '@studio-freight/lenis';
import { Home } from 'lucide-react';

const NotFound = () => {
  const containerRef = useRef(null);
  const text404Ref = useRef(null);
  const contentRef = useRef(null);
  const glowRef1 = useRef(null);
  const glowRef2 = useRef(null);
  const glassCardRef = useRef(null);

  useEffect(() => {
    // Initialize smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    let ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      // Reveal for the glassmorphic card
      tl.fromTo(glassCardRef.current,
        { y: 50, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 1, ease: "power4.out" }
      )
      // Reveal for 404 text
      .fromTo(text404Ref.current, 
        { y: 50, opacity: 0, filter: "blur(10px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", duration: 1.2, ease: "elastic.out(1, 0.7)" },
        "-=0.6"
      )
      // Reveal for inner content[cite: 1]
      .fromTo(contentRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" },
        "-=0.8"
      );

      // Continuous floating animation[cite: 1]
      gsap.to(text404Ref.current, {
        y: -15,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // Enhanced Mouse Parallax for Neural Orbs[cite: 1]
      const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const xPos = (clientX / window.innerWidth - 0.5) * 60;
        const yPos = (clientY / window.innerHeight - 0.5) * 60;

        gsap.to(glowRef1.current, {
          x: xPos * 2.5,
          y: yPos * 2.5,
          duration: 1.5,
          ease: "power2.out"
        });

        gsap.to(glowRef2.current, {
          x: -xPos * 2,
          y: -yPos * 2,
          duration: 1.5,
          ease: "power2.out"
        });
      };

      window.addEventListener('mousemove', handleMouseMove);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }, containerRef);

    return () => {
      ctx.revert();
      lenis.destroy();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative min-h-screen w-full bg-[#030712] flex flex-col items-center justify-center overflow-hidden selection:bg-primary/40 selection:text-whiteText"
    >
      {/* Dynamic Neural Glow Background */}
      <div 
        ref={glowRef1}
        className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#7C3AED]/20 rounded-full blur-[150px] pointer-events-none mix-blend-screen"
      />
      <div 
        ref={glowRef2}
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#3B82F6]/15 rounded-full blur-[180px] pointer-events-none mix-blend-screen"
      />

      {/* Futuristic Grid Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDQwTTAgMjBoNDBNMCAzMGg0ME0xMCAwdjQwTTIwIDB2NDBNMzAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] pointer-events-none" />

      {/* Glassmorphism Main Container */}
      <div 
        ref={glassCardRef}
        className="relative z-10 w-full max-w-4xl mx-auto px-6"
      >
        <div className="flex flex-col items-center text-center p-10 md:p-16 rounded-[2rem] bg-[#111827]/40 backdrop-blur-2xl border border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] ring-1 ring-white/10">
          
          {/* Holographic 404 Text */}
          <h1 
            ref={text404Ref}
            className="text-[140px] leading-[0.8] md:text-[220px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#F8FAFC] via-[#94A3B8] to-[#111827] drop-shadow-[0_0_60px_rgba(124,58,237,0.4)] mb-4"
          >
            404
          </h1>

          <div ref={contentRef} className="flex flex-col items-center w-full">
            {/* High-Tech Status Badge */}
            <div className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#EF4444]/30 bg-[#EF4444]/10 backdrop-blur-md text-[#EF4444] text-xs font-bold tracking-[0.2em] uppercase mb-8 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
              System Error: Identity Not Found
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold text-[#F8FAFC] tracking-tight mb-6">
              Signal Lost in the Void
            </h2>
            
            <p className="text-base md:text-lg text-[#94A3B8] max-w-lg mb-12 font-light leading-relaxed">
              The digital coordinates you requested do not exist in this sector. The node may have been relocated or purged from the network.
            </p>

            {/* Premium Interactive Button */}
            <Link 
              to="/"
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-transparent text-[#F8FAFC] font-medium rounded-2xl transition-all duration-500 overflow-hidden"
            >
              {/* Button Glass Background */}
              <div className="absolute inset-0 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl transition-colors duration-500 group-hover:bg-white/10 group-hover:border-white/20" />
              
              {/* Button Hover Glow (Neural Interface Style) */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-[#7C3AED]/30 via-[#3B82F6]/30 to-[#7C3AED]/30 blur-xl transition-opacity duration-500" />
              
              <Home className="relative z-10 text-[#94A3B8] group-hover:text-[#F8FAFC] transition-colors duration-300" size={22} strokeWidth={2} />
              <span className="relative z-10 tracking-wide">Re-establish Connection</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;