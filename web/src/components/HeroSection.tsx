'use client'

import { useState } from 'react'
import { MapPin, Clock, Shield, Wifi } from 'lucide-react'
import { SignInButton } from '@clerk/nextjs'

interface HeroSectionProps {
  onShowMap: () => void
}

export function HeroSection({ onShowMap }: HeroSectionProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGetStarted = () => {
    setIsLoading(true)
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  return (
    <section className="relative bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
                Your Perfect
                <span className="text-gradient block">Workspace</span>
                Awaits
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl">
                Find soundproof micro-workspaces in convenience stores. 
                Perfect for remote work, calls, and meetings on the go.
              </p>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Soundproof</p>
                  <p className="text-sm text-gray-600">Private & quiet</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">High-speed WiFi</p>
                  <p className="text-sm text-gray-600">Reliable connection</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Pay per minute</p>
                  <p className="text-sm text-gray-600">Only pay for time used</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Convenient locations</p>
                  <p className="text-sm text-gray-600">7-Eleven stores</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <SignInButton mode="modal">
                <button 
                  onClick={handleGetStarted}
                  disabled={isLoading}
                  className="btn-primary text-lg px-8 py-4 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span>Get Started</span>
                      <MapPin className="w-5 h-5" />
                    </>
                  )}
                </button>
              </SignInButton>
              
              <button 
                onClick={onShowMap}
                className="btn-secondary text-lg px-8 py-4 flex items-center justify-center space-x-2"
              >
                <MapPin className="w-5 h-5" />
                <span>Find Locations</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">Trusted by remote professionals</p>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>500+ active users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>50+ locations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Stockholm, Norway, Copenhagen</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            <div className="relative z-10">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">7-Eleven Stockholm</h3>
                      <p className="text-sm text-gray-600">Storgatan 1, Stockholm</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Availability</span>
                      <span className="text-sm font-medium text-green-600">Available now</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Rate</span>
                      <span className="text-sm font-medium text-gray-900">€0.50/min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Features</span>
                      <span className="text-sm font-medium text-gray-900">Soundproof • WiFi • Power</span>
                    </div>
                  </div>
                  
                  <button className="w-full btn-primary">
                    Reserve Now
                  </button>
                </div>
              </div>
            </div>
            
            {/* Background decoration */}
            <div className="absolute -top-4 -right-4 w-72 h-72 bg-primary-200 rounded-full opacity-20"></div>
            <div className="absolute -bottom-4 -left-4 w-64 h-64 bg-secondary-200 rounded-full opacity-20"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
