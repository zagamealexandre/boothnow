'use client'

import { useState } from 'react'
import { useUser, SignInButton, UserButton } from '@clerk/nextjs'
import { Menu, X, MapPin } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  const { isSignedIn } = useUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">BoothNow</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-gray-900">
              Features
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="#about" className="text-gray-600 hover:text-gray-900">
              About
            </Link>
            {isSignedIn ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="btn-primary">
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <SignInButton mode="modal">
                  <button className="text-gray-600 hover:text-gray-900">
                    Sign In
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="btn-primary">
                    Get Started
                  </button>
                </SignInButton>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <Link
                href="#features"
                className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="#about"
                className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              {isSignedIn ? (
                <div className="px-3 py-2">
                  <Link href="/dashboard" className="btn-primary block text-center">
                    Dashboard
                  </Link>
                </div>
              ) : (
                <div className="px-3 py-2 space-y-2">
                  <SignInButton mode="modal">
                    <button className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignInButton mode="modal">
                    <button className="btn-primary block text-center w-full">
                      Get Started
                    </button>
                  </SignInButton>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
