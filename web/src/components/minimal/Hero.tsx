"use client";

import { motion, useAnimation, useTransform, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function Hero() {
  const glowControls = useAnimation();
  const bgControls = useAnimation();
  const [entered, setEntered] = useState(false);
  const [calmed, setCalmed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const ambientAudioRef = useRef<HTMLAudioElement>(null);
  const whooshAudioRef = useRef<HTMLAudioElement>(null);
  
  // Capture wheel/touch input to drive an internal progress (0..1) for the zoom
  const progress = useMotionValue(0);
  const doorScale = useTransform(progress, [0, 1], [0.6, 3.2]);
  const doorOpacity = useTransform(progress, [0, 1], [1, 0]);

  // Simple audio initialization
  const initializeAudio = () => {
    if (audioStarted || !audioEnabled || calmed || entered) return;
    
    console.log("🎵 Starting audio...");
    setAudioStarted(true);
    
    if (ambientAudioRef.current) {
      ambientAudioRef.current.volume = 0.6;
      ambientAudioRef.current.loop = true;
      ambientAudioRef.current.play().catch(e => {
        console.log("Audio play failed:", e);
        setAudioStarted(false);
      });
    }
  };

  // Fade out ambient sound with smooth transition and muffling effect
  const fadeOutAmbient = () => {
    if (!ambientAudioRef.current) return;
    
    const audio = ambientAudioRef.current;
    const fadeTime = 2.5; // longer fade for smoother transition
    const fadeSteps = 60; // more steps for smoother curve
    const stepTime = (fadeTime * 1000) / fadeSteps;
    const initialVolume = audio.volume;
    
    let currentStep = 0;
    const fadeInterval = setInterval(() => {
      currentStep++;
      // Use exponential fade for smoother transition
      const progress = currentStep / fadeSteps;
      const easedProgress = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      
      // Fade volume
      audio.volume = initialVolume * (1 - easedProgress);
      
      // Add muffling effect by reducing playback rate slightly
      const mufflingEffect = 1 - (easedProgress * 0.3); // slight slowdown for muffling
      audio.playbackRate = Math.max(0.7, mufflingEffect);
      
      if (currentStep >= fadeSteps) {
        clearInterval(fadeInterval);
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0.6; // reset for next time
        audio.playbackRate = 1; // reset playback rate
      }
    }, stepTime);
  };

  // Play whoosh sound
  const playWhoosh = () => {
    if (whooshAudioRef.current) {
      whooshAudioRef.current.volume = 0.3;
      whooshAudioRef.current.play().catch(e => console.log("Whoosh play failed:", e));
    }
  };

  // Complete intro: calm background, reveal content, and unlock page scroll
  const completeIntro = async () => {
    if (calmed) return;
    
    // IMMEDIATELY stop all audio the moment welcome content appears
    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
      ambientAudioRef.current.currentTime = 0;
      ambientAudioRef.current.volume = 0;
      ambientAudioRef.current.playbackRate = 1;
    }
    
    setCalmed(true);
    setIsTransitioning(true);

    // Audio should already be silent from scroll fade, just play whoosh
    setTimeout(() => {
      playWhoosh();
    }, 200); // quick whoosh to mark the transition

    // Start background animation
    bgControls.start({
      opacity: 0.1,
      transition: { duration: 2, ease: "easeOut" }
    });

    // Wait for animations to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsTransitioning(false);
    
    // Completely stop all audio - should already be silent from scroll fade
    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
      ambientAudioRef.current.currentTime = 0;
      ambientAudioRef.current.volume = 0;
      ambientAudioRef.current.playbackRate = 1; // reset playback rate
    }
    if (whooshAudioRef.current) {
      whooshAudioRef.current.pause();
      whooshAudioRef.current.currentTime = 0;
    }
  };

  // Handle scroll/touch to drive progress
  useEffect(() => {
    const handleInteraction = (e: Event) => {
      if (entered || calmed) return;
      
      // Prevent default scroll behavior to keep effect static
      e.preventDefault();
      
      // Start audio on first interaction
      if (!audioStarted && audioEnabled) {
        initializeAudio();
      }
      
      // Calculate progress based on scroll
      const delta = 'deltaY' in e ? (e as WheelEvent).deltaY : 0;
      const currentProgress = progress.get();
      const newProgress = Math.min(1, Math.max(0, currentProgress + delta * 0.001));
      
      progress.set(newProgress);
      
      // Fade audio based on door size (not scroll speed)
      if (ambientAudioRef.current && audioStarted) {
        const audio = ambientAudioRef.current;
        
        // Get current door scale (0.6 to 3.2)
        const currentScale = doorScale.get();
        
        // Calculate volume based on door size
        // When door is small (0.6), volume is high (0.6)
        // When door is big (3.2), volume is low (0)
        const scaleProgress = (currentScale - 0.6) / (3.2 - 0.6); // 0 to 1
        const targetVolume = 0.6 * (1 - scaleProgress);
        
        // Stop audio when door is very large (scale > 2.5)
        if (currentScale > 2.5) {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 0;
          audio.playbackRate = 1;
        } else {
          audio.volume = Math.max(0, targetVolume);
          
          // Add muffling effect as door gets bigger
          const mufflingEffect = 1 - (scaleProgress * 0.4);
          audio.playbackRate = Math.max(0.6, mufflingEffect);
        }
      }
      
      if (newProgress >= 0.95 && !calmed) {
        setEntered(true);
        completeIntro();
      }
    };

    // Lock scroll during door animation, unlock after welcome screen
    if (!entered && !calmed) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.top = '0';
      document.body.style.left = '0';
    } else if (entered && calmed) {
      // Unlock scroll after welcome screen is shown
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
      document.body.style.width = 'auto';
      document.body.style.height = 'auto';
      document.body.style.top = 'auto';
      document.body.style.left = 'auto';
    }

    const section = sectionRef.current;
    if (section) {
      section.addEventListener('wheel', handleInteraction, { passive: false });
      section.addEventListener('touchmove', handleInteraction, { passive: false });
    }

    // Also catch wheel events on the document to prevent page scroll
    const preventPageScroll = (e: Event) => {
      if (!entered && !calmed) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('wheel', preventPageScroll, { passive: false });
    document.addEventListener('touchmove', preventPageScroll, { passive: false });

    return () => {
      if (section) {
        section.removeEventListener('wheel', handleInteraction);
        section.removeEventListener('touchmove', handleInteraction);
      }
      document.removeEventListener('wheel', preventPageScroll);
      document.removeEventListener('touchmove', preventPageScroll);
      // Only restore scroll when component unmounts (user navigates away)
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
      document.body.style.width = 'auto';
      document.body.style.height = 'auto';
      document.body.style.top = 'auto';
      document.body.style.left = 'auto';
    };
  }, [entered, calmed, progress, audioStarted, audioEnabled]);

  // Particles background effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];

    // Create particles - many more during noise side, fewer during quiet side
    const particleCount = entered ? 20 : 1000; // 50x more particles during door animation
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * (entered ? 1 : 3), // Slower movement on quiet side
        vy: (Math.random() - 0.5) * (entered ? 1 : 3),
        size: Math.random() * 3 + 1,
        opacity: entered ? Math.random() * 0.3 + 0.1 : Math.random() * 0.6 + 0.2 // More visible during noise
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Get current door progress for dynamic effects
      const currentProgress = progress.get();
      const currentScale = doorScale.get();
      
      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        // Dynamic opacity based on door progress
        let dynamicOpacity = particle.opacity;
        if (!entered) {
          // During door animation: particles get more subtle as door grows
          dynamicOpacity = particle.opacity * (1 - currentProgress * 0.5);
        }
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${dynamicOpacity})`;
        ctx.fill();
      });
      
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [entered]); // Regenerate particles when entered state changes

  // Glow effect when calmed
  useEffect(() => {
    if (calmed && audioEnabled) {
      glowControls.start({
        boxShadow: "0 0 30px rgba(255, 255, 255, 0.3), 0 0 60px rgba(255, 255, 255, 0.1)",
        transition: { duration: 1 }
      });
    }
  }, [calmed, audioEnabled, glowControls]);

  // Cleanup audio on unmount and ensure silence on welcome screen
  useEffect(() => {
    // Ensure audio is stopped when welcome screen is shown
    if (entered && ambientAudioRef.current) {
      ambientAudioRef.current.pause();
      ambientAudioRef.current.currentTime = 0;
      ambientAudioRef.current.volume = 0;
      ambientAudioRef.current.playbackRate = 1;
    }
    
    return () => {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
      }
      if (whooshAudioRef.current) {
        whooshAudioRef.current.pause();
      }
    };
  }, [entered]);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center overflow-hidden"
      style={{ 
        position: entered ? 'relative' : 'fixed',
        top: entered ? 'auto' : 0,
        left: entered ? 'auto' : 0,
        right: entered ? 'auto' : 0,
        bottom: entered ? 'auto' : 0,
        zIndex: entered ? 1 : 50,
        height: '100vh',
        minHeight: '100vh'
      }}
    >
      {/* Particles background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: calmed ? 0.1 : 0.3 }}
      />

      {/* Audio elements */}
      <audio ref={ambientAudioRef} src="/streetnoise.mp3" preload="auto" />
      <audio ref={whooshAudioRef} src="/noise1.mp3" preload="auto" />

      {/* Main door */}
      <motion.div
        className="relative w-64 h-96 bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg shadow-2xl border border-slate-600"
        style={{
          scale: doorScale,
          opacity: doorOpacity,
        }}
        animate={glowControls}
      >
        {/* Door handle */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-3 h-8 bg-slate-500 rounded-full" />
        
        {/* Door panels */}
        <div className="absolute inset-4 border border-slate-500 rounded" />
        <div className="absolute inset-8 border border-slate-400 rounded" />
      </motion.div>

      {/* Content that appears after door entry */}
      {entered && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-white z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <motion.h1
            className="text-6xl font-bold mb-8 text-center"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Welcome to Your
            <br />
            <span className="text-blue-400">Focus Space</span>
          </motion.h1>
          
          <motion.p
            className="text-xl text-slate-300 mb-12 text-center max-w-2xl"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            Step into a world of calm and concentration. Your personal booth awaits.
          </motion.p>
          
          <motion.button
            onClick={() => {
              // Scroll to main page content
              window.scrollTo(0, window.innerHeight);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Explore Booths
          </motion.button>
        </motion.div>
      )}


      {/* Audio enable button */}
      {!audioEnabled && !entered && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <motion.button
            onClick={() => setAudioEnabled(true)}
            className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-2 rounded-full hover:bg-white/30 transition-colors text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            🔊 Enable Sound
          </motion.button>
        </div>
      )}

      {/* Sound toggle button - only show during door animation */}
      {audioEnabled && !entered && (
        <motion.button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {audioEnabled ? "🔊" : "🔇"}
        </motion.button>
      )}

      {/* Instructions */}
      {!entered && (
        <motion.div
          className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-center text-white/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm">Scroll or swipe to enter</p>
          <p className="text-xs mt-2 text-white/50">Complete the entry to continue</p>
        </motion.div>
      )}
    </section>
  );
}