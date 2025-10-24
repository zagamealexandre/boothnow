"use client";

import { motion, useAnimation, useTransform, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function Hero() {
  const glowControls = useAnimation();
  const bgControls = useAnimation();
  const [entered, setEntered] = useState(false);
  const [calmed, setCalmed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Capture wheel/touch input to drive an internal progress (0..1) for the zoom
  const progress = useMotionValue(0);
  const doorScale = useTransform(progress, [0, 1], [0.6, 3.2]);
  const doorOpacity = useTransform(progress, [0, 1], [1, 0]);

  // Complete intro: calm background, reveal content, and unlock page scroll
  const completeIntro = () => {
    if (calmed) return;
    setCalmed(true);
    bgControls.start({ background: "linear-gradient(180deg, #F5F4F2, #E9E7E3)", transition: { duration: 1.2, ease: "easeInOut" } });
    setTimeout(() => setEntered(true), 200);
    const body = document.body;
    body.style.overflow = "";
    body.style.touchAction = "";
  };

  // Lock scroll and use wheel/touch to advance the intro until finished
  useEffect(() => {
    if (entered) return;

    const body = document.body;
    body.style.overflow = "hidden";
    body.style.touchAction = "none";

    const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

    const onWheel = (e: WheelEvent) => {
      if (entered) return;
      e.preventDefault();
      const next = clamp01(progress.get() + e.deltaY * 0.0012);
      progress.set(next);
      if (next >= 1 && !calmed) completeIntro();
    };

    let startY = 0;
    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      if (entered) return;
      const dy = startY - e.touches[0].clientY; // swipe up → positive
      if (Math.abs(dy) > 0) {
        e.preventDefault();
        const next = clamp01(progress.get() + dy * 0.004);
        progress.set(next);
        if (next >= 1 && !calmed) completeIntro();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    const el = sectionRef.current ?? window;
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", onWheel as any);
      el.removeEventListener("touchstart", onTouchStart as any);
      el.removeEventListener("touchmove", onTouchMove as any);
      body.style.overflow = "";
      body.style.touchAction = "";
    };
  }, [entered, calmed, progress, bgControls]);

  // Chaotic particles background (always on)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const count = 110;
    const particles = Array.from({ length: count }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 1 + Math.random() * 2,
      dx: -0.5 + Math.random() * 1.5,
      dy: -0.5 + Math.random() * 1.5,
      opacity: 0.35 + Math.random() * 0.25,
      blur: Math.random() * 2,
    }));

    let speedFactor = 1;
    let fadeFactor = 1;
    let t = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.02;
      particles.forEach((p, i) => {
        p.x += p.dx * speedFactor; p.y += p.dy * speedFactor;
        if (p.x < -50) p.x = canvas.width + 50; if (p.x > canvas.width + 50) p.x = -50;
        if (p.y < -50) p.y = canvas.height + 50; if (p.y > canvas.height + 50) p.y = -50;
        const flicker = 0.9 + 0.1 * Math.sin(t + i * 0.35);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,190,220,${(p.opacity * fadeFactor) * flicker})`;
        ctx.shadowColor = "rgba(100,160,255,0.15)"; ctx.shadowBlur = p.blur * 3; ctx.fill();
      });
      requestAnimationFrame(animate);
    };
    animate();

    if (calmed) {
      let k = 0; const fade = setInterval(() => { k += 0.02; speedFactor = Math.max(0, 1 - k); fadeFactor = Math.max(0, 1 - k); if (k >= 1) clearInterval(fade); }, 40);
    }

    return () => window.removeEventListener("resize", resize);
  }, [calmed]);

  // Start chaos gradient and icy-blue door glow pulse
  useEffect(() => {
    bgControls.start({
      background: [
        "linear-gradient(135deg, #1C1F2B, #2E3850, #4B638E)",
        "linear-gradient(135deg, #4B638E, #2E3850, #1C1F2B)",
      ],
      transition: { duration: 6, repeat: Infinity, ease: "linear" },
    });
    glowControls.start({
      boxShadow: [
        "0 0 40px rgba(100,160,255,0.40)",
        "0 0 60px rgba(100,160,255,0.25)",
        "0 0 40px rgba(100,160,255,0.40)",
      ],
      transition: { repeat: Infinity, duration: 2.4, ease: "easeInOut" },
    });
  }, [bgControls, glowControls]);

  return (
    <motion.section
      ref={sectionRef as any}
      animate={bgControls}
      className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden text-center"
    >
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {!entered && (
        <motion.div style={{ scale: doorScale, opacity: doorOpacity }} className="z-10">
          <motion.div
            animate={glowControls}
            className="relative w-[100px] h-[180px] bg-[#F8F8F7] border border-[#B1B1B1] rounded-md will-change-transform"
          />
        </motion.div>
      )}

      {entered && (
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.0, ease: "easeOut" }} className="z-10">
          <h1 className="text-5xl font-semibold text-[#1A1A1A]">Step inside focus.</h1>
          <p className="mt-3 text-gray-600">Private, on-demand workspaces where silence meets simplicity.</p>
          <motion.button className="mt-6 bg-[#2E6A9C] hover:bg-[#244E73] text-white text-sm font-medium px-8 py-3 rounded-full shadow-sm" onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}>
            Explore Booths
          </motion.button>
        </motion.div>
      )}

      {!entered && (
        <button onClick={() => { completeIntro(); progress.set(1); }} className="absolute bottom-10 text-sm text-white/80 hover:text-white">
          Skip animation
        </button>
      )}
    </motion.section>
  );
}
