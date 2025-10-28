"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Image from 'next/image'
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { ValueProps } from './ValueProps';
import { MapSection } from './MapSection';
import { Pricing } from './Pricing';
import { PrebookPreview } from './PrebookPreview';
import { CalmCta } from './CalmCta';
import { Footer } from '../ui/footer-section';

interface VideoHeroProps {
  onShowLandingPage: () => void;
}

export default function VideoHero({ onShowLandingPage }: VideoHeroProps) {
  const [videoEnded, setVideoEnded] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);


  const handleVideoEnd = () => {
    setVideoEnded(true);
    // Immediately transition to the new landing page
    setShowLandingPage(true);
    onShowLandingPage();
  };

  const handleSkipVideo = () => {
    setVideoEnded(true);
    setShowLandingPage(true);
    onShowLandingPage();
  };


  // Mobile detection and video handling
  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                            window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
      
      // If mobile, skip video and go straight to the landing page
      if (isMobileDevice) {
        setVideoEnded(true);
        setShowLandingPage(true);
        onShowLandingPage();
      }
    };

    checkMobile();
    
    // Listen for resize events to handle orientation changes
    const handleResize = () => {
      checkMobile();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Add additional event listeners and debugging
  useEffect(() => {
    // Skip video setup on mobile
    if (isMobile) return;

    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      // Video time tracking
    };

    const handleEnded = () => {
      handleVideoEnd();
    };

    const handleLoadedMetadata = () => {
      // Video metadata loaded
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Fallback: if video doesn't end after 30 seconds, show welcome screen
    const fallbackTimeout = setTimeout(() => {
      if (!videoEnded && !showWelcome) {
        handleVideoEnd();
      }
    }, 30000);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      clearTimeout(fallbackTimeout);
    };
  }, [videoEnded, showWelcome, isMobile]);

  // If landing page should be shown, don't render anything
  if (showLandingPage) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex flex-col"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh'
      }}
    >
      {/* Navbar - white background to match landing page */}
      <header className="sticky top-0 z-50 bg-white border-b border-kubo-border">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <a href="/" className="inline-flex items-center" aria-label="KUBO Home">
            <Image src="/images/kubologo.svg" alt="KUBO" width={96} height={28} priority />
          </a>
          {/* Navigation removed - only logo shown during video */}
        </nav>
      </header>

      {/* Video Player - only show on desktop */}
      {!isMobile && (
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
          >
            <source src="/video/intro.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Video overlay with skip button */}
          {!videoEnded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Skip button in bottom center */}
              <motion.button
                onClick={handleSkipVideo}
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-full hover:bg-black/70 transition-colors text-lg font-medium"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Skip
              </motion.button>
            </div>
          )}
        </div>
      )}

      {/* Mobile placeholder - show welcome screen background */}
      {isMobile && (
        <div className="flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-4xl font-bold mb-4">
              Welcome to Your
              <br />
              <span className="text-blue-400">Focus Space</span>
            </div>
            <div className="text-lg text-slate-300">
              Step into a world of calm and concentration.
            </div>
          </div>
        </div>
      )}

      {/* We no longer render the internal welcome/landing. We immediately hand off to the main landing page. */}
    </div>
  );
}
