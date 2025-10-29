"use client";

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs'
import QRCode from './QRCode'

export default function Hero() {
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  
  useEffect(() => setMounted(true), [])

  return (
    <header className="bg-white border-b border-kubo-border">
      <div className="w-full px-6">
        <div className="flex items-center justify-between py-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <a href="/" className="inline-flex items-center" aria-label="KUBO Home">
              <Image src="/images/kubologo.svg" alt="KUBO" width={96} height={28} priority />
            </a>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#locations" className="text-kubo-textDark hover:opacity-90 transition-opacity font-body">LOCATIONS</a>
            <a href="#pricing" className="text-kubo-textDark hover:opacity-90 transition-opacity font-body">PRICING</a>
            <SignedOut>
              <SignInButton mode="modal" afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
                <button className="btn-outline-dark border-kubo-textDark text-kubo-textDark hover:bg-kubo-textDark hover:text-white font-body">SIGN UP</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link 
                href="/dashboard" 
                className="btn-outline-dark border-kubo-textDark text-kubo-textDark hover:bg-kubo-textDark hover:text-white font-body"
                onClick={(e) => {
                  // Ensure navigation even if Link is intercepted by any overlay
                  e.preventDefault()
                  router.push('/dashboard')
                }}
              >
                DASHBOARD
              </Link>
            </SignedIn>
          </nav>

           {/* Mobile Menu Button */}
           <button
             className="md:hidden p-3 text-kubo-textDark hover:bg-gray-100 rounded-lg transition-colors"
             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
             aria-label="Toggle mobile menu"
           >
             {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
           </button>
        </div>

         {/* Mobile Navigation Sidebar */}
         {mobileMenuOpen && (
           <>
             {/* Backdrop */}
             <div 
               className="md:hidden fixed inset-0 bg-black/50 z-40" 
               onClick={() => setMobileMenuOpen(false)}
             />
             {/* Sidebar */}
             <div className="md:hidden fixed left-0 top-0 h-full w-80 bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out animate-in slide-in-from-left-2">
               <div className="flex flex-col h-full">
                 {/* Header */}
                 <div className="flex items-center justify-between p-6 border-b border-kubo-border">
                   <div className="flex items-center gap-3">
                     <Image src="/images/kubologo.svg" alt="KUBO" width={96} height={28} />
                   </div>
                   <button
                     className="p-2 text-kubo-textDark hover:bg-gray-100 rounded-lg transition-colors"
                     onClick={() => setMobileMenuOpen(false)}
                   >
                     <X className="h-6 w-6" />
                   </button>
                 </div>
                 
                 {/* Navigation */}
                 <div className="flex-1 p-6">
                   <nav className="flex flex-col space-y-6">
                     <a 
                       href="#locations" 
                       className="text-lg font-medium text-kubo-textDark hover:opacity-90 transition-opacity font-body uppercase tracking-wide" 
                       onClick={() => setMobileMenuOpen(false)}
                     >
                       LOCATIONS
                     </a>
                     <a 
                       href="#pricing" 
                       className="text-lg font-medium text-kubo-textDark hover:opacity-90 transition-opacity font-body uppercase tracking-wide" 
                       onClick={() => setMobileMenuOpen(false)}
                     >
                       PRICING
                     </a>
                     <div className="pt-4">
                       <SignedOut>
                         <SignInButton mode="modal" afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
                           <button 
                             className="btn-outline-dark border-kubo-textDark text-kubo-textDark hover:bg-kubo-textDark hover:text-white w-full font-body uppercase tracking-wide px-6 py-4 text-lg" 
                             onClick={() => setMobileMenuOpen(false)}
                           >
                             SIGN UP
                           </button>
                         </SignInButton>
                       </SignedOut>
                       <SignedIn>
                        <Link 
                          href="/dashboard" 
                          className="btn-outline-dark border-kubo-textDark text-kubo-textDark hover:bg-kubo-textDark hover:text-white w-full font-body uppercase tracking-wide px-6 py-4 text-lg inline-block text-center" 
                          onClick={(e) => {
                            e.preventDefault()
                            setMobileMenuOpen(false)
                            router.push('/dashboard')
                          }}
                        >
                          DASHBOARD
                        </Link>
                       </SignedIn>
                     </div>
                   </nav>
                 </div>
               </div>
             </div>
           </>
         )}
      </div>
      
      {/* Banner Section - Full Width */}
      <div className={`flex flex-col items-center text-center py-20 md:py-28 transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundColor: '#2B3F5F' }}>
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="font-heading text-4xl md:text-6xl tracking-[0.15em] leading-tight text-white">
            WELCOME TO YOUR
          </h1>
          <div className="mt-1 font-heading text-5xl md:text-7xl tracking-[0.15em] leading-tight" style={{ color: '#F5BF59' }}>FOCUS SPACE</div>
          <p className="mt-8 text-white/90 font-body text-lg text-center">Your personal booth for business calls.<br />Convenient. Private. Affordable.</p>
        </div>
      </div>
    </header>
  )
}


