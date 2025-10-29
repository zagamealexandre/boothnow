"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import Tilt from 'react-parallax-tilt';

export default function MobileLandingPage() {
  const [mounted, setMounted] = useState(false);
  const [motionGranted, setMotionGranted] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if motion permission is needed (iOS Safari)
    if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      // iOS Safari - check if already granted
      setShowPermissionPrompt(true);
    } else {
      // Android / desktop – no permission needed
      setMotionGranted(true);
    }
  }, []);

  const requestMotionPermission = async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission === 'granted') {
          setMotionGranted(true);
          setShowPermissionPrompt(false);
        }
      } catch (error) {
        console.warn('Motion permission denied:', error);
        setShowPermissionPrompt(false);
      }
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      {/* Background Image */}
      <Image
        src="/images/landingmobile.png"
        alt="KUBO Mobile App"
        fill
        className="object-cover"
        priority
      />
      
      {/* Depth gradient overlay */}
      <div className="absolute -z-10 bg-gradient-to-b from-[#F5BF59]/20 to-transparent w-full h-full blur-2xl" />
      
      {/* Overlay with Logo, Text, and CTA */}
      <div className="absolute inset-0 flex flex-col h-dvh z-10">
        {/* Logo at top with Tilt effect */}
        <div className="pt-4 pb-2">
          <Tilt
            tiltMaxAngleX={8}
            tiltMaxAngleY={8}
            perspective={1000}
            transitionSpeed={1000}
            gyroscope={motionGranted}
            scale={1.02}
            className="w-[100px] mx-auto"
          >
            <Image
              src="/images/kubologofooter.svg"
              alt="KUBO"
              width={100}
              height={32}
              className="mx-auto"
            />
          </Tilt>
        </div>

        {/* Subtitle under logo with Tilt effect */}
        <div className="text-center text-white pb-2">
          <Tilt
            tiltMaxAngleX={6}
            tiltMaxAngleY={6}
            perspective={1200}
            transitionSpeed={1200}
            gyroscope={motionGranted}
            scale={1.01}
            className="inline-block"
          >
            <h2 className="text-lg font-medium tracking-wider" style={{ fontFamily: "var(--font-heading), system-ui, sans-serif" }}>
              YOUR FOCUS SPACE
            </h2>
          </Tilt>
        </div>

        {/* Center content - Welcome text with Tilt effect */}
        <div className="flex-1 flex items-center justify-center text-center text-white px-4">
          <Tilt
            tiltMaxAngleX={10}
            tiltMaxAngleY={10}
            perspective={800}
            transitionSpeed={800}
            gyroscope={motionGranted}
            scale={1.05}
            className="inline-block"
          >
            <h1 className="text-3xl font-bold tracking-wider">
              WELCOME TO KUBO
            </h1>
          </Tilt>
        </div>

        {/* CTA at bottom with Tilt effect */}
        <div className="pb-4 px-6">
          <Tilt
            tiltMaxAngleX={5}
            tiltMaxAngleY={5}
            perspective={1000}
            transitionSpeed={1000}
            gyroscope={motionGranted}
            scale={1.02}
            className="w-full"
          >
            <SignedOut>
              <SignInButton mode="modal" afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
                <button className="w-full bg-[#F5BF59] hover:bg-[#F5BF59]/90 text-[#2B3F5F] font-semibold px-6 py-3 rounded-xl text-base transition-colors shadow-lg">
                  Sign in to continue
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <a 
                href="/dashboard" 
                className="w-full bg-[#F5BF59] hover:bg-[#F5BF59]/90 text-[#2B3F5F] font-semibold px-6 py-3 rounded-xl text-base transition-colors shadow-lg inline-block text-center"
              >
                Go to Dashboard
              </a>
            </SignedIn>
          </Tilt>
        </div>
      </div>

      {/* Motion Permission Prompt for iOS */}
      {showPermissionPrompt && !motionGranted && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={requestMotionPermission}
            className="bg-black/80 backdrop-blur-sm text-white text-sm px-6 py-3 rounded-full shadow-lg hover:bg-black/90 transition-colors flex items-center gap-2"
          >
            <span>📱</span>
            <span>Tilt your phone to explore the scene</span>
          </button>
        </div>
      )}
    </div>
  );
}
