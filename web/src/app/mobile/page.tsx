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
      <div className="absolute inset-0 flex flex-col items-center justify-between py-12 px-6">
        {/* Logo at top */}
        <div className="mt-8">
          <Image
            src="/images/kubologofooter.svg"
            alt="KUBO"
            width={120}
            height={40}
            className="mx-auto"
          />
        </div>

        {/* Center content */}
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4 tracking-wider">
            WELCOME TO KUBO
          </h1>
          <p className="text-2xl font-medium tracking-wider">
            YOUR FOCUS SPACE
          </p>
        </div>

        {/* CTA at bottom */}
        <div className="mb-8">
          <SignedOut>
            <SignInButton mode="modal" afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
              <button className="bg-[#F5BF59] hover:bg-[#F5BF59]/90 text-[#2B3F5F] font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg">
                Sign in to continue
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <a 
              href="/dashboard" 
              className="bg-[#F5BF59] hover:bg-[#F5BF59]/90 text-[#2B3F5F] font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg inline-block"
            >
              Go to Dashboard
            </a>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}
