"use client";

import { motion } from 'framer-motion'
import { Clock, MapPin, CreditCard, Unlock } from 'lucide-react'

export function ValueProps() {
  const features = [
    {
      icon: <Unlock className="w-[22px] h-[22px] text-[#2E6A9C]" />,
      title: 'No setup',
      text: 'Just walk in, tap, and start your session.',
    },
    {
      icon: <Clock className="w-[22px] h-[22px] text-[#2E6A9C]" />,
      title: 'Fair minutes',
      text: 'Pay only for the time you use.',
    },
    {
      icon: <MapPin className="w-[22px] h-[22px] text-[#2E6A9C]" />,
      title: 'Right where you are',
      text: 'Find booths in stations, cafés, and stores.',
    },
    {
      icon: <CreditCard className="w-[22px] h-[22px] text-[#2E6A9C]" />,
      title: 'Simple plans',
      text: 'Top up or subscribe anytime.',
    },
  ]

  return (
    <section className="bg-[#F9F9F8] py-20">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        >
          {features.map((f, i) => (
            <div
              key={i}
              className="flex h-full flex-col items-center justify-center rounded-xl border border-[#E0E0E0] bg-white p-6 text-left shadow-sm"
            >
              {f.icon}
              <h3 className="mt-4 text-lg font-medium text-[#1A1A1A]">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600 text-center">{f.text}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
