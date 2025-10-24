"use client";

import { useEffect, useRef, useState } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import Image from 'next/image'

export function DoorHero() {
  const [entered, setEntered] = useState(false)
  const nextRef = useRef<HTMLDivElement>(null)
  const fade = useAnimationControls()

  useEffect(() => {
    const run = async () => {
      await new Promise(r => setTimeout(r, 900))
      // crossfade from closed to open door
      await fade.start({ opacity: [1, 0], transition: { duration: 1.2, ease: 'easeOut' } })
      setEntered(true)
      setTimeout(() => nextRef.current?.scrollIntoView({ behavior: 'smooth' }), 400)
    }
    run()
  }, [fade])

  return (
    <section className="relative h-screen w-full bg-[#ECECEC] overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative aspect-[3/5] w-[min(38vh,360px)]">
          {/* Closed door */}
          <motion.div initial={{ opacity: 1 }} animate={fade} className="absolute inset-0">
            <Image src="/images/booth/closed.jpg" alt="Booth closed" fill priority sizes="(max-width: 768px) 60vw, 360px" className="object-contain" />
          </motion.div>
          {/* Open door */}
          <Image src="/images/booth/open.jpg" alt="Booth open" fill priority sizes="(max-width: 768px) 60vw, 360px" className="object-contain" />
        </div>
      </div>

      {/* Headline */}
      <div className="absolute inset-0 flex items-end justify-center pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: entered ? 1 : 0, y: entered ? 0 : 20 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center"
        >
          <h1 className="text-[clamp(28px,4vw,56px)] font-medium tracking-tight text-[#222]">Step inside focus.</h1>
          <p className="mt-3 text-[clamp(14px,1.6vw,18px)] text-[#222]/80">Private, on-demand workspaces where you already are.</p>
          <a href="#intro" className="mt-6 inline-flex items-center justify-center rounded-full bg-[#3A7BD5] px-6 py-3 text-white text-sm font-medium shadow-sm transition-colors duration-300 hover:bg-[#316bb9]">Explore Booths</a>
        </motion.div>
      </div>

      <div ref={nextRef} id="intro" className="absolute bottom-0"/>
    </section>
  )
}
