"use client";

import { Check } from 'lucide-react'

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full" style={{ backgroundColor: '#196F4B' }}>
        <Check className="h-3 w-3 text-white" />
      </span>
      <span className="text-kubo-textGrey text-sm font-body">{children}</span>
    </li>
  )
}

export default function PricingPlans() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="font-heading text-3xl tracking-[0.18em] text-kubo-textDark">CHOOSE YOUR PLAN</h2>
        <p className="mt-4 text-kubo-textGrey font-body">Flexible options for private on-demand work booths.</p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pay as you go */}
          <div className="bg-white border border-kubo-border rounded-2xl p-8 text-left hover:shadow-lg transition-shadow">
            <h3 className="font-heading text-lg tracking-[0.16em] text-kubo-textDark">PAY AS YOU GO</h3>
            <div className="mt-3 text-2xl font-medium text-kubo-textDark">Euro 0.50/min</div>
            <p className="mt-2 text-kubo-textGrey text-sm font-body">Only pay for what you use</p>
            <ul className="mt-6 space-y-3">
              <Bullet>Start and stop anytime</Bullet>
              <Bullet>No subscription required</Bullet>
              <Bullet>Access all locations</Bullet>
              <Bullet>Billed by the minute</Bullet>
            </ul>
            <div className="mt-8">
              <button className="btn-outline-dark w-full hover:bg-kubo-primary hover:text-white transition-colors">Choose plan</button>
            </div>
          </div>

          {/* Monthly - highlighted */}
          <div className="bg-white border-2 border-kubo-primary rounded-2xl p-8 text-left shadow-lg relative">
            <h3 className="font-heading text-lg tracking-[0.16em] text-kubo-textDark">MONTHLY</h3>
            <div className="mt-3 text-2xl font-medium text-kubo-textDark">Euro 29/month</div>
            <p className="mt-2 text-kubo-textGrey text-sm font-body">Minutes and lower rates included</p>
            <ul className="mt-6 space-y-3">
              <Bullet>Unlimited access</Bullet>
              <Bullet>Up to 90 min per session</Bullet>
              <Bullet>Lower minute rate</Bullet>
              <Bullet>Customer support</Bullet>
            </ul>
            <div className="mt-8">
              <button className="btn-gold w-full">Choose plan</button>
            </div>
          </div>

          {/* Pre-book */}
          <div className="bg-white border border-kubo-border rounded-2xl p-8 text-left hover:shadow-lg transition-shadow">
            <h3 className="font-heading text-lg tracking-[0.16em] text-kubo-textDark">PRE-BOOK</h3>
            <div className="mt-3 text-2xl font-medium text-kubo-textDark">From Euro 4/slot</div>
            <p className="mt-2 text-kubo-textGrey text-sm font-body">Only pay for what you use</p>
            <ul className="mt-6 space-y-3">
              <Bullet>Book specific time slots</Bullet>
              <Bullet>Priority access at busy hours</Bullet>
              <Bullet>Auto reminders</Bullet>
              <Bullet>Cancel anytime</Bullet>
            </ul>
            <div className="mt-8">
              <button className="btn-outline-dark w-full hover:bg-kubo-primary hover:text-white transition-colors">Choose plan</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


