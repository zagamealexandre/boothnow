"use client";

import { useState, useRef, useEffect, useCallback } from 'react'
import { SignOutButton, useAuth } from '@clerk/nextjs'
import { MapPin, Clock, Wifi, Shield, LocateFixed, Search, X, Settings, Bell, Users, QrCode, User, Ticket, LifeBuoy, Gift, Star, ShoppingBag, Coffee, CreditCard } from 'lucide-react'
import Link from 'next/link'
import Rewards from './Rewards'
import { boothService, Booth } from '../services/boothService'
import { userService, UserProfile, UserStats, SessionHistory } from '../services/userService'
import { MapSection } from './minimal/MapSection'
import MobileMapSection from './MobileMapSection'
import ProductCatalog from './ProductCatalog'
import CheckoutModal from './CheckoutModal'
import SubscriptionManager from './SubscriptionManager'
import PaymentSetup from './PaymentSetup'
import { CreemProduct, CreemCheckout } from '../services/creemService'

// Deprecated function removed - using MapSection instead


const mapStyles = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#F5F4F2' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#EAEAEA' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#D9E6F2' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#A3A3A3' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.neighborhood',
    stylers: [{ visibility: 'off' }],
  },
]

interface ClerkUser {
  id: string
  firstName?: string
  lastName?: string
  emailAddresses?: Array<{ emailAddress: string }>
  phoneNumbers?: Array<{ phoneNumber: string }>
  createdAt?: number
  updatedAt?: number
}

interface DashboardProps {
  clerkUser?: ClerkUser | null
}

