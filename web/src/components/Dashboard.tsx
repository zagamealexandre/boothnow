"use client";

import { useState, useRef, useEffect, useCallback } from 'react'
import { SignOutButton, useAuth } from '@clerk/nextjs'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Autocomplete } from '@react-google-maps/api'
import { MapPin, Clock, Wifi, Shield, LocateFixed, Search, X, Settings, Bell, Users, QrCode, User, Ticket, LifeBuoy } from 'lucide-react'
import Link from 'next/link'

const defaultMapContainerStyle = {
  width: '100%',
  height: '100%',
}

const center = {
  lat: 59.3293, // Stockholm
  lng: 18.0686,
}

const libraries: ('places')[] = ['places']

interface Booth {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  opening_hours?: {
    open_now: boolean
    weekday_text: string[]
  }
  url?: string
  boothnow_enabled: boolean
  availability: boolean
  distance?: number
}

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

export default function Dashboard() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [booths, setBooths] = useState<Booth[]>([])
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null)
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null)
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const [filterAvailable, setFilterAvailable] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('map')
  const [cameraActive, setCameraActive] = useState(false)
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { userId } = useAuth()

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

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setUserLocation(userLoc)
          map.panTo(userLoc)
          map.setZoom(14)
        },
        () => {
          console.log('Geolocation failed, using default center.')
        }
      )
    }
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      fetchNearbyBooths()
    }
  }, [isLoaded])

  const fetchNearbyBooths = async (location = center) => {
    setLoading(true)
    
    // Use mock data for now since Google Places API might not be working
    const mockBooths: Booth[] = [
      {
        place_id: "1",
        name: "7-Eleven Stockholm Central",
        formatted_address: "Storgatan 1, Stockholm",
        geometry: {
          location: {
            lat: 59.3293,
            lng: 18.0686,
          },
        },
        boothnow_enabled: true,
        availability: true,
      },
      {
        place_id: "2", 
        name: "7-Eleven Gamla Stan",
        formatted_address: "Västerlånggatan 1, Stockholm",
        geometry: {
          location: {
            lat: 59.3251,
            lng: 18.0719,
          },
        },
        boothnow_enabled: true,
        availability: false,
      },
      {
        place_id: "3",
        name: "7-Eleven Södermalm", 
        formatted_address: "Götgatan 1, Stockholm",
        geometry: {
          location: {
            lat: 59.3109,
            lng: 18.0752,
          },
        },
        boothnow_enabled: false,
        availability: false,
      },
      {
        place_id: "4",
        name: "7-Eleven Östermalm",
        formatted_address: "Sturegatan 1, Stockholm", 
        geometry: {
          location: {
            lat: 59.3398,
            lng: 18.0744,
          },
        },
        boothnow_enabled: true,
        availability: true,
      },
    ]

    // Calculate distance if user location is available
    if (userLocation && google.maps.geometry) {
      mockBooths.forEach(booth => {
        const userLatLng = new google.maps.LatLng(userLocation.lat, userLocation.lng);
        const boothLatLng = new google.maps.LatLng(booth.geometry.location.lat, booth.geometry.location.lng);
        booth.distance = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, boothLatLng);
      });
    }

    setBooths(mockBooths)
    setLoading(false)
  }

  const handleMarkerClick = useCallback(async (booth: Booth) => {
    if (!map) return

    setSelectedBooth(booth)

    // Fetch Place Details for richer info
    const service = new google.maps.places.PlacesService(map)
    service.getDetails(
      {
        placeId: booth.place_id,
        fields: ['name', 'formatted_address', 'opening_hours', 'url', 'geometry'],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          setSelectedBooth((prev) => ({
            ...prev!,
            name: place.name!,
            formatted_address: place.formatted_address!,
            geometry: {
              location: {
                lat: place.geometry?.location?.lat()!,
                lng: place.geometry?.location?.lng()!,
              },
            },
            opening_hours: place.opening_hours ? {
              open_now: place.opening_hours.open_now || false,
              weekday_text: place.opening_hours.weekday_text || []
            } : undefined,
            url: place.url || undefined,
          }))
        } else {
          console.error('Place Details request failed:', status)
        }
      }
    )
  }, [map])

  const handleRecenter = () => {
    if (map && userLocation) {
      map.panTo(userLocation)
      map.setZoom(14)
    } else if (map) {
      map.panTo(center)
      map.setZoom(13)
    }
  }

  const onAutocompleteLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance)
  }, [])

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace()
      if (place.geometry?.location) {
        map?.panTo(place.geometry.location)
        map?.setZoom(14)
        fetchNearbyBooths({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        })
      } else {
        console.log('Place has no geometry')
      }
    }
  }

  const filteredBooths = filterAvailable ? booths.filter(b => b.boothnow_enabled && b.availability) : booths

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

  if (!isLoaded) {
  return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E6A9C] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

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

      {/* Mobile Content - Full Screen */}
      <div className="md:hidden fixed inset-0 z-0">
        {/* Map Tab */}
        {activeTab === 'map' && (
          <>
          <GoogleMap
          mapContainerStyle={defaultMapContainerStyle}
          center={userLocation || center}
          zoom={userLocation ? 14 : 13}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            styles: mapStyles,
            disableDefaultUI: true,
            zoomControl: true,
          }}
        >
          {filteredBooths.map((booth) => (
            <Marker
              key={booth.place_id}
              position={{ lat: booth.geometry.location.lat, lng: booth.geometry.location.lng }}
              onClick={() => handleMarkerClick(booth)}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="26" height="26" rx="6" fill="${booth.boothnow_enabled && booth.availability ? '#2E6A9C' : '#A3A3A3'}" stroke="white" stroke-width="2"/>
                    <circle cx="15" cy="15" r="4" fill="white"/>
                  </svg>
                `)}`,
                scaledSize: new google.maps.Size(30, 30),
                anchor: new google.maps.Point(15, 15),
              }}
            />
          ))}

          {selectedBooth && (
            <InfoWindow
              position={{ lat: selectedBooth.geometry.location.lat, lng: selectedBooth.geometry.location.lng }}
              onCloseClick={() => setSelectedBooth(null)}
            >
              <div className="p-4 max-w-xs font-inter">
                <h3 className="font-semibold text-[#1A1A1A] text-lg mb-1">{selectedBooth.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{selectedBooth.formatted_address}</p>

                {userLocation && selectedBooth.distance !== undefined && (
                  <p className="text-xs text-gray-500 mb-2">{Math.round(selectedBooth.distance / 100) / 10} km away</p>
                )}

                <div className="flex items-center space-x-2 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedBooth.boothnow_enabled && selectedBooth.availability ? '#2E6A9C' : '#A3A3A3' }}
                  />
                  <span className="text-sm font-medium text-[#1A1A1A]">
                    {!selectedBooth.boothnow_enabled
                      ? 'BoothNow not available'
                      : selectedBooth.availability
                        ? 'Available now'
                        : 'Currently occupied'
                    }
                  </span>
                </div>

                {selectedBooth.opening_hours && (
                  <div className="text-xs text-gray-700 mb-3">
                    <p className="font-medium">Hours:</p>
                    {selectedBooth.opening_hours.weekday_text.map((text, i) => (
                      <p key={i}>{text}</p>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button className="flex-1 bg-[#2E6A9C] hover:bg-[#244E73] text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm">
                    Book this booth
                  </button>
                  {selectedBooth.url && (
                    <a
                      href={selectedBooth.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center border border-[#E0E0E0] text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-md shadow-sm"
                    >
                      Open in map
                    </a>
                  )}
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Right Action Rail - Mobile Only */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col space-y-3 z-10">
          <button className="p-3 bg-white rounded-full shadow-md">
            <LocateFixed className="w-6 h-6 text-gray-700" />
          </button>
          <button className="p-3 bg-white rounded-full shadow-md relative">
            <Search className="w-6 h-6 text-gray-700" />
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full" />
          </button>
          <button className="p-3 bg-white rounded-full shadow-md">
            <Shield className="w-6 h-6 text-gray-700" />
          </button>
          <button className="p-3 bg-white rounded-full shadow-md">
            <LifeBuoy className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Find Nearby Booths Button - Mobile Only */}
        <button className="absolute bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 bg-white rounded-full shadow-lg flex items-center space-x-2 z-10">
          <MapPin className="w-5 h-5 text-gray-700" />
          <span className="text-gray-800 font-medium">Find nearby booths</span>
        </button>
          </>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="h-full bg-white p-6 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Sessions</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">7-Eleven Stockholm Central</h3>
                    <p className="text-sm text-gray-600">Storgatan 1, Stockholm</p>
                    <p className="text-xs text-gray-500 mt-1">Yesterday, 2:30 PM - 3:15 PM</p>
                  </div>
                  <span className="text-sm font-medium text-green-600">45 min</span>
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
                    €22.50
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">7-Eleven Gamla Stan</h3>
                    <p className="text-sm text-gray-600">Västerlånggatan 1, Stockholm</p>
                    <p className="text-xs text-gray-500 mt-1">Monday, 10:15 AM - 11:00 AM</p>
                  </div>
                  <span className="text-sm font-medium text-green-600">45 min</span>
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
                    €22.50
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="h-full bg-white p-6 overflow-y-auto">
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
          <div className="h-full bg-black flex flex-col items-center justify-center p-6">
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
          <div className="h-full bg-white p-6 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile</h2>
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Account Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="text-gray-900">Alexandre Zagame</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="text-gray-900">alex@example.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member since:</span>
                    <span className="text-gray-900">October 2024</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Usage Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total sessions:</span>
                    <span className="text-gray-900">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total time:</span>
                    <span className="text-gray-900">9h 15m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total spent:</span>
                    <span className="text-gray-900">€270.00</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <button className="w-full bg-gray-100 text-gray-700 text-sm font-medium px-4 py-3 rounded-lg">
                  Payment Methods
                </button>
                <button className="w-full bg-gray-100 text-gray-700 text-sm font-medium px-4 py-3 rounded-lg">
                  Notifications
                </button>
                <button className="w-full bg-gray-100 text-gray-700 text-sm font-medium px-4 py-3 rounded-lg">
                  Help & Support
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Map Card */}
      <div className="hidden md:block mx-auto max-w-6xl px-6 py-6">
        <div className="mb-8 overflow-hidden rounded-2xl border border-[#E0E0E0] bg-white shadow-sm">
          <div className="h-[60vh] w-full">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={userLocation || center}
              zoom={userLocation ? 14 : 13}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                styles: mapStyles,
                disableDefaultUI: true,
                zoomControl: true,
              }}
            >
              {filteredBooths.map((booth) => (
                <Marker
                  key={booth.place_id}
                  position={{ lat: booth.geometry.location.lat, lng: booth.geometry.location.lng }}
                  onClick={() => handleMarkerClick(booth)}
                  icon={{
                    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="2" width="26" height="26" rx="6" fill="${booth.boothnow_enabled && booth.availability ? '#2E6A9C' : '#A3A3A3'}" stroke="white" stroke-width="2"/>
                        <circle cx="15" cy="15" r="4" fill="white"/>
                      </svg>
                    `)}`,
                    scaledSize: new google.maps.Size(30, 30),
                    anchor: new google.maps.Point(15, 15),
                  }}
                />
              ))}

              {selectedBooth && (
                <InfoWindow
                  position={{ lat: selectedBooth.geometry.location.lat, lng: selectedBooth.geometry.location.lng }}
                  onCloseClick={() => setSelectedBooth(null)}
                >
                  <div className="p-4 max-w-xs font-inter">
                    <h3 className="font-semibold text-[#1A1A1A] text-lg mb-1">{selectedBooth.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{selectedBooth.formatted_address}</p>

                    {userLocation && selectedBooth.distance !== undefined && (
                      <p className="text-xs text-gray-500 mb-2">{Math.round(selectedBooth.distance / 100) / 10} km away</p>
                    )}

                    <div className="flex items-center space-x-2 mb-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedBooth.boothnow_enabled && selectedBooth.availability ? '#2E6A9C' : '#A3A3A3' }}
                      />
                      <span className="text-sm font-medium text-[#1A1A1A]">
                        {!selectedBooth.boothnow_enabled
                          ? 'BoothNow not available'
                          : selectedBooth.availability
                            ? 'Available now'
                            : 'Currently occupied'
                        }
                      </span>
                    </div>

                    {selectedBooth.opening_hours && (
                      <div className="text-xs text-gray-700 mb-3">
                        <p className="font-medium">Hours:</p>
                        {selectedBooth.opening_hours.weekday_text.map((text, i) => (
                          <p key={i}>{text}</p>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 bg-[#2E6A9C] hover:bg-[#244E73] text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm">
                        Book this booth
                      </button>
                      {selectedBooth.url && (
                        <a
                          href={selectedBooth.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center border border-[#E0E0E0] text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-md shadow-sm"
                        >
                          Open in map
                        </a>
                      )}
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </div>
        </div>

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
          onClick={() => setActiveTab('sessions')}
          className={`flex flex-col items-center transition-colors ${activeTab === 'sessions' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <Clock className="w-6 h-6" />
          <span className={`text-xs mt-1 ${activeTab === 'sessions' ? 'font-medium' : ''}`}>Sessions</span>
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
          onClick={() => setActiveTab('bookings')}
          className={`flex flex-col items-center transition-colors ${activeTab === 'bookings' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <Shield className="w-6 h-6" />
          <span className={`text-xs mt-1 ${activeTab === 'bookings' ? 'font-medium' : ''}`}>Bookings</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <User className="w-6 h-6" />
          <span className={`text-xs mt-1 ${activeTab === 'profile' ? 'font-medium' : ''}`}>Profile</span>
        </button>
      </nav>
    </div>
  )
}


