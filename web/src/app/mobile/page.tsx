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
      
      {/* Overlay with Sign In CTA */}
      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-white text-3xl font-bold mb-4">
            Welcome to KUBO
          </h1>
          <p className="text-white/90 text-lg mb-8 max-w-sm">
            Your personal booth for business calls. Convenient. Private. Affordable.
          </p>
          
          <SignedOut>
            <SignInButton mode="modal" afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
              <button className="bg-[#F5BF59] hover:bg-[#F5BF59]/90 text-[#2B3F5F] font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg">
                Sign In to Continue
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