export default function Dashboard({ clerkUser }: DashboardProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    console.error('Google Maps API key not found. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.')
  }

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('map')
  const [cameraActive, setCameraActive] = useState(false)
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [showSearchField, setShowSearchField] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<CreemProduct | null>(null)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>([])
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { userId } = useAuth()

  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) return

      try {
        setIsLoadingProfile(true)
        
        // First try to initialize user profile (creates if doesn't exist)
        // Pass the Clerk user data to get real name and email
        console.log('🔍 Dashboard - initializing user profile for:', userId);
        const profile = await userService.initializeUserProfile(userId, clerkUser)
        console.log('🔍 Dashboard - user profile initialized:', profile ? 'Success' : 'Failed');
        
        // Then load stats and session history in parallel
        const [stats, history] = await Promise.all([
          userService.getUserStats(userId),
          userService.getUserSessionHistory(userId, 5)
        ])

        setUserProfile(profile)
        setUserStats(stats)
        setSessionHistory(history)
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadUserData()
  }, [userId, clerkUser])

  // Handle recenter button
  const handleRecenter = () => {
    // Call the global recenter function from MapSection
    if ((window as any).recenterMap) {
      (window as any).recenterMap()
    } else {
      console.log('Map not ready yet, please wait...')
    }
  }

  // Handle search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      // Use Google Places API for search
      if ((window as any).google?.maps?.places) {
        const service = new (window as any).google.maps.places.PlacesService(document.createElement('div'))
        const request = {
          query: query,
          location: { lat: 59.334591, lng: 18.06324 }, // Stockholm center
          radius: 15000,
          fields: ['name', 'formatted_address', 'geometry', 'place_id', 'opening_hours', 'url']
        }

        service.textSearch(request, (results: any[], status: string) => {
          if (status === (window as any).google.maps.places.PlacesServiceStatus.OK) {
            setSearchResults(results || [])
          } else {
            console.error('Search failed:', status)
            setSearchResults([])
          }
        })
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    }
  }

  // Handle search input change with debounce
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // Clear previous timeout
    if ((window as any).searchTimeout) {
      clearTimeout((window as any).searchTimeout)
    }
    
    // Set new timeout for debounced search
    (window as any).searchTimeout = setTimeout(() => {
      handleSearch(value)
    }, 300)
  }

  // Handle search result selection
  const handleSearchResultClick = (result: any) => {
    if ((window as any).google?.maps) {
      const map = (window as any).mapInstanceRef?.current
      if (map && result.geometry?.location) {
        map.panTo(result.geometry.location)
        map.setZoom(16)
        
        // Add a marker for the selected result
        new (window as any).google.maps.Marker({
          position: result.geometry.location,
          map: map,
          title: result.name,
          icon: {
            url: 'data:image/svg+xml;utf8,' +
              encodeURIComponent(
                `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="#2E6A9C" stroke="white" stroke-width="2"/>
                </svg>`
              ),
            scaledSize: new (window as any).google.maps.Size(24, 24),
          }
        })
      }
    }
    setShowSearchField(false)
    setSearchQuery('')
    setSearchResults([])
  }


 // Remove userLocation from dependencies to prevent re-runs

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownRef])

  // Close search field when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element
      if (showSearchField && !target.closest('.search-field-overlay')) {
        setShowSearchField(false)
      }
    }

    if (showSearchField) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showSearchField])




  // Camera functions
  const startCamera = async () => {
    try {
      console.log('Starting camera...')
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device')
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: 'environment' }, // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      console.log('Camera stream obtained:', stream)
      
      // Set the stream and activate camera first
      streamRef.current = stream
      setCameraActive(true)
      
      // Wait for the video element to be rendered, then attach stream
      setTimeout(() => {
        if (videoRef.current) {
          console.log('Attaching stream to video element')
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded')
            videoRef.current?.play().catch(console.error)
          }
          videoRef.current.oncanplay = () => {
            console.log('Video can play')
          }
          videoRef.current.onerror = (e) => {
            console.error('Video error:', e)
          }
          console.log('Camera started successfully')
        } else {
          console.error('Video ref still not available after timeout')
        }
      }, 100)
      
    } catch (error) {
      console.error('Error accessing camera:', error)
      let errorMessage = 'Camera access denied. Please allow camera access to scan QR codes.'
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.'
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.'
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported on this device.'
        }
      }
      
      alert(errorMessage)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
    setScannedCode(null)
  }

  const handleQRScan = (result: string) => {
    setScannedCode(result)
    // Here you would typically:
    // 1. Validate the QR code format
    // 2. Send to backend to unlock booth
    // 3. Show success/error message
    console.log('Scanned QR code:', result)
  }

  // Handle video element when camera becomes active
  useEffect(() => {
    if (cameraActive && streamRef.current) {
      console.log('Camera is active, setting up video element...')
      
      // Use a small delay to ensure the video element is rendered
      const timer = setTimeout(() => {
        if (videoRef.current) {
          console.log('Video element found, attaching stream')
          videoRef.current.srcObject = streamRef.current
          videoRef.current.play().catch(console.error)
        } else {
          console.error('Video element still not found')
        }
      }, 50)
      
      return () => clearTimeout(timer)
    }
  }, [cameraActive])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])


  return (
    <div className="min-h-screen bg-[#F3F3F3]">
      {/* Desktop Header - Hidden on mobile */}
      <header className="hidden md:block bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-200/50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#2E6A9C] rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-2xl font-bold text-[#1A1A1A]">BoothNow</span>
          </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4 relative">
                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <Bell className="w-6 h-6 text-gray-600" />
                </button>
                <div ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                  >
                    <Settings className="w-6 h-6 text-gray-600" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                      <Link href="/dashboard" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <MapPin className="w-4 h-4 mr-2" /> Dashboard
                      </Link>
                      <Link href="/rewards" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <Gift className="w-4 h-4 mr-2" /> Rewards
                      </Link>
                      <SignOutButton>
                        <button className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <X className="w-4 h-4 mr-2" /> Log out
                        </button>
                      </SignOutButton>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>
        </header>

      {/* Desktop Content */}
      <div className="hidden md:block min-h-screen">
        <div className="h-screen">
          <MapSection />
        </div>
      </div>

      {/* Mobile Content - Full Screen */}
      <div className="md:hidden fixed inset-0 z-0">
        {/* Map Tab */}
        {activeTab === 'map' && (
          <>
          <div className="h-full w-full relative">
            <MobileMapSection />
            
            {/* Mobile Map Controls */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col space-y-3 z-10">
              <button 
                onClick={handleRecenter}
                className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                title="Center on my location"
              >
                <LocateFixed className="w-6 h-6 text-gray-700" />
              </button>
              <button 
                onClick={() => setShowSearchField(!showSearchField)}
                className="p-3 bg-white rounded-full shadow-md relative hover:bg-gray-50 transition-colors"
                title="Search for locations"
              >
                <Search className="w-6 h-6 text-gray-700" />
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full" />
              </button>
              <button 
                onClick={() => setActiveTab('bookings')}
                className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                title="View bookings"
              >
                <Shield className="w-6 h-6 text-gray-700" />
              </button>
              <button 
                onClick={() => setActiveTab('rewards')}
                className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                title="Help & support"
              >
                <LifeBuoy className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Custom Zoom Controls - positioned to avoid bottom navbar */}
            <div className="absolute right-4 bottom-20 flex flex-col space-y-2 z-10">
              <button 
                onClick={() => {
                  if ((window as any).mapInstanceRef?.current) {
                    const currentZoom = (window as any).mapInstanceRef.current.getZoom()
                    ;(window as any).mapInstanceRef.current.setZoom(currentZoom + 1)
                  }
                }}
                className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                title="Zoom in"
              >
                <span className="w-6 h-6 text-gray-700 text-lg font-bold">+</span>
              </button>
              <button 
                onClick={() => {
                  if ((window as any).mapInstanceRef?.current) {
                    const currentZoom = (window as any).mapInstanceRef.current.getZoom()
                    ;(window as any).mapInstanceRef.current.setZoom(currentZoom - 1)
                  }
                }}
                className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                title="Zoom out"
              >
                <span className="w-6 h-6 text-gray-700 text-lg font-bold">−</span>
              </button>
            </div>

            {/* Find Nearby Booths Button */}
            <button 
              onClick={handleRecenter}
              className="absolute bottom-28 left-1/2 -translate-x-1/2 px-6 py-3 bg-white rounded-full shadow-lg flex items-center space-x-2 z-10 hover:bg-gray-50 transition-colors"
              title="Find nearby booths"
            >
              <MapPin className="w-5 h-5 text-blue-600" />
              <span className="text-gray-800 font-medium">Find nearby booths</span>
            </button>
          </div>

          {/* Search Field Overlay */}
          {showSearchField && (
            <div className="absolute top-4 left-4 right-4 z-20 search-field-overlay">
              <div className="bg-white rounded-lg shadow-lg p-4">
                <div className="flex items-center space-x-3">
                  <Search className="w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search for locations..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    className="flex-1 border-none outline-none text-gray-800 placeholder-gray-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setShowSearchField(false)
                        setSearchQuery('')
                        setSearchResults([])
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      setShowSearchField(false)
                      setSearchQuery('')
                      setSearchResults([])
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  Search for addresses, places, or 7-Eleven locations
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-4 max-h-60 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <MapPin className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {result.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {result.formatted_address}
                            </div>
                            {result.opening_hours && (
                              <div className="text-xs text-gray-400 mt-1">
                                {result.opening_hours.open_now ? 'Open now' : 'Closed'}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Right Action Rail - Mobile Only */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col space-y-3 z-10">
          <button 
            onClick={handleRecenter}
            className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
            title="Center on my location"
          >
            <LocateFixed className="w-6 h-6 text-gray-700" />
          </button>
          <button 
            onClick={() => setShowSearchField(!showSearchField)}
            className="p-3 bg-white rounded-full shadow-md relative hover:bg-gray-50 transition-colors"
            title="Search for locations"
          >
            <Search className="w-6 h-6 text-gray-700" />
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full" />
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
            title="View bookings"
          >
            <Shield className="w-6 h-6 text-gray-700" />
          </button>
          <button 
            onClick={() => setActiveTab('rewards')}
            className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
            title="Help & support"
          >
            <LifeBuoy className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Find Nearby Booths Button - Mobile Only */}
        <button 
          onClick={handleRecenter}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 px-6 py-3 bg-white rounded-full shadow-lg flex items-center space-x-2 z-10 hover:bg-gray-50 transition-colors"
          title="Find nearby booths"
        >
          <MapPin className="w-5 h-5 text-gray-700" />
          <span className="text-gray-800 font-medium">Find nearby booths</span>
        </button>
          </>
        )}


        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="h-full bg-white p-6 pb-24 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h2>
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">7-Eleven Östermalm</h3>
                    <p className="text-sm text-gray-600">Sturegatan 1, Stockholm</p>
                    <p className="text-xs text-gray-500 mt-1">Today, 3:00 PM - 4:00 PM</p>
                  </div>
                  <span className="text-sm font-medium text-blue-600">Upcoming</span>
                </div>
                <div className="mt-3 flex space-x-2">
                  <button className="flex-1 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md">
                    Check In
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-md">
                    Cancel
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
              <div>
                    <h3 className="font-semibold text-gray-900">7-Eleven Södermalm</h3>
                    <p className="text-sm text-gray-600">Götgatan 1, Stockholm</p>
                    <p className="text-xs text-gray-500 mt-1">Tomorrow, 1:00 PM - 2:00 PM</p>
                  </div>
                  <span className="text-sm font-medium text-gray-600">Confirmed</span>
                </div>
                <div className="mt-3 flex space-x-2">
                  <button className="flex-1 bg-gray-600 text-white text-sm font-medium px-4 py-2 rounded-md">
                    Modify
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-md">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scan Tab */}
        {activeTab === 'scan' && (
          <div className="h-full bg-black flex flex-col items-center justify-center p-6 pb-24">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Scan QR Code</h2>
              <p className="text-gray-300">Point your camera at the booth QR code to unlock</p>
            </div>
            
            {/* Camera View */}
            <div className="relative w-80 h-80 bg-gray-900 rounded-lg border-2 border-gray-700 overflow-hidden">
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }} // Mirror the video like a selfie camera
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-blue-500 rounded-lg relative">
                    {/* QR Code Scanner Overlay */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
                    
                    {/* Mock QR Code */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 bg-white rounded-lg p-4">
                        <div className="w-full h-full bg-black rounded grid grid-cols-8 gap-1">
                          {Array.from({ length: 64 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`${Math.random() > 0.5 ? 'bg-white' : 'bg-black'} rounded-sm`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Scanner Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-blue-500 rounded-lg">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              {scannedCode ? (
                <div className="space-y-4">
                  <div className="bg-green-900 text-green-100 px-4 py-2 rounded-lg">
                    <p className="font-medium">QR Code Scanned!</p>
                    <p className="text-sm">Code: {scannedCode}</p>
                  </div>
                  <button 
                    onClick={stopCamera}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    Stop Camera
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    {cameraActive ? 'Position the QR code within the frame' : 'Click to start camera'}
                  </p>
                  
                  {/* HTTPS Warning */}
                  {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
                    <div className="bg-yellow-900 text-yellow-100 px-4 py-2 rounded-lg text-sm">
                      Camera requires HTTPS. Please use https:// or localhost
                    </div>
                  )}
                  
                  <button 
                    onClick={cameraActive ? stopCamera : startCamera}
                    className={`px-6 py-3 rounded-lg font-medium ${
                      cameraActive 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {cameraActive ? 'Stop Camera' : 'Start Camera'}
                  </button>
                  
                  {/* Debug info */}
                  <div className="text-xs text-gray-500 mt-2">
                    Camera active: {cameraActive ? 'Yes' : 'No'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="h-full bg-white p-6 pb-24 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile</h2>
            {isLoadingProfile ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2E6A9C] border-t-transparent"></div>
                <span className="ml-3 text-gray-600">Loading profile...</span>
              </div>
            ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Account Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                      <span className="text-gray-900">
                        {userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'Not provided' : 'Loading...'}
                      </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                      <span className="text-gray-900">{userProfile?.email || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member since:</span>
                      <span className="text-gray-900">{userStats?.member_since || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Usage Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total sessions:</span>
                      <span className="text-gray-900">{userStats?.total_sessions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total time:</span>
                      <span className="text-gray-900">
                        {userStats ? `${Math.floor(userStats.total_time_minutes / 60)}h ${userStats.total_time_minutes % 60}m` : '0h 0m'}
                      </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total spent:</span>
                      <span className="text-gray-900">€{userStats?.total_spent?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Recent Sessions</h3>
                <div className="space-y-4">
                    {sessionHistory.length > 0 ? (
                      sessionHistory.map((session) => (
                        <div key={session.id} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                              <h4 className="font-semibold text-gray-900">{session.booth_name}</h4>
                              <p className="text-sm text-gray-600">{session.booth_address}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(session.start_time).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                                {session.end_time && ` - ${new Date(session.end_time).toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit' 
                                })}`}
                              </p>
                      </div>
                            <span className="text-sm font-medium text-green-600">
                              {session.duration_minutes ? `${session.duration_minutes} min` : 'Active'}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Shield className="w-4 h-4 mr-1" />
                        Soundproof
                      </span>
                      <span className="flex items-center">
                        <Wifi className="w-4 h-4 mr-1" />
                        WiFi
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                              €{session.cost?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No sessions found</p>
                        <p className="text-sm mt-1">Your session history will appear here</p>
                      </div>
                    )}
                    </div>
                    </div>

              {/* Payments & Subscriptions Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Payments & Subscriptions</h3>
                
                {/* Payment Setup for Pay-Per-Use */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Method</h4>
                  <PaymentSetup 
                    clerkUser={clerkUser}
                    userProfile={userProfile}
                    onSetupComplete={() => {
                      console.log('Payment method setup completed');
                    }}
                  />
                </div>

                {/* Product Catalog */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Available Plans</h4>
                  <ProductCatalog 
                    onProductSelect={(product) => {
                      setSelectedProduct(product);
                      setShowCheckoutModal(true);
                    }}
                    showBoothProducts={true}
                  />
                  </div>

                {/* Subscription Management */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">My Subscriptions</h4>
                  <SubscriptionManager 
                    customerEmail={userProfile?.email}
                    onSubscriptionUpdate={(subscription) => {
                      console.log('Subscription updated:', subscription);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  className="w-full bg-gray-100 text-gray-700 text-sm font-medium px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={() => {
                    // Redirect to Creem payment methods or checkout
                    window.open('https://creem.io', '_blank');
                  }}
                >
                  Payment Methods
                </button>
                <button className="w-full bg-gray-100 text-gray-700 text-sm font-medium px-4 py-3 rounded-lg">
                  Notifications
                </button>
                <button className="w-full bg-gray-100 text-gray-700 text-sm font-medium px-4 py-3 rounded-lg">
                  Help & Support
                </button>
                  <SignOutButton>
                    <button 
                      className="w-full bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                      onClick={() => {
                        // Redirect to landing page after logout
                        window.location.href = '/';
                      }}
                    >
                      <X className="w-4 h-4 inline mr-2" />
                      Log Out
                    </button>
                  </SignOutButton>
              </div>
            </div>
            )}
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="h-full bg-[#F3F3F3] p-4 pb-24 overflow-y-auto">
            <Rewards />
          </div>
        )}

      </div>

      {/* Desktop Map Card */}
      <div className="hidden md:block mx-auto max-w-6xl px-6 py-6">
        <div className="mb-6 text-sm text-[#6B7280]">Signed in as: {userId || 'guest'}</div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-[#E0E0E0] bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium">Recent sessions</h3>
            <p className="mt-2 text-sm text-[#6B7280]">Your latest activity will appear here.</p>
          </div>
          <div className="rounded-xl border border-[#E0E0E0] bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium">Statistics</h3>
            <p className="mt-2 text-sm text-[#6B7280]">Usage, minutes, and billing overview.</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white h-20 flex justify-around items-center shadow-lg z-20">
        <button 
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center transition-colors ${activeTab === 'map' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <MapPin className="w-6 h-6" />
          <span className={`text-xs mt-1 ${activeTab === 'map' ? 'font-medium' : ''}`}>Map</span>
        </button>
        <button 
          onClick={() => setActiveTab('bookings')}
          className={`flex flex-col items-center transition-colors ${activeTab === 'bookings' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <Shield className="w-6 h-6" />
          <span className={`text-xs mt-1 ${activeTab === 'bookings' ? 'font-medium' : ''}`}>Bookings</span>
        </button>
        <button 
          onClick={() => setActiveTab('scan')}
          className="flex flex-col items-center -mt-8"
        >
          <div className="bg-blue-600 p-4 rounded-full shadow-xl">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <span className="text-xs mt-1 text-blue-600 font-medium">Scan</span>
        </button>
        <button 
          onClick={() => setActiveTab('rewards')}
          className={`flex flex-col items-center transition-colors ${activeTab === 'rewards' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <Gift className="w-6 h-6" />
          <span className={`text-xs mt-1 ${activeTab === 'rewards' ? 'font-medium' : ''}`}>Rewards</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <User className="w-6 h-6" />
          <span className={`text-xs mt-1 ${activeTab === 'profile' ? 'font-medium' : ''}`}>Profile</span>
        </button>
      </nav>

      {/* Checkout Modal */}
      <CheckoutModal
        product={selectedProduct}
        isOpen={showCheckoutModal}
        onClose={() => {
          setShowCheckoutModal(false);
          setSelectedProduct(null);
        }}
        onSuccess={(checkout) => {
          console.log('Checkout created:', checkout);
          // Handle successful checkout creation
        }}
        customerEmail={userProfile?.email}
        customerName={`${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim()}
        metadata={{
          user_id: userId,
          booth_session: true
        }}
      />
    </div>
  )
}


