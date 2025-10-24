"use client";

import { motion } from 'framer-motion'

export function PrebookPreview() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-2">
        <div>
          <h3 className="text-[22px] font-medium text-[#222]">Reserve a booth before you arrive</h3>
          <p className="mt-3 text-[15px] leading-7 text-[#222]/70">Pick a time, location, and length. We’ll hold the space and unlock when you check in.</p>
        </div>
        <div className="flex justify-center">
          <div className="relative h-[520px] w-[260px] overflow-hidden rounded-[32px] border border-[#E6E6E6] bg-[#FAFAFA] shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-0 flex flex-col p-4"
            >
              <div className="mt-2 rounded-xl bg-white p-4 shadow-sm">
                <div className="text-sm font-medium text-[#222]">Select date</div>
                <div className="mt-2 h-20 rounded-lg bg-[#F3F3F3]"/>
              </div>
              <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
                <div className="text-sm font-medium text-[#222]">Choose time</div>
                <div className="mt-2 h-10 rounded-lg bg-[#F3F3F3]"/>
              </div>
              <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
                <div className="text-sm font-medium text-[#222]">Confirm & pay</div>
                <div className="mt-2 h-12 rounded-lg bg-[#3A7BD5]/10"/>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
