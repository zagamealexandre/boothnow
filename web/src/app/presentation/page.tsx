/* 
KUBO Presentation Route
URL: /presentation
Purpose: investor style one-pager with slide sections, sticky nav, and mobile layout
Design: uses KUBO palette and fonts, smooth scroll, keyboard arrows for section hopping
*/

import Image from "next/image";
import type { Metadata } from "next";
import ClientPresentationUX from "./ClientPresentationUX";
import { Navbar } from "@/components/ui/mini-navbar";
import ImageGallery from "@/components/ui/image-gallery";
import InteractiveBentoGallery from "@/components/ui/interactive-bento-gallery";

// --- Page metadata
export const metadata: Metadata = {
  title: "KUBO — Presentation",
  description:
    "Problem, solution, product, business model, market, roadmap, and creative direction for KUBO.",
};

// --- Fonts: Aboreto for display, Reddit Sans for UI
// Add these in app/layout.tsx <head> if not present:
// <link href="https://fonts.googleapis.com/css2?family=Aboreto&family=Reddit+Sans:opsz,wght@8..20,400;8..20,600&display=swap" rel="stylesheet" />

// --- KUBO palette
const K = {
  gold: "#F5BF59",
  navy: "#2B3F5F",
  ink: "#151515",
  gray: "#656565",
  frame: "#D5D5D5",
  green: "#196F4B",
};

