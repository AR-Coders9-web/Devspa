import React, { useEffect, useRef } from "react";

const POINTS = 22;

const TEXT_SELECTOR = [
  "input:not([type='button']):not([type='submit']):not([type='checkbox']):not([type='radio'])",
  "textarea",
  "[contenteditable='true']",
  ".cm-content",
  ".monaco-editor",
  ".monaco-editor textarea",
  ".ace_text-input",
  "[data-cursor='text']",
].join(", ");

const INTERACTIVE_SELECTOR = [
  "button",
  "a",
  "[role='button']",
  "summary",
  "[data-cursor='interactive']",
  "input[type='button']",
  "input[type='submit']",
  "input[type='checkbox']",
  "input[type='radio']",
  "select",
].join(", ");

export default function DragonCursor() {
  const rootRef = useRef(null);
  const pointsRef = useRef(
    Array.from({ length: POINTS }, () => ({ x: -100, y: -100 }))
  );
  const targetRef = useRef({ x: -100, y: -100 });
  const rafRef = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const body = document.body;
    body.classList.add("dragon-cursor-enabled");

    const clearModes = () => {
      body.classList.remove(
        "dragon-cursor-text-mode",
        "dragon-cursor-pointer-mode"
      );

      root.classList.remove(
        "dragon-cursor--text",
        "dragon-cursor--interactive"
      );
    };

    const move = (event) => {
      targetRef.current.x = event.clientX;
      targetRef.current.y = event.clientY;
      root.classList.add("dragon-cursor--visible");

      const target = event.target;
      const textTarget = target?.closest?.(TEXT_SELECTOR);
      const interactiveTarget = target?.closest?.(INTERACTIVE_SELECTOR);

      const textMode = Boolean(textTarget);
      const pointerMode = !textMode && Boolean(interactiveTarget);

      body.classList.toggle("dragon-cursor-text-mode", textMode);
      body.classList.toggle("dragon-cursor-pointer-mode", pointerMode);

      root.classList.toggle("dragon-cursor--text", textMode);
      root.classList.toggle("dragon-cursor--interactive", pointerMode);
    };

    const leave = () => {
      root.classList.remove("dragon-cursor--visible");
      clearModes();
    };

    const down = () => root.classList.add("dragon-cursor--click");
    const up = () => root.classList.remove("dragon-cursor--click");

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);

    const tick = () => {
      const points = pointsRef.current;
      const target = targetRef.current;

      points[0].x += (target.x - points[0].x) * 0.34;
      points[0].y += (target.y - points[0].y) * 0.34;

      for (let i = 1; i < points.length; i += 1) {
        const ease = Math.max(0.08, 0.23 - i * 0.006);
        points[i].x += (points[i - 1].x - points[i].x) * ease;
        points[i].y += (points[i - 1].y - points[i].y) * ease;
      }

      const nodes = root.children;

      points.forEach((point, index) => {
        const node = nodes[index];
        if (!node) return;

        const scale = 1 - index / (POINTS * 1.35);
        const angle = Math.sin(index * 0.72) * 10;

        node.style.transform =
          `translate3d(${point.x}px, ${point.y}px, 0) ` +
          `scale(${scale}) rotate(${angle}deg)`;

        node.style.opacity = String(
          Math.max(0, 0.88 - index / (POINTS * 1.12))
        );
      });

      const spark = nodes[POINTS];
      if (spark) {
        spark.style.left = `${points[0].x}px`;
        spark.style.top = `${points[0].y}px`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      body.classList.remove(
        "dragon-cursor-enabled",
        "dragon-cursor-text-mode",
        "dragon-cursor-pointer-mode"
      );

      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("mouseleave", leave);

      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="dragon-cursor dragon-cursor--universal"
      aria-hidden="true"
    >
      {Array.from({ length: POINTS }).map((_, index) => (
        <span key={index} className="dragon-cursor__segment" />
      ))}

      <span className="dragon-cursor__spark" />
    </div>
  );
}