"use client";

import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import Hero from '../components/minimal/Hero'
import { ValueProps } from '../components/minimal/ValueProps'
import { MapSection } from '../components/minimal/MapSection'
import { Pricing } from '../components/minimal/Pricing'
import { PrebookPreview } from '../components/minimal/PrebookPreview'
import { CalmCta } from '../components/minimal/CalmCta'
import { MinimalFooter } from '../components/minimal/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F3F3F3] text-[#222]">
      {/* Minimal header */}
      <header className="sticky top-0 z-50 border-b border-[#E6E6E6] bg-[#FAFAFA]/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="text-[18px] font-medium">BoothNow</div>
          <div className="flex items-center gap-6 text-sm">
            <a href="#map" className="hover:underline">Map</a>
            <a href="#pricing" className="hover:underline">Pricing</a>
            <SignedOut>
              <SignInButton mode="modal" afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
                <button className="rounded-full border border-[#E2E2E2] px-4 py-2 hover:bg-white">Sign in</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <a href="/dashboard" className="rounded-full border border-[#E2E2E2] px-4 py-2 hover:bg-white">Dashboard</a>
            </SignedIn>
          </div>
        </nav>
      </header>

      <main>
        <Hero />
        <ValueProps />
        <div id="map"><MapSection /></div>
        <div id="pricing"><Pricing /></div>
        <PrebookPreview />
        <CalmCta />
      </main>

      <MinimalFooter />
    </div>
  )
}