"use client";

import { useState } from 'react'
import { Search } from 'lucide-react'
import dynamic from 'next/dynamic'

const MinimalMap = dynamic(() => import('./minimal/MapSection').then(m => m.MapSection), { ssr: false })

export default function MapSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)

  return (
    <section id="locations" className="pt-28 pb-20 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-12">
          <h3 className="font-heading text-3xl tracking-[0.18em] text-kubo-textDark not-italic no-underline">FIND A BOOTH LOCATION THAT FITS YOUR SCHEDULE</h3>
          <p className="mt-4 text-kubo-textGrey font-body">Live booth availability updated in real time.</p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="h-96 relative overflow-hidden rounded-2xl [&>section]:m-0 [&>section]:p-0 [&>section]:bg-transparent">
              <MinimalMap filterStatus={showAvailableOnly ? 'available' : 'all'} hideHeader compact />
            </div>
          </div>
          
          {/* Controls Panel */}
          <div className="space-y-6">
            <div>
              <h4 className="font-heading text-lg tracking-[0.16em] text-kubo-textDark mb-4">Booth locations</h4>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-kubo-textGrey" />
                <input
                  type="text"
                  placeholder="Search by city, zip code, or address"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border border-kubo-border rounded-lg focus:outline-none focus:ring-2 focus:ring-kubo-secondary focus:border-transparent"
                />
              </div>
              
              {/* Toggle */}
              <div className="flex items-center gap-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAvailableOnly}
                    onChange={(e) => setShowAvailableOnly(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${showAvailableOnly ? 'bg-kubo-primary' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${showAvailableOnly ? 'translate-x-5' : ''}`} />
                  </div>
                </label>
                <span className="text-sm text-kubo-textGrey">Only show available booths</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="bg-white border border-kubo-border rounded-lg p-4">
              <h5 className="font-medium text-kubo-textDark mb-3">Booth Status</h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-kubo-textGrey">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-kubo-textGrey">Busy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-kubo-textGrey">Pre-booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-kubo-textGrey">Maintenance</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button className="btn-gold w-full">Find booth</button>
          </div>
        </div>
      </div>
    </section>
  )
}