// --- Shared components
function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="min-h-full snap-start scroll-mt-24 px-5 md:px-8 lg:px-12 py-12 md:py-16 flex items-center"
    >
      <div className="w-full max-w-6xl mx-auto">
        <h2
          className="font-display text-3xl md:text-4xl lg:text-[40px] leading-tight"
          style={{ color: K.ink }}
        >
          {title}
        </h2>
        <div className="mt-6 md:mt-8 text-[17px] md:text-[18px] leading-7 text-neutral-700">
          {children}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, isBlue = false }: { label: string; value: string; isBlue?: boolean }) {
  return (
    <div 
      className={`rounded-2xl border p-4 relative transition-all duration-300 hover:scale-105 hover:shadow-xl group h-full flex flex-col justify-center ${isBlue ? 'border-transparent' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}
      style={isBlue ? { backgroundColor: K.navy } : {}}
    >
      <div className={`text-xs font-medium tracking-wide uppercase ${isBlue ? 'text-white/80' : 'text-neutral-500'}`}>{label}</div>
      <div
        className="mt-1 text-xl md:text-2xl font-bold transition-colors duration-300"
        style={{ 
          color: isBlue ? 'white' : K.ink, 
          fontFamily: "Inter, system-ui, sans-serif" 
        }}
      >
        {value}
      </div>
      <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-px h-6 hidden md:block transition-opacity duration-300 group-hover:opacity-50 ${isBlue ? 'bg-white/30' : 'bg-neutral-200'}`}></div>
      
      {/* Subtle hover effect */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${isBlue ? 'bg-white' : 'bg-neutral-900'}`}></div>
    </div>
  );
}

// --- Quotes data
const QUOTES = [
  {
    text:
      "It's rude to others, but personally, irrespective of that, it's very loud in coffee shops and is unprofessional to the person you are calling.",
    source:
      "Reddit thread on calls in cafés",
    insight:
      "Background noise makes people uncomfortable, call quality feels unprofessional.",
    relevance:
      "Validates the need for quiet, portable access to privacy.",
  },
  {
    text:
      "We need to bring back telephone booths so people have a soundproof place to take their calls.",
    source: "r/sanfrancisco, coffee shop etiquette",
    insight: "Users ask for phone booths by name.",
    relevance: "Direct language that matches KUBO's concept.",
  },
  {
    text:
      "I work from home and sometimes it helps me to get out to a place like a coffee shop for a change of environment, get some focus time in. However, my job requires random five to ten minute meetings at unspecified times.",
    source: "r/askportland, quiet rooms in cafés",
    insight:
      "Flexible, short sessions are common, quiet space still required.",
    relevance:
      "Supports on-demand booths with quick unlock and fair billing.",
  },
  {
    text:
      "I am traveling, I will be presenting during this call. Any recommendation for a cafe that has call rooms or just quiet cafes in general. I don't want to buy a day pass at a coworking space for over thirty dollars.",
    source: "r/AskLosAngeles",
    insight: "Coworking day passes feel expensive for short calls.",
    relevance:
      "KUBO fills the price and time gap with minutes and slots.",
  },
];

// --- Simple sticky navigation
const NAV = [
  { id: "cover", label: "Cover" },
  { id: "problem", label: "Problem" },
  { id: "solution", label: "Solution" },
  { id: "product", label: "Product" },
  { id: "market", label: "Market" },
  { id: "model", label: "Business model" },
  { id: "gtm", label: "GTM" },
  { id: "competition", label: "Competition" },
  { id: "roadmap", label: "Roadmap" },
  { id: "financials", label: "Financials" },
  { id: "creative", label: "Creative direction" },
  { id: "quotes", label: "Quotes" },
];

export default function PresentationPage() {
  return (
    <div className="font-sans">
      <ClientPresentationUX />
      
      {/* New mini navbar */}
      <div id="navbar-container">
        <Navbar 
          sections={NAV.map(n => ({ id: n.id, label: n.label, href: `#${n.id}` }))}
          activeSection=""
        />
      </div>

      {/* Slides scroll container (viewport minus 56px sticky nav) */}
      <div id="slides" className="h-[calc(100svh-56px)] overflow-y-scroll snap-y snap-mandatory">
        {/* Cover */}
        <section
          id="cover"
          className="h-[calc(100svh-56px)] snap-start relative overflow-hidden flex items-center justify-center"
          style={{
            background:
              "radial-gradient(1400px 700px at 15% -15%, rgba(43,63,95,.15), transparent), radial-gradient(1200px 600px at 85% 115%, rgba(245,191,89,.18), transparent), linear-gradient(135deg, rgba(0,0,0,.03) 0%, rgba(0,0,0,.08) 100%)",
          }}
        >
          <div className="relative z-10 w-full max-w-5xl mx-auto px-6 md:px-8 lg:px-12 text-center">
            <h1 className="sr-only">KUBO — instant quiet, right where you are</h1>
            
            {/* Logo with enhanced styling */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative group">
                <Image
                  src="/images/kubologo.svg"
                  alt="KUBO"
                  width={240}
                  height={72}
                  priority
                  className="transition-all duration-500 group-hover:scale-105"
                />
                <div className="absolute -inset-4 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" style={{ backgroundColor: K.gold }}></div>
              </div>
            </div>

            {/* Enhanced typography hierarchy */}
            <div className="space-y-6 mb-16">
              <h2 className="text-[32px] md:text-[48px] lg:text-[56px] font-display leading-tight tracking-tight" style={{ fontFamily: "Aboreto, serif", color: K.ink }}>
                <span className="block">instant quiet,</span>
                <span className="block mt-2" style={{ color: K.ink }}>right where you are</span>
              </h2>
              
              <div className="max-w-2xl mx-auto">
                <p className="text-[18px] md:text-[22px] text-neutral-600 font-medium leading-relaxed">
                  Because finding focus should be as easy as finding coffee.
                </p>
              </div>
            </div>

            {/* Enhanced stats with better visual flow */}
            <div className="flex justify-center">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl">
                <div className="group h-24">
                  <Stat label="Pilot city" value="Stockholm" isBlue={true} />
                </div>
                <div className="group h-24">
                  <Stat label="Locations" value="7-Eleven network" />
                </div>
                <div className="group h-24">
                  <Stat label="Booths in pilot" value="10" isBlue={true} />
                </div>
                <div className="group h-24">
                  <Stat label="Price" value="€0.50 per minute" />
                </div>
              </div>
            </div>

            {/* Subtle call-to-action hint */}
            <div className="text-center mt-12">
              <div className="inline-flex items-center space-x-2 text-sm text-neutral-500">
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: K.gold }}></div>
                <span>Scroll to explore</span>
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: K.gold, animationDelay: '0.5s' }}></div>
              </div>
            </div>
          </div>
        </section>

        <Section id="problem" title="Problem">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-transparent p-5" style={{ backgroundColor: K.navy }}>
            <h3 className="font-semibold mb-2 text-white">Key pain points</h3>
            <ul className="space-y-3 list-disc pl-5 text-white/90">
              <li>Cafés are noisy, calls feel unprofessional.</li>
              <li>Coworking day passes feel overpriced for ten minute needs.</li>
              <li>Home is not always possible during the day.</li>
              <li>People want short, flexible access to quiet space near them.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-neutral-200 p-5">
            <h3 className="font-semibold mb-2">Who feels it</h3>
            <p>
              Remote professionals, freelancers, travelers, students, creators,
              support agents; anyone who needs five to thirty minutes of calm.
            </p>
          </div>
        </div>
        </Section>

        <Section id="solution" title="Solution">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p>
              KUBO installs single seat phone booths in partner stores and
              stations; users unlock with the app; pay by the minute or choose
              a plan; soundproof space in seconds.
            </p>
            <ul className="mt-4 space-y-2 list-disc pl-5">
              <li>On demand, fair billing, instant unlock.</li>
              <li>Pre book short slots for certainty at peak times.</li>
              <li>Monthly plan for regular users with lower rates.</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Unlock time" value="under 5 sec" isBlue={true} />
            <Stat label="Noise drop" value="up to 30 dB" />
            <Stat label="Set up" value="in store" isBlue={true} />
            <Stat label="Host share" value="15 percent" />
          </div>
        </div>
        </Section>

        <Section id="product" title="Product">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="rounded-2xl border border-neutral-200 overflow-hidden">
            <ImageGallery />
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold" style={{ color: K.navy }}>Core experience</h3>
              <ul className="mt-3 space-y-2 list-disc pl-5 text-sm text-neutral-700">
                <li>Map interface: shows nearby booths with real-time availability and filters (e.g., "quiet", "occupied", "pre-booked").</li>
                <li>Instant access: tap to unlock; timer starts automatically; transparent pricing visible before start.</li>
                <li>Pre-booking: reserve slots in advance, with reminders and integrated receipts for expense reporting.</li>
                <li>Business-ready: automatic receipts for reimbursements; usage history and analytics for frequent users.</li>
              </ul>
              <p className="mt-3 text-sm" style={{ color: K.green }}>
                Rewards and loyalty program launching next — built around 7-Eleven purchases and usage minutes.
              </p>
            </div>
            
          </div>
        </div>
        </Section>

        <Section id="market" title="Market">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-transparent p-5" style={{ backgroundColor: K.navy }}>
            <h3 className="font-semibold text-white">Target users</h3>
            <p className="text-white/90">
              Mobile professionals in Nordic capitals first, then other
              European cities with dense convenience footprints.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 p-5">
            <h3 className="font-semibold">Why now</h3>
            <p>
              Hybrid work is normal, ad hoc calls are frequent, cities already
              have host networks like 7-Eleven with long hours.
            </p>
          </div>
        </div>
        </Section>

        <Section id="model" title="Business model">
        <div className="grid md:grid-cols-3 gap-6 text-left">
          {[
            {
              title: "Revenue streams",
              items: [
                "Pay-as-you-go: €0.50/min",
                "Pre-book: €4/slot",
                "Monthly: €29/month lower rate",
                "Corporate plans: team credits",
                "Host share: 15% per booking",
              ],
              isBlue: true,
            },
            {
              title: "Cost structure",
              items: [
                "Booth lease: €174/month incl. assembly",
                "Maintenance: daily clean & service",
                "Connectivity: WiFi or 4G (~€25/month)",
                "Platform & admin: booking, payments",
              ],
            },
            {
              title: "Scalability",
              items: [
                "No real estate ownership",
                "Fixed cost per booth, high margin",
                "Expandable via retail partnerships",
                "Future revenue: ads, data, integrations",
              ],
            },
          ].map((col, i) => (
            <div
              key={i}
              className={`border rounded-xl p-6 shadow-sm hover:shadow-md transition ${col.isBlue ? 'border-transparent' : 'border-gray-200'}`}
              style={col.isBlue ? { backgroundColor: K.navy } : {}}
            >
              <h3 className="font-semibold" style={{ color: col.isBlue ? 'white' : K.navy }}>{col.title}</h3>
              <ul className={`list-disc list-inside text-sm space-y-1 ${col.isBlue ? 'text-white/90' : 'text-gray-700'}`}>
                {col.items.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
        </Section>

        <Section id="gtm" title="Go to market">
        <div className="grid md:grid-cols-3 gap-6 text-left">
          {[
            {
              title: "Phase 1 – Pilot activation",
              items: [
                "Launch in 7-Eleven stores near transit, offices, and universities.",
                "In-store signage with QR unlock and short URL for instant booking.",
                "Placement in Google Maps & Apple Maps listings (\"Work booths near me\").",
                "Early users recruited via 7-Eleven receipts and social channels.",
              ],
              goal: "Prove adoption through proximity marketing and organic walk-ins.",
              isBlue: true,
            },
            {
              title: "Phase 2 – Growth loops",
              items: [
                "Partner promotions: bundle ‘Morning coffee + 15 minutes booth time’.",
                "Corporate credits for field teams and consultants.",
                "Referral & rewards program to earn free minutes or perks.",
                "Press & social proof narrative: The return of the phone booth.",
              ],
              goal: "Drive repeat usage and brand recognition as an everyday habit.",
            },
            {
              title: "Phase 3 – Expansion",
              items: [
                "Extend to train stations, airports, and retail lobbies.",
                "Offer API access for booking via third‑party apps.",
                "Enable corporate dashboards for credit management and analytics.",
              ],
              goal: "Build network density and recurring B2B revenue.",
            },
          ].map((phase, i) => (
            <div 
              key={i} 
              className={`border rounded-xl p-6 shadow-sm hover:shadow-md transition flex flex-col h-full ${phase.isBlue ? 'border-transparent' : 'border-gray-200'}`}
              style={phase.isBlue ? { backgroundColor: K.navy } : {}}
            >
              <h3 className="font-semibold" style={{ color: phase.isBlue ? 'white' : K.navy }}>{phase.title}</h3>
              <ul className={`list-disc list-inside text-sm space-y-1 mb-3 flex-grow ${phase.isBlue ? 'text-white/90' : 'text-gray-700'}`}>
                {phase.items.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
              <p className={`text-sm mt-auto ${phase.isBlue ? 'text-yellow-300' : ''}`} style={{ color: phase.isBlue ? '' : K.green }}>{phase.goal}</p>
            </div>
          ))}
        </div>
        </Section>

        <Section id="competition" title="Competition">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-neutral-200 p-6 bg-white">
              <h4 className="font-semibold" style={{ color: K.navy }}>Existing alternatives</h4>
              <ul className="list-disc list-inside mt-3 space-y-2 text-sm text-neutral-700">
                <li>Coworking day passes (WeWork, Convendum, Spaces): €25–€40/day, requires planning, not flexible for 15–30 min use.</li>
                <li>Quiet cafés: No privacy, inconsistent sound levels, socially awkward for calls.</li>
                <li>Library rooms: Limited access, limited locations, closed on Sundays, not suited for professionals on the go.</li>
                <li>Airport/Station pods (Sleepbox, GoSleep): High cost, limited availability, built for travel not daily urban use.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-transparent p-6" style={{ backgroundColor: K.navy }}>
              <h4 className="font-semibold text-white">KUBO advantage</h4>
              <ul className="list-disc list-inside mt-3 space-y-2 text-sm text-white/90">
                <li>Proximity: Located inside existing city venues (7-Eleven, transport hubs).</li>
                <li>Speed: Tap, unlock, and start in seconds — no receptionist or check-in.</li>
                <li>Pricing: Pay only for minutes or short slots — the first truly micro workspace model.</li>
                <li>Accessibility: Always open, always available, embedded in people's daily routes.</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm" style={{ color: K.green }}>
            KUBO occupies the whitespace between coworking and coffee shops — the urban “micro-office” for short, spontaneous focus sessions.
          </p>
          <div className="mt-6 rounded-2xl border border-neutral-200 p-6 bg-white overflow-x-auto">
            <table className="w-full text-sm md:text-base table-fixed">
              <thead>
                <tr>
                  <th className="w-40 md:w-48"></th>
                  <th className="p-3 text-center font-medium text-neutral-600">Affordable</th>
                  <th className="p-3 text-center font-medium text-neutral-600">Expensive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr>
                  <td className="p-3 font-medium text-neutral-700 whitespace-nowrap">Instant access</td>
                  <td className="p-3 text-center">☑ KUBO (on-demand micro booths)</td>
                  <td className="p-3 text-center">Airport pods (high cost, limited use)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-neutral-700 whitespace-nowrap">Planned use</td>
                  <td className="p-3 text-center">Quiet cafés, library rooms</td>
                  <td className="p-3 text-center">Coworking spaces, day offices</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="roadmap" title="Roadmap">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Phase 1 – Pilot & Proof of Concept",
                time: "0–6 months",
                items: [
                  "Deploy 10 booths in central Stockholm 7-Eleven locations",
                  "Enable live availability, payments, and digital receipts",
                  "Integrate booking dashboard and usage analytics",
                  "Validate demand and unit economics",
                ],
                goal: "Prove technical reliability and operational viability.",
                isBlue: true,
              },
              {
                title: "Phase 2 – Product Expansion",
                time: "6–12 months",
                items: [
                  "Increase rewards and loyalty system",
                  "Add wallet and corporate credits",
                  "Integrate heat map and dynamic pricing",
                  "Optimize cleaning and service automation",
                ],
                goal: "Double daily bookings and onboard first B2B clients.",
              },
              {
                title: "Phase 3 – Scale & Distribution",
                time: "12–24 months",
                items: [
                  "Expand to 100 booths across major EU capitals",
                  "Launch partner API and Kubo Bundles",
                  "Test franchise or operator model",
                ],
                goal: "Prove scalability and maintain 60% margin.",
              },
            ].map((phase, i) => (
              <div
                key={i}
                className={`rounded-xl border p-6 text-left shadow-sm hover:shadow-md transition flex flex-col h-full ${phase.isBlue ? 'border-transparent' : 'border-gray-200'}`}
                style={phase.isBlue ? { backgroundColor: K.navy } : {}}
              >
                <h3 className="font-semibold" style={{ color: phase.isBlue ? 'white' : K.navy }}>{phase.title}</h3>
                <p className={`text-sm mb-3 ${phase.isBlue ? 'text-white/80' : 'text-gray-500'}`}>{phase.time}</p>
                <ul className={`list-disc list-inside text-sm mb-4 space-y-1 flex-grow ${phase.isBlue ? 'text-white/90' : 'text-gray-700'}`}>
                  {phase.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
                <p className={`text-sm mt-auto ${phase.isBlue ? 'text-yellow-300' : ''}`} style={{ color: phase.isBlue ? '' : K.green }}>{phase.goal}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="financials" title="Financials">
          <div className="rounded-2xl border border-neutral-200 p-6">
            <p>
              Pilot model: ten booths, five hours average use per day, fifteen percent host share.
              Monthly EBITDA around €28,750 including internet, daily cleaning, and platform costs.
              Break-even at roughly two hours per day.
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left border-collapse rounded-xl shadow-sm text-sm md:text-base">
                <thead>
                  <tr className="bg-[#F5BF59]/10" style={{ color: K.ink }}>
                    <th className="p-3 md:p-4 font-semibold whitespace-nowrap">Metric</th>
                    <th className="p-3 md:p-4 font-semibold whitespace-nowrap">Monthly (10 booths)</th>
                    <th className="p-3 md:p-4 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr><td className="p-3 md:p-4 font-medium">Gross revenue</td><td className="p-3 md:p-4 whitespace-nowrap">€45,000</td><td className="p-3 md:p-4">5h/day per booth @ €0.50/min</td></tr>
                  <tr><td className="p-3 md:p-4 font-medium">Host share (15%)</td><td className="p-3 md:p-4 text-red-500 whitespace-nowrap">€6,750</td><td className="p-3 md:p-4">Paid to 7-Eleven</td></tr>
                  <tr><td className="p-3 md:p-4 font-medium">Operating costs</td><td className="p-3 md:p-4 text-red-500 whitespace-nowrap">€7,000</td><td className="p-3 md:p-4">Internet, cleaning, support</td></tr>
                  <tr><td className="p-3 md:p-4 font-medium">Platform & admin</td><td className="p-3 md:p-4 text-red-500 whitespace-nowrap">€2,500</td><td className="p-3 md:p-4">Software + payment infra</td></tr>
                  <tr className="bg-[#F5BF59]/10 font-semibold"><td className="p-3 md:p-4">EBITDA</td><td className="p-3 md:p-4 text-green-600 whitespace-nowrap">€28,750</td><td className="p-3 md:p-4">≈ 64% margin</td></tr>
                  <tr><td className="p-3 md:p-4 font-medium">Break-even utilization</td><td className="p-3 md:p-4 whitespace-nowrap">2h/day</td><td className="p-3 md:p-4">Conservative estimate</td></tr>
                  <tr><td className="p-3 md:p-4 font-medium">Payback period</td><td className="p-3 md:p-4 whitespace-nowrap">2.5 months</td><td className="p-3 md:p-4">Per booth investment</td></tr>
                  <tr><td className="p-3 md:p-4 font-medium">Year 2 projection</td><td className="p-3 md:p-4 text-green-600 whitespace-nowrap">€330K EBITDA</td><td className="p-3 md:p-4">At 7h/day utilization</td></tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              Strong unit economics at low occupancy. Profitability scales linearly with minimal operational overhead.
            </p>

            <p className="text-sm text-neutral-600 mt-2">
              Scenario: Each additional hour of daily use adds ≈ €5,750 monthly EBITDA across 10 booths.
            </p>
          </div>
        </Section>

      <Section id="creative" title="Creative direction">
        <p>
          Calm Scandinavian feel, clean greys with blue accents, gold for calls to action.
          Story flows from city noise to silence and focus. The booth is the doorway.
        </p>
        <div className="mt-6">
          <InteractiveBentoGallery
            title="Creative direction"
            description="Palette, typography and focus frames"
            mediaItems={[
              { id: 1, type: 'image', title: 'Palette', desc: 'Gold accent on calm greys and navy', url: '/presentation/palette.png', span: 'md:col-span-2 md:row-span-2 sm:col-span-2 sm:row-span-2' },
              { id: 2, type: 'image', title: 'Typography', desc: 'Aboreto headers, Reddit Sans UI', url: '/presentation/typographie.png', span: 'md:col-span-1 md:row-span-3 sm:col-span-1 sm:row-span-2' },
              { id: 3, type: 'image', title: 'Focus', desc: 'Clean blocks and breathing room', url: '/presentation/focus.png', span: 'md:col-span-1 md:row-span-3 sm:col-span-2 sm:row-span-2' },
              { id: 4, type: 'image', title: 'Exploration A', desc: 'Component and layout study', url: '/presentation/design4.png', span: 'md:col-span-2 md:row-span-2 sm:col-span-1 sm:row-span-2' },
              { id: 5, type: 'image', title: 'Exploration B', desc: 'Motion and texture notes', url: '/presentation/design5.png', span: 'md:col-span-2 md:row-span-2 sm:col-span-1 sm:row-span-2' },
            ]}
          />
        </div>
      </Section>

        <Section id="quotes" title="Real user quotes">
        <div className="grid md:grid-cols-2 gap-6">
          {QUOTES.map((q, i) => (
            <div key={i} className="rounded-2xl border border-neutral-200 p-5 bg-white">
              <p className="text-[17px]">"{q.text}"</p>
              <div className="mt-3 text-sm text-neutral-600">Source: {q.source}</div>
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-neutral-50 p-3 border border-neutral-200">
                  <div className="text-xs text-neutral-500">Insight</div>
                  <div className="text-sm">{q.insight}</div>
                </div>
                <div className="rounded-xl bg-neutral-50 p-3 border border-neutral-200">
                  <div className="text-xs text-neutral-500">Relevance</div>
                  <div className="text-sm">{q.relevance}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        </Section>

        

        <footer className="py-10 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} KUBO
        </footer>
      </div>
    </div>
  );
}
