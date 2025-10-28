"use client";

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Hero from '../components/Hero'
import PricingPlans from '../components/PricingPlans'
import FeaturesGrid from '../components/FeaturesGrid'
import AppSection from '../components/AppSection'
import MapSection from '../components/MapSection'
import Footer from '../components/Footer'

const VideoHero = dynamic(() => import('../components/minimal/VideoHero'), { ssr: false })

export default function HomePage() {
  const [showLanding, setShowLanding] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const isMobile = window.innerWidth < 768
    if (isMobile) setShowLanding(true)
  }, [])

  return (
    <>
      {!showLanding && (
        <VideoHero onShowLandingPage={() => setShowLanding(true)} />
      )}
      {showLanding && (
        <>
          <Hero />
          <section id="pricing-anchor" />
          <PricingPlans />
          <FeaturesGrid />
          <AppSection />
          <MapSection />
          <Footer />
        </>
      )}
    </>
  )
}