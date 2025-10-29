"use client";

import { useState, useRef, useEffect, useCallback } from 'react'
import { SignOutButton, useAuth, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { MapPin, Clock, Wifi, Shield, LocateFixed, Search, X, Settings, Bell, Users, QrCode, User, Ticket, LifeBuoy, Gift, Star, ShoppingBag, Coffee, CreditCard, Calendar } from 'lucide-react'
import Link from 'next/link'
import { boothService, Booth } from '../services/boothService'
import { userService, UserProfile, UserStats, SessionHistory, ActiveSession as ActiveSessionType } from '../services/userService'
import { bookingsService, Booking, ActiveBooking } from '../services/bookingsService'
import { usePointsEarning } from '../hooks/usePointsEarning'
import { MapSection } from './minimal/MapSection'
import MobileMapSection from './MobileMapSection'
import ProductCatalog from './ProductCatalog'
import CheckoutModal from './CheckoutModal'
import SubscriptionManager from './SubscriptionManager'
import PaymentSetup from './PaymentSetup'
import ActiveSession from './ActiveSession'
import CompactActiveSession from './CompactActiveSession'
import DetailedActiveSession from './DetailedActiveSession'
import ProfileTab from './ProfileTab'
import HelpTab from './HelpTab'
import DesktopMessage from './DesktopMessage'
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
  const { awardBoothSessionPoints, awardAdvanceBookingPoints } = usePointsEarning()
  const { signOut } = useClerk()
  const router = useRouter()
  const [isDesktop, setIsDesktop] = useState(false)
  
  // Desktop detection
  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768;
      setIsDesktop(!isMobileDevice && !isSmallScreen);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  
  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }
  
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
  const [activeSessions, setActiveSessions] = useState<ActiveSessionType[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [showDetailedSession, setShowDetailedSession] = useState(false)
  const [selectedSession, setSelectedSession] = useState<ActiveBooking | null>(null)
  const [profileActiveSection, setProfileActiveSection] = useState<string>('overview')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const hasInitialized = useRef(false) // Prevent repeated initialization
  const { userId } = useAuth()

  // Load subscriptions
  const loadSubscriptions = async () => {
    try {
      const response = await fetch('/api/payments/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    }
  };

  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId || hasInitialized.current) return

      try {
        setIsLoadingProfile(true)
        hasInitialized.current = true // Prevent repeated calls
        
        // First try to initialize user profile (creates if doesn't exist)
        // Pass the Clerk user data to get real name and email
        console.log('🔍 Dashboard - initializing user profile for:', userId);
        console.log('🔍 Dashboard - clerkUser data:', clerkUser);
        
        // Fix user clerk_user_id first
        console.log('🔍 Dashboard - Fixing user clerk_user_id...');
        const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
        // Initialize user profile if it doesn't exist
        const profile = await userService.initializeUserProfile(userId, clerkUser)
        console.log('🔍 Dashboard - user profile initialized:', profile ? 'Success' : 'Failed');
        
        // Then load stats, session history, active sessions, and bookings in parallel
        const [stats, history, active, allBookings, activeBookings] = await Promise.all([
          userService.getUserStats(userId),
          userService.getUserSessionHistory(userId, 5),
          userService.getActiveSessions(userId),
          bookingsService.getUserBookings(userId),
          bookingsService.getActiveBookings(userId)
        ])

        setUserProfile(profile)
        setUserStats(stats)
        setSessionHistory(history)
        setActiveSessions(active)
        setBookings(allBookings)
        setActiveBookings(activeBookings)
        
        // Load subscriptions
        await loadSubscriptions();
        
        console.log('✅ Dashboard - loadUserData: All data loaded successfully')
        console.log('📊 Dashboard - loadUserData: Bookings count:', allBookings.length)
        console.log('📊 Dashboard - loadUserData: Active bookings count:', activeBookings.length)
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadUserData()
  }, [userId]) // Only depend on userId, not clerkUser

  // Listen for booking updates from map components
  useEffect(() => {
    const handleBookingUpdate = async () => {
      if (!userId) return
      
      console.log('🔧 Dashboard - handleBookingUpdate: Refreshing bookings...')
      
      try {
        const [allBookings, activeBookings, activeSessions] = await Promise.all([
          bookingsService.getUserBookings(userId),
          bookingsService.getActiveBookings(userId),
          userService.getActiveSessions(userId)
        ])
        
        setBookings(allBookings)
        setActiveBookings(activeBookings)
        setActiveSessions(activeSessions)
        
        console.log('✅ Dashboard - handleBookingUpdate: Bookings and sessions refreshed successfully')
      } catch (error) {
        console.error('❌ Dashboard - handleBookingUpdate: Error refreshing bookings:', error)
      }
    }

    window.addEventListener('bookingUpdated', handleBookingUpdate)
    
    return () => {
      window.removeEventListener('bookingUpdated', handleBookingUpdate)
    }
  }, [userId])

  // Periodic refresh for active sessions to show real-time updates
  useEffect(() => {
    if (!userId || activeBookings.length === 0) return

    const refreshInterval = setInterval(async () => {
      try {
        console.log('🔄 Dashboard - Periodic refresh: Updating active sessions...')
        const [allBookings, activeBookings] = await Promise.all([
          bookingsService.getUserBookings(userId),
          bookingsService.getActiveBookings(userId)
        ])
        
        setBookings(allBookings)
        setActiveBookings(activeBookings)
      } catch (error) {
        console.error('❌ Dashboard - Periodic refresh error:', error)
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(refreshInterval)
  }, [userId, activeBookings.length])

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

  // Session management functions
  const handleOpenDetailedSession = (booking: ActiveBooking) => {
    setSelectedSession(booking);
    setShowDetailedSession(true);
  };

  const handleCloseDetailedSession = () => {
    setShowDetailedSession(false);
    setSelectedSession(null);
  };

  const handleEndSession = async (sessionId: string) => {
    if (!userId) return

    try {
      console.log('🔍 Dashboard - Ending session:', sessionId)
      const success = await userService.endSession(userId, sessionId)
      console.log('🔍 Dashboard - End session result:', success)
      
      if (success) {
        // Award points for completing a booth session
        try {
          await awardBoothSessionPoints(sessionId)
        } catch (error) {
          console.error('❌ Dashboard - Error awarding session points:', error)
        }

        // Always remove from UI immediately (works for both mock and real data)
        setActiveSessions(prev => {
          const updated = prev.filter(session => session.id !== sessionId)
          console.log('🔍 Dashboard - Removed session from UI, remaining:', updated.length)
          return updated
        })
        
        // Refresh all user data to ensure profile tab updates
        console.log('🔍 Dashboard - Refreshing all user data after session end...')
        
        // Refresh stats, session history, and bookings
        const [stats, history, allBookings, activeBookings] = await Promise.all([
          userService.getUserStats(userId),
          userService.getUserSessionHistory(userId, 5),
          bookingsService.getUserBookings(userId),
          bookingsService.getActiveBookings(userId)
        ])
        
        setUserStats(stats)
        setSessionHistory(history)
        setBookings(allBookings)
        setActiveBookings(activeBookings)
        
        console.log('🔍 Dashboard - Session ended successfully, all data refreshed')
      } else {
        console.error('🔍 Dashboard - Failed to end session')
      }
    } catch (error) {
      console.error('Error ending session:', error)
    }
  }

  const handleModifySession = (sessionId: string) => {
    // TODO: Implement session modification
    console.log('Modify session:', sessionId)
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!userId) return
    
    try {
      console.log('🔧 Dashboard - handleCancelBooking: Cancelling booking:', bookingId)
      
      const result = await bookingsService.cancelBooking(bookingId, userId)
      
      if (result.success) {
        console.log('✅ Dashboard - handleCancelBooking: Booking cancelled successfully')
        
        // Refresh bookings data
        const [allBookings, activeBookings] = await Promise.all([
          bookingsService.getUserBookings(userId),
          bookingsService.getActiveBookings(userId)
        ])
        
        setBookings(allBookings)
        setActiveBookings(activeBookings)
        
        alert('Booking cancelled successfully!')
      } else {
        console.error('❌ Dashboard - handleCancelBooking: Failed to cancel booking:', result.error)
        alert(`Failed to cancel booking: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Dashboard - handleCancelBooking: Exception:', error)
      alert('An error occurred while cancelling the booking')
    }
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
    <div className="min-h-screen bg-white">
      {/* Desktop Message - Show QR code for mobile access */}
      <DesktopMessage />
      
      {/* Desktop Header - Hidden on mobile and when desktop message is shown */}
      {!isDesktop && (
        <header className="hidden md:block bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-200/50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-kubo-secondary rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-2xl font-bold text-kubo-textDark font-heading">KUBO</span>
          </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4 relative">
                <button className="p-2 rounded-full hover:bg-kubo-border transition-colors">
                  <Bell className="w-6 h-6 text-kubo-textGrey" />
                </button>
                <div ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="p-2 rounded-full hover:bg-kubo-border transition-colors focus:outline-none"
                  >
                    <Settings className="w-6 h-6 text-kubo-textGrey" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                      <Link href="/dashboard" className="flex items-center px-4 py-2 text-sm text-kubo-textDark hover:bg-kubo-border font-body">
                        <MapPin className="w-4 h-4 mr-2" /> Dashboard
                      </Link>
                      <Link href="/rewards" className="flex items-center px-4 py-2 text-sm text-kubo-textDark hover:bg-kubo-border font-body">
                        <Gift className="w-4 h-4 mr-2" /> Rewards
                      </Link>
                      <button 
                        onClick={handleSignOut}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-kubo-textDark hover:bg-kubo-border font-body"
                      >
                        <X className="w-4 h-4 mr-2" /> Log out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>
        </header>
      )}

      {/* Desktop Content */}
      <div className="hidden md:block min-h-screen">
        <div className="h-screen">
          <MapSection userId={userId} />
        </div>
      </div>

      {/* Mobile Content - Full Screen */}
      <div className="md:hidden fixed inset-0 z-0">
        {/* Map Tab */}
        {activeTab === 'map' && (
          <>
          <div className="h-full w-full relative">
            <MobileMapSection userId={userId} />
            
            {/* Mobile Map Controls */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col space-y-3 z-10">
              <button 
                onClick={handleRecenter}
                className="p-3 bg-white rounded-full shadow-md hover:bg-kubo-border transition-colors"
                title="Center on my location"
              >
                <LocateFixed className="w-6 h-6 text-kubo-textDark" />
              </button>
              <button 
                onClick={() => setShowSearchField(!showSearchField)}
                className="p-3 bg-white rounded-full shadow-md relative hover:bg-kubo-border transition-colors"
                title="Search for locations"
              >
                <Search className="w-6 h-6 text-kubo-textDark" />
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full" />
              </button>
              <button 
                onClick={() => setActiveTab('bookings')}
                className="p-3 bg-white rounded-full shadow-md hover:bg-kubo-border transition-colors"
                title="View bookings"
              >
                <Shield className="w-6 h-6 text-kubo-textDark" />
              </button>
              <button 
                onClick={() => {
                  setProfileActiveSection('rewards')
                  setActiveTab('profile')
                }}
                className="p-3 bg-white rounded-full shadow-md hover:bg-kubo-border transition-colors"
                title="Rewards"
              >
                <Gift className="w-6 h-6 text-kubo-textDark" />
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
              <span className="text-gray-800 font-medium font-body">Find nearby booths</span>
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
                <div className="mt-3 text-sm text-gray-600 font-body">
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
                            <div className="font-medium text-gray-900 truncate font-body">
                              {result.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate font-body">
                              {result.formatted_address}
                            </div>
                            {result.opening_hours && (
                              <div className="text-xs text-gray-400 mt-1 font-body">
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
            onClick={() => {
              setProfileActiveSection('rewards')
              setActiveTab('profile')
            }}
            className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
            title="Rewards"
          >
            <Gift className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Find Nearby Booths Button - Mobile Only */}
        <button 
          onClick={handleRecenter}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 px-6 py-3 bg-white rounded-full shadow-lg flex items-center space-x-2 z-10 hover:bg-gray-50 transition-colors"
          title="Find nearby booths"
        >
          <MapPin className="w-5 h-5 text-gray-700" />
          <span className="text-gray-800 font-medium font-body">Find nearby booths</span>
        </button>
          </>
        )}


        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="h-full bg-white p-6 pb-24 overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 font-heading">My Bookings</h2>
            </div>
            
            {/* Active Sessions */}
            {activeSessions.length > 0 && (
              <div className="mb-8">
                {activeSessions.map((session) => (
                  <CompactActiveSession
                    key={session.id}
                    session={session}
                    onEndSession={handleEndSession}
                    onModifySession={handleModifySession}
                    subscriptions={subscriptions}
                  />
                ))}
              </div>
            )}

            {/* Active Bookings */}
            {activeBookings.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 font-heading">Active Bookings</h3>
                {activeBookings.map((booking) => (
                  <div key={booking.id} className="bg-green-50 rounded-lg p-4 border border-green-200 mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{booking.booth_name}</h3>
                        <p className="text-sm text-gray-600">{booking.booth_address}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(booking.start_time).toLocaleDateString()} - {new Date(booking.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to {new Date(booking.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Duration: {booking.duration_minutes} minutes • Type: {booking.type === 'immediate' ? 'Book Now' : 'Pre-booked'}
                        </p>
                        {booking.time_remaining && booking.time_remaining > 0 && (
                          <p className="text-sm text-green-600 mt-1 font-medium">
                            {booking.time_remaining} minutes remaining
                          </p>
                        )}
                        {booking.current_cost && (
                          <p className="text-sm text-gray-700 mt-1">
                            Current cost: €{booking.current_cost.toFixed(2)}
                          </p>
                        )}
                        {/* Show membership status for active sessions */}
                        {booking.status === 'active' && subscriptions && subscriptions.length > 0 && (
                          <p className="text-xs text-green-600 mt-1">
                            Monthly Membership Active - No additional charges
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        {booking.status === 'active' ? 'In Progress' : 'Confirmed'}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {booking.status === 'confirmed' ? (
                        <button className="w-full bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-md">
                          Check In
                        </button>
                      ) : booking.status === 'active' ? (
                        <>
                          <button
                            onClick={() => handleOpenDetailedSession(booking)}
                            className="w-full bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-red-700"
                          >
                            End Session
                          </button>
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="w-full border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="w-full border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* All Bookings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Bookings</h3>
              {bookings.length > 0 ? (
                bookings
                  .filter(booking => {
                    // Filter out bookings that are already shown in Active Bookings
                    const isActiveBooking = activeBookings.some(activeBooking => activeBooking.id === booking.id);
                    return !isActiveBooking;
                  })
                  .map((booking) => (
                  <div key={booking.id} className={`rounded-lg p-4 border ${
                    booking.status === 'active' ? 'bg-green-50 border-green-200' :
                    booking.status === 'confirmed' ? 'bg-blue-50 border-blue-200' :
                    booking.status === 'completed' ? 'bg-gray-50 border-gray-200' :
                    'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{booking.booth_name}</h3>
                        <p className="text-sm text-gray-600">{booking.booth_address}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(booking.start_time).toLocaleDateString()} - {new Date(booking.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to {new Date(booking.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Duration: {booking.duration_minutes} minutes • Type: {booking.type === 'immediate' ? 'Book Now' : 'Pre-booked'}
                        </p>
                        {booking.cost && (
                          <p className="text-xs text-gray-500 mt-1">
                            Cost: €{booking.cost.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        booking.status === 'active' ? 'text-green-600' :
                        booking.status === 'confirmed' ? 'text-blue-600' :
                        booking.status === 'completed' ? 'text-gray-600' :
                        'text-yellow-600'
                      }`}>
                        {booking.status === 'active' ? 'In Progress' :
                         booking.status === 'confirmed' ? 'Confirmed' :
                         booking.status === 'completed' ? 'Completed' :
                         booking.status === 'cancelled' ? 'Cancelled' :
                         'Pending'}
                      </span>
                    </div>
                    {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                      <div className="mt-3 flex space-x-2">
                        {booking.status === 'confirmed' && (
                          <button className="flex-1 bg-kubo-primary text-black text-sm font-medium px-4 py-2 rounded-md">
                            Check In
                          </button>
                        )}
                        <button 
                          onClick={() => handleCancelBooking(booking.id)}
                          className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Bookings Yet</h4>
                  <p className="text-gray-600 mb-4">
                    You haven't made any booth bookings yet.
                  </p>
                  <p className="text-sm text-gray-500">
                    Book a booth to get started with BoothNow.
                  </p>
                </div>
              )}
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
                      : 'bg-kubo-primary hover:opacity-90 text-black'
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
          <ProfileTab
            userProfile={userProfile}
            userStats={userStats}
            sessionHistory={sessionHistory}
            subscriptions={subscriptions}
            onProfileUpdate={(profile) => setUserProfile(profile)}
            initialActiveSection={profileActiveSection}
          />
        )}

        {/* Help Tab */}
        {activeTab === 'help' && (
          <HelpTab />
        )}


      </div>

      {/* Desktop Map Card */}
      <div className="hidden md:block mx-auto max-w-6xl px-6 py-6">
        <div className="mb-6 text-sm text-kubo-textGrey">Signed in as: {userId || 'guest'}</div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-kubo-border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium text-kubo-textDark">Recent sessions</h3>
            <p className="mt-2 text-sm text-kubo-textGrey">Your latest activity will appear here.</p>
          </div>
          <div className="rounded-xl border border-kubo-border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium text-kubo-textDark">Statistics</h3>
            <p className="mt-2 text-sm text-kubo-textGrey">Usage, minutes, and billing overview.</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white h-20 flex justify-around items-center shadow-lg z-20">
        <button 
          onClick={() => {
            setActiveTab('map')
            setProfileActiveSection('overview')
          }}
          className={`flex flex-col items-center transition-colors ${activeTab === 'map' ? 'text-kubo-primary' : 'text-kubo-textGrey'}`}
        >
          <MapPin className="w-6 h-6" />
          <span className={`text-xs mt-1 font-body ${activeTab === 'map' ? 'font-medium' : ''}`}>Map</span>
        </button>
        <button 
          onClick={() => {
            setActiveTab('bookings')
            setProfileActiveSection('overview')
          }}
          className={`flex flex-col items-center transition-colors ${activeTab === 'bookings' ? 'text-kubo-primary' : 'text-kubo-textGrey'}`}
        >
          <Shield className="w-6 h-6" />
          <span className={`text-xs mt-1 font-body ${activeTab === 'bookings' ? 'font-medium' : ''}`}>Bookings</span>
        </button>
        <button 
          onClick={() => setActiveTab('scan')}
          className="flex flex-col items-center -mt-8"
        >
          <div className="bg-kubo-primary p-4 rounded-full shadow-xl">
            <QrCode className="w-8 h-8 text-black" />
          </div>
          <span className="text-xs mt-1 text-kubo-primary font-medium font-body">Scan</span>
        </button>
        <button 
          onClick={() => {
            setActiveTab('help')
            setProfileActiveSection('overview')
          }}
          className={`flex flex-col items-center transition-colors ${activeTab === 'help' ? 'text-kubo-primary' : 'text-kubo-textGrey'}`}
        >
          <LifeBuoy className="w-6 h-6" />
          <span className={`text-xs mt-1 font-body ${activeTab === 'help' ? 'font-medium' : ''}`}>Help</span>
        </button>
        <button 
          onClick={() => {
            setActiveTab('profile')
            setProfileActiveSection('overview')
          }}
          className={`flex flex-col items-center transition-colors ${activeTab === 'profile' ? 'text-kubo-primary' : 'text-kubo-textGrey'}`}
        >
          <User className="w-6 h-6" />
          <span className={`text-xs mt-1 font-body ${activeTab === 'profile' ? 'font-medium' : ''}`}>Profile</span>
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

      {/* Detailed Active Session Modal */}
      {showDetailedSession && selectedSession && (
        <DetailedActiveSession
          session={{
            id: selectedSession.id,
            booth_name: selectedSession.booth_name,
            booth_address: selectedSession.booth_address,
            start_time: selectedSession.start_time,
            plan_type: 'pay_per_minute', // Default for now
            max_duration_minutes: 60, // Default for now
            cost_per_minute: 0.50 // Default for now
          }}
          onEndSession={handleEndSession}
          onClose={handleCloseDetailedSession}
        />
      )}
    </div>
  )
}


