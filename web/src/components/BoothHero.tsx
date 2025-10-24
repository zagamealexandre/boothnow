'use client'

import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

export default function BoothHero() {
  const [isMobile, setIsMobile] = useState(false)
  const [tapped, setTapped] = useState(false)
  const nextSectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -200])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.7])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Auto-scroll to next section on mobile after tap
  useEffect(() => {
    if (tapped && nextSectionRef.current) {
      setTimeout(() => {
        nextSectionRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 600) // delay for animation
    }
  }, [tapped])

  // Auto-scroll for desktop after scroll threshold
  useEffect(() => {
    if (!isMobile) {
      const unsubscribe = scrollYProgress.on("change", (v) => {
        if (v > 0.45 && nextSectionRef.current) {
          nextSectionRef.current?.scrollIntoView({ behavior: "smooth" })
        }
      })
      return () => unsubscribe()
    }
  }, [scrollYProgress, isMobile])

  return (
    <>
      <section className="relative h-screen w-full overflow-hidden bg-black flex items-center justify-center">
        {/* Background gradient */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black via-[#111] to-[#222] z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />

        {/* Booth Image Placeholder */}
        <motion.div
          className="relative z-10 w-3/4 md:w-2/5 h-96 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl"
          style={
            !isMobile
              ? { y, scale, opacity }
              : tapped
              ? { transform: "translateY(-200px) scale(0.7)", opacity: 0.8 }
              : {}
          }
          onClick={() => isMobile && setTapped(true)}
        >
          <div className="text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">BoothNow Pod</h2>
            <p className="text-sm opacity-80">Soundproof Workspace</p>
          </div>
        </motion.div>

        {/* Tap / Scroll cue */}
        {!tapped && (
          <div className="absolute bottom-16 text-white text-center z-20 opacity-70 animate-bounce">
            <p className="text-sm md:text-base">
              {isMobile ? "Tap to enter" : "Scroll to explore"}
            </p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 mx-auto mt-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white/10 to-transparent z-0" />
      </section>

      {/* Next section reference */}
      <div ref={nextSectionRef}>
        <section className="bg-white text-black min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Instant Private Workspaces, Anywhere
          </h1>
          <p className="text-lg md:text-xl max-w-xl text-gray-600">
            Step inside a BoothNow pod for calls, focus work, and privacy — available on demand at 7-Eleven and partner stores.
          </p>
        </section>
      </div>
    </>
  )
}
