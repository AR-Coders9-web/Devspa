import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const heroAnimation = () => {
  const tl = gsap.timeline({
    defaults: {
      ease: "power4.out",
    },
  });

  // Navbar

  tl.from(".navbar", {
    y: -80,
    opacity: 0,
    duration: 0.8,
  });

  // Badge

  tl.from(
    ".hero-badge",
    {
      y: 30,
      opacity: 0,
      duration: 0.5,
    },
    "-=0.4"
  );

  // Heading

  tl.from(
    ".hero-title span",
    {
      y: 120,
      opacity: 0,
      stagger: 0.08,
      duration: 0.9,
    },
    "-=0.2"
  );

  // Description

  tl.from(
    ".hero-description",
    {
      y: 35,
      opacity: 0,
      duration: 0.7,
    },
    "-=0.4"
  );

  // Buttons

  tl.from(
    ".hero-btn",
    {
      y: 25,
      opacity: 0,
      stagger: 0.15,
      duration: 0.6,
    },
    "-=0.3"
  );

  // Stats

  tl.from(
    ".hero-stat",
    {
      y: 30,
      opacity: 0,
      stagger: 0.15,
      duration: 0.5,
    },
    "-=0.3"
  );

  // Dashboard

  tl.from(
    ".hero-dashboard",
    {
      x: 120,
      opacity: 0,
      scale: 0.92,
      duration: 1,
    },
    "-=0.8"
  );

  // Floating Animation

  gsap.to(".floating-card", {
    y: -15,
    duration: 2.5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    stagger: 0.3,
  });

  // Background Glow

  gsap.to(".hero-glow", {
    scale: 1.15,
    opacity: 0.45,
    repeat: -1,
    yoyo: true,
    duration: 5,
    ease: "sine.inOut",
  });

  // Dashboard Rotation

  gsap.to(".hero-dashboard", {
    rotate: 1.5,
    repeat: -1,
    yoyo: true,
    duration: 4,
    ease: "sine.inOut",
  });

  // Scroll Animation

  gsap.from(".hero-section", {
    scrollTrigger: {
      trigger: ".hero-section",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },

    y: 0,
  });

  gsap.to(".hero-dashboard", {
    scrollTrigger: {
      trigger: ".hero-section",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },

    y: -80,
  });

  gsap.to(".hero-content", {
    scrollTrigger: {
      trigger: ".hero-section",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },

    y: -40,
  });
};