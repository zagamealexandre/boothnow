"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';

export default function MobileLandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Image */}
      <Image
        src="/images/landingmobile.png"
        alt="KUBO Mobile App"
        fill
        className="object-cover"
        priority
      />
      
      {/* Overlay with Logo, Text, and CTA */}
      <div className="absolute inset-0 flex flex-col h-screen">
        {/* Logo at top */}
        <div className="pt-6 pb-4">
          <Image
            src="/images/kubologofooter.svg"
            alt="KUBO"
            width={120}
            height={40}
            className="mx-auto"
          />
        </div>

        {/* Subtitle under logo */}
        <div className="text-center text-white pb-4">
          <h2 className="text-xl font-medium tracking-wider" style={{ fontFamily: "var(--font-heading), system-ui, sans-serif" }}>
            YOUR FOCUS SPACE
          </h2>
        </div>

        {/* Center content - Welcome text */}
        <div className="flex-1 flex items-center justify-center text-center text-white">
          <h1 className="text-4xl font-bold tracking-wider">
            WELCOME TO KUBO
          </h1>
        </div>

        {/* CTA at bottom - always visible */}
        <div className="pb-6 px-6">
          <SignedOut>
            <SignInButton mode="modal" afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
              <button className="w-full bg-[#F5BF59] hover:bg-[#F5BF59]/90 text-[#2B3F5F] font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg">
                Sign in to continue
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <a 
              href="/dashboard" 
              className="w-full bg-[#F5BF59] hover:bg-[#F5BF59]/90 text-[#2B3F5F] font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg inline-block text-center"
            >
              Go to Dashboard
            </a>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}
