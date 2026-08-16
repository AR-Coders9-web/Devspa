import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "../utils/gsapConfig";

export default function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      infinite: false,
      autoRaf: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    lenis.on("scroll", () => {
      gsap.ticker.tick();
    });

    return () => {
      lenis.destroy();
    };
  }, []);
}