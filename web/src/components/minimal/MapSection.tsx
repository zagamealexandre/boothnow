"use client";

import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { boothService, Booth } from '../../services/boothService'
import BoothInfoCard from '../ui/booth-info-card'
import QRCodeReader from '../QRCodeReader'
import PreBookingScheduler from '../PreBookingScheduler'
import { useBoothActions, EnhancedBooth } from '../../hooks/useBoothActions'

// Re-export the interface for backward compatibility
export type { EnhancedBooth }

// Helper function to format booth status with readable messages
function formatBoothStatus(booth: EnhancedBooth) {
  const now = new Date()
  const next = booth.next_available_at ? new Date(booth.next_available_at) : null
  const freeUntil = booth.freeUntil ? new Date(booth.freeUntil) : null
  const diffMin = next ? Math.max(0, Math.ceil((next.getTime() - now.getTime()) / 60000)) : 0
  
  switch (booth.status) {
    case 'available':
      return { 
        label: 'Available now', 
        sub: `Free for ${booth.slotLengthMinutes || 45} min`, 
        color: 'green',
        bgColor: '#E6F4EA',
        textColor: '#27AE60'
      }
    case 'busy':
      return { 
        label: `Busy, free in ${diffMin} min`, 
        sub: `Available again at ${next?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`, 
        color: 'yellow',
        bgColor: '#FEF3C7',
        textColor: '#F1C40F'
      }
    case 'prebooked':
      if (next) {
        const bookingStart = new Date(next);
        const warningStart = new Date(bookingStart.getTime() - 60 * 60000); // 1 hour before booking
        const reservationStart = new Date(bookingStart.getTime() - 30 * 60000); // 30 minutes before booking
        const timeUntilReservation = Math.ceil((reservationStart.getTime() - now.getTime()) / 60000);
        
        // Show as reserved if we're within 30 minutes of booking start
        if (now >= reservationStart) {
          return { 
            label: `Reserved until ${bookingStart.toLocaleTimeString('sv-SE', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}`, 
            sub: 'Next slot available afterward', 
            color: 'red',
            bgColor: '#FCE8E6',
            textColor: '#E74C3C'
          }
        } 
        // Show warning if we're within 1 hour of booking start
        else if (now >= warningStart) {
          return { 
            label: `Available for ${timeUntilReservation} min`, 
            sub: `Reserved at ${bookingStart.toLocaleTimeString('sv-SE', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}`, 
            color: 'green',
            bgColor: '#E6F4EA',
            textColor: '#27AE60'
          }
        }
        // If more than 1 hour away, treat as available
        else {
          return { 
            label: 'Available now', 
            sub: `Free for ${booth.slotLengthMinutes || 45} min`, 
            color: 'green',
            bgColor: '#E6F4EA',
            textColor: '#27AE60'
          }
        }
      }
      // If no next booking, treat as available
      return { 
        label: 'Available now', 
        sub: `Free for ${booth.slotLengthMinutes || 45} min`, 
        color: 'green',
        bgColor: '#E6F4EA',
        textColor: '#27AE60'
      }
    case 'maintenance':
      return { 
        label: 'Under maintenance', 
        sub: 'Temporarily unavailable', 
        color: 'gray',
        bgColor: '#F3F4F6',
        textColor: '#BDC3C7'
      }
    default:
      return { 
        label: 'Status unknown', 
        sub: 'Check availability', 
        color: 'blue',
        bgColor: '#E6F4EA',
        textColor: '#2E6A9C'
      }
  }
}

// Enhanced BoothNow Map with live status indicators and booking interface
export function MapSection({ userId, filterStatus = 'all', compact = false, hideHeader = false }: { userId?: string, filterStatus?: string, compact?: boolean, hideHeader?: boolean } = {}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>(filterStatus)
  const [booths, setBooths] = useState<EnhancedBooth[]>([])
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)
  
  // Status-based booth icons with colors and animations
  const getBoothIcon = (booth: EnhancedBooth, isPulsing: boolean = false) => {
    const now = new Date()
    const next = booth.next_available_at ? new Date(booth.next_available_at) : null
    
    // Determine actual status color based on prebooked logic
    let actualColor = '#27AE60' // Default green
    let actualIcon = 'circle'
    
    if (booth.status === 'prebooked' && next) {
      const bookingStart = new Date(next);
      const warningStart = new Date(bookingStart.getTime() - 60 * 60000); // 1 hour before booking
      const reservationStart = new Date(bookingStart.getTime() - 30 * 60000); // 30 minutes before booking
      
      if (now >= reservationStart) {
        // Within 30 minutes - red (actually reserved)
        actualColor = '#E74C3C'
        actualIcon = 'lock'
      } else if (now >= warningStart) {
        // Within 1 hour - green (available with warning)
        actualColor = '#27AE60'
        actualIcon = 'circle'
      } else {
        // More than 1 hour - green (available)
        actualColor = '#27AE60'
        actualIcon = 'circle'
      }
    } else {
      // Use standard colors for other statuses
      const colors = {
        available: '#27AE60', // Green (BoothNow brand)
        busy: '#F1C40F',      // Yellow
        maintenance: '#BDC3C7' // Gray
      }
      const icons = {
        available: 'circle',
        busy: 'clock',
        maintenance: 'wrench'
      }
      actualColor = colors[booth.status as keyof typeof colors] || '#2E6A9C'
      actualIcon = icons[booth.status as keyof typeof icons] || 'help-circle'
    }
    
    const opacity = booth.status === 'maintenance' ? '0.6' : '1'
    
    // Add pulsing animation for available booths
    const pulseAnimation = isPulsing && actualIcon === 'circle' ? `
      <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite"/>
    ` : ''

    return {
      url: 'data:image/svg+xml;utf8,' +
        encodeURIComponent(
          `<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
              </filter>
            </defs>
            <g opacity="${opacity}">
              <rect x="8" y="6" width="16" height="26" rx="4" fill="${actualColor}" stroke="white" stroke-width="3" filter="url(#shadow)">
                ${pulseAnimation}
              </rect>
              <circle cx="16" cy="36" r="4" fill="${actualColor}" stroke="white" stroke-width="3">
                ${pulseAnimation}
              </circle>
              <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-family="Arial">${actualIcon === 'circle' ? '●' : actualIcon === 'clock' ? '🕐' : actualIcon === 'lock' ? '🔒' : '🔧'}</text>
            </g>
          </svg>`
        ),
      scaledSize: new google.maps.Size(32, 40),
      anchor: new google.maps.Point(16, 40),
    }
  }

  // Enhanced info card renderer using React component
  const renderBoothCard = (booth: EnhancedBooth) => {
    const infoWindowContent = document.createElement('div')
    const root = createRoot(infoWindowContent)

    root.render(
      <BoothInfoCard
        booth={booth}
        userLocation={userLocation}
        handleBoothAction={(boothId, action) => handleBoothAction(boothId, action, booths, setBooths)}
        dist={(a: google.maps.LatLngLiteral, b: google.maps.LatLngLiteral) => {
          const R = 6371000
          const dLat = ((b.lat - a.lat) * Math.PI) / 180
          const dLon = ((b.lng - a.lng) * Math.PI) / 180
          const a1 = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
          const c = 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1 - a1))
          return R * c
        }}
      />
    )

    return infoWindowContent
  }
  
  // Use the shared booth actions hook
  const {
    showQRReader,
    showScheduler,
    currentBoothId,
    currentBoothName,
    handleBoothAction,
    closeQRReader,
    closeScheduler
  } = useBoothActions()

  // Enhanced booth data model with time-based information - All 7-Eleven locations
  const mockBooths: EnhancedBooth[] = [
    {
      id: '1',
      partner: '7-Eleven',
      name: '7-Eleven Sveavägen',
      address: 'Sveavägen 55, 113 59 Stockholm, Sweden',
      lat: 59.3423,
      lng: 18.0554,
      status: 'available',
      next_available_at: null,
      timeRemaining: null,
      slotLengthMinutes: 45,
      freeUntil: new Date(Date.now() + 45 * 60000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      partner: '7-Eleven',
      name: '7-Eleven Odenplan',
      address: 'Odengatan 72, 113 22 Stockholm, Sweden',
      lat: 59.3428,
      lng: 18.0492,
      status: 'busy',
      next_available_at: new Date(Date.now() + 22 * 60000).toISOString(),
      timeRemaining: 22,
      slotLengthMinutes: 45,
      freeUntil: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      partner: '7-Eleven',
      name: '7-Eleven T-Centralen',
      address: 'Vasagatan 10, 111 20 Stockholm, Sweden',
      lat: 59.3322,
      lng: 18.0628,
      status: 'prebooked',
      next_available_at: new Date(Date.now() + 45 * 60000).toISOString(),
      timeRemaining: null,
      slotLengthMinutes: 45,
      freeUntil: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '4',
      partner: '7-Eleven',
      name: '7-Eleven Stureplan',
      address: 'Sturegatan 8, 114 35 Stockholm, Sweden',
      lat: 59.3384,
      lng: 18.0734,
      status: 'maintenance',
      next_available_at: new Date(Date.now() + 120 * 60000).toISOString(),
      timeRemaining: null,
      slotLengthMinutes: 45,
      freeUntil: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '5',
      partner: '7-Eleven',
      name: '7-Eleven Gamla Stan',
      address: 'Västerlånggatan 1, 111 29 Stockholm, Sweden',
      lat: 59.3258,
      lng: 18.0703,
      status: 'available',
      next_available_at: null,
      timeRemaining: null,
      slotLengthMinutes: 45,
      freeUntil: new Date(Date.now() + 30 * 60000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '6',
      partner: '7-Eleven',
      name: '7-Eleven Södermalm',
      address: 'Götgatan 12, 118 46 Stockholm, Sweden',
      lat: 59.3158,
      lng: 18.0712,
      status: 'busy',
      next_available_at: new Date(Date.now() + 15 * 60000).toISOString(),
      timeRemaining: 15,
      slotLengthMinutes: 45,
      freeUntil: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '7',
      partner: '7-Eleven',
      name: '7-Eleven Kungsholmen',
      address: 'Fleminggatan 10, 112 26 Stockholm, Sweden',
      lat: 59.3309,
      lng: 18.0487,
      status: 'available',
      next_available_at: null,
      timeRemaining: null,
      slotLengthMinutes: 45,
      freeUntil: new Date(Date.now() + 60 * 60000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '8',
      partner: '7-Eleven',
      name: '7-Eleven Östermalm',
      address: 'Sturegatan 20, 114 36 Stockholm, Sweden',
      lat: 59.3392,
      lng: 18.0745,
      status: 'prebooked',
      next_available_at: new Date(Date.now() + 90 * 60000).toISOString(),
      timeRemaining: null,
      slotLengthMinutes: 45,
      freeUntil: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '9',
      partner: '7-Eleven',
      name: '7-Eleven Vasastan',
      address: 'Sveavägen 25, 111 34 Stockholm, Sweden',
      lat: 59.3401,
      lng: 18.0589,
      status: 'busy',
      next_available_at: new Date(Date.now() + 35 * 60000).toISOString(),
      timeRemaining: 35,
      slotLengthMinutes: 45,
      freeUntil: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '10',
      partner: '7-Eleven',
      name: '7-Eleven Hornstull',
      address: 'Hornsgatan 100, 117 26 Stockholm, Sweden',
      lat: 59.3198,
      lng: 18.0567,
      status: 'available',
      next_available_at: null,
      timeRemaining: null,
      slotLengthMinutes: 45,
      freeUntil: new Date(Date.now() + 25 * 60000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '11',
      partner: '7-Eleven',
      name: '7-Eleven Fridhemsplan',
      address: 'Fridhemsplan 2, 112 40 Stockholm, Sweden',
      lat: 59.3315,
      lng: 18.0412,
      status: 'maintenance',
      next_available_at: new Date(Date.now() + 180 * 60000).toISOString(),
      timeRemaining: null,
      slotLengthMinutes: 45,
      freeUntil: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '12',
      partner: '7-Eleven',
      name: '7-Eleven Slussen',
      address: 'Götgatan 1, 118 30 Stockholm, Sweden',
      lat: 59.3194,
      lng: 18.0715,
      status: 'busy',
      next_available_at: new Date(Date.now() + 8 * 60000).toISOString(),
      timeRemaining: 8,
      slotLengthMinutes: 45,
      freeUntil: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]


  // Load booths and set up real-time updates
  useEffect(() => {
    const loadBooths = async () => {
      try {
        setIsLoading(true)
        const fetchedBooths = await boothService.fetchBooths(selectedStatus)
        setBooths(fetchedBooths.length > 0 ? fetchedBooths : mockBooths)
      } catch (error) {
        console.error('Error loading booths:', error)
        setBooths(mockBooths) // Fallback to mock data
      } finally {
        setIsLoading(false)
      }
    }

    loadBooths()

    // Subscribe to real-time updates
    const unsubscribe = boothService.subscribeToBoothUpdates((updatedBooths) => {
      setBooths(updatedBooths)
    })

    return () => {
      unsubscribe()
    }
  }, [selectedStatus])

  // Sync status with external filter
  useEffect(() => {
    setSelectedStatus(filterStatus)
  }, [filterStatus])

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key || !mapRef.current) return

    const id = 'google-maps-js'
    const existing = document.getElementById(id) as HTMLScriptElement | null

    const init = () => {
      // @ts-ignore
      const google = (window as any).google
      if (!google || !mapRef.current) return

      // Minimal light style per Scandinavian palette
      const styledJson: any = [
        { elementType: 'geometry', stylers: [{ color: '#F5F4F2' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#A3A3A3' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#F5F4F2' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#EAEAEA' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9b9b9b' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#D9E6F2' }] },
      ]

      const stockholm = { lat: 59.334591, lng: 18.06324 }
      const map = new google.maps.Map(mapRef.current, {
        center: stockholm,
        zoom: 13,
        disableDefaultUI: true,
        styles: styledJson,
      })
      
      mapInstanceRef.current = map
      map.setOptions({ zoomControl: true, fullscreenControl: false, mapTypeControl: false, streetViewControl: false })
      
      // Mark map as ready
      setMapReady(true)

      // Compute distance in meters
      const dist = (a: google.maps.LatLngLiteral, b: google.maps.LatLngLiteral) => {
        const R = 6371000
        const dLat = ((b.lat - a.lat) * Math.PI) / 180
        const dLng = ((b.lng - a.lng) * Math.PI) / 180
        const la1 = (a.lat * Math.PI) / 180
        const la2 = (b.lat * Math.PI) / 180
        const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
        return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
      }

      // Geolocate helper
      const locate = () => {
        if (!navigator.geolocation) return
        navigator.geolocation.getCurrentPosition(
          (res) => {
            const pos = { lat: res.coords.latitude, lng: res.coords.longitude }
            setUserLocation(pos)
            map.panTo(pos)
            map.setZoom(14)
            new google.maps.Marker({
              position: pos,
              map,
              icon: {
                url: 'data:image/svg+xml;utf8,' +
                  encodeURIComponent(
                    `<svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="11" cy="11" r="8" fill="#2E6A9C" stroke="white" stroke-width="3"/>
                    </svg>`
                  ),
                scaledSize: new google.maps.Size(22, 22),
              },
              title: 'Your location',
            })
          },
          () => {}
        )
      }

      // Expose locate function globally
      ;(window as any).recenterMap = locate


      // Add custom CSS to remove InfoWindow default styling
      const style = document.createElement('style')
      style.textContent = `
        .gm-style-iw {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .gm-style-iw-d {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          overflow: visible !important;
        }
        .gm-style-iw-c {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .gm-style-iw-tc {
          display: none !important;
        }
        .gm-style-iw-d {
          max-height: none !important;
          overflow: visible !important;
        }
        .gm-style-iw-c {
          max-height: none !important;
          overflow: visible !important;
        }
      `
      document.head.appendChild(style)

      const info = new google.maps.InfoWindow({
        content: '',
        ariaLabel: 'Booth details',
        disableAutoPan: false,
        maxWidth: 300,
        pixelOffset: new google.maps.Size(0, -10)
      })

      // Make handleBoothAction globally accessible for the React component
      ;(window as any).handleBoothAction = (boothId: string, action: string) => handleBoothAction(boothId, action, booths, setBooths)

      // Markers will be added by the separate effect when map is ready
    }

    if (existing) {
      if ((window as any).google?.maps) init()
      else existing.addEventListener('load', init, { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = id
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&v=weekly`
    script.async = true
    script.defer = true
    script.addEventListener('load', init, { once: true })
    document.head.appendChild(script)
  }, [booths, selectedStatus, userLocation])

  // Effect to add markers when map becomes ready and booths are available
  useEffect(() => {
    // Only proceed if all conditions are met
    if (!mapReady || !mapInstanceRef.current || booths.length === 0) {
      return
    }

    // Use a timeout to ensure map is fully ready
    const renderMarkers = () => {
      if (!mapInstanceRef.current) {
        setTimeout(renderMarkers, 100)
        return
      }
      
      // Clear existing markers safely
      if ((window as any).desktopBoothMarkers) {
        (window as any).desktopBoothMarkers.forEach((marker: google.maps.Marker) => {
          if (marker && marker.setMap) {
            marker.setMap(null)
          }
        })
      }
      
      // Add click-outside-to-close functionality for InfoWindow
      const addClickOutsideListener = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.addListener('click', () => {
            if ((window as any).currentInfoWindow) {
              (window as any).currentInfoWindow.close()
            }
          })
        }
      }
      
      // Add new markers
      const markers: google.maps.Marker[] = []
      
      // Filter booths based on selected status
      const filteredBooths = selectedStatus === 'all' 
        ? booths 
        : booths.filter(booth => booth.status === selectedStatus)
      
      filteredBooths.forEach((booth) => {
        try {
          // Check if booth is almost available (within 10 minutes)
          const isAlmostAvailable = booth.status === 'busy' && booth.timeRemaining && booth.timeRemaining <= 10
          const isPulsing = booth.status === 'available' || isAlmostAvailable
          
          const marker = new google.maps.Marker({
            position: { lat: booth.lat, lng: booth.lng },
            map: mapInstanceRef.current,
            title: booth.name,
            icon: getBoothIcon(booth, isPulsing),
            animation: google.maps.Animation.DROP,
          })

          marker.addListener('click', () => {
            // Close any existing info window first
            if ((window as any).currentInfoWindow) {
              (window as any).currentInfoWindow.close()
            }
            
            // Add click animation
            marker.setAnimation(google.maps.Animation.BOUNCE)
            setTimeout(() => marker.setAnimation(null), 600)
            
            // Create new info window
            const info = new google.maps.InfoWindow({
              content: renderBoothCard(booth),
              ariaLabel: 'Booth details',
              maxWidth: 300,
              pixelOffset: new google.maps.Size(0, -10),
              disableAutoPan: false
            })
            
            // Store reference and open
            ;(window as any).currentInfoWindow = info
            info.open({ map: mapInstanceRef.current, anchor: marker })
          })

          // Add hover effect with enhanced animation
          marker.addListener('mouseover', () => {
            marker.setAnimation(google.maps.Animation.BOUNCE)
            setTimeout(() => marker.setAnimation(null), 1000)
          })

          markers.push(marker)
        } catch (error) {
          // Error creating marker for booth
        }
      })
      
      // Add click outside listener
      addClickOutsideListener()
      
      // Store markers with desktop-specific key to avoid conflicts
      ;(window as any).desktopBoothMarkers = markers
    }
    
    // Start rendering with a small delay to ensure map is ready
    setTimeout(renderMarkers, 50)
  }, [mapReady, booths, selectedStatus]) // Removed userLocation from dependencies

  // Handle visibility change to refresh markers when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && mapReady && mapInstanceRef.current && booths.length > 0) {
        // Force a re-render by updating the booths state
        setBooths(prevBooths => [...prevBooths])
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [mapReady, booths.length])

  // Cleanup effect for markers when component unmounts
  useEffect(() => {
    return () => {
      // Clean up markers when component unmounts
      if ((window as any).desktopBoothMarkers) {
        (window as any).desktopBoothMarkers.forEach((marker: google.maps.Marker) => {
          if (marker && marker.setMap) {
            marker.setMap(null)
          }
        })
        ;(window as any).desktopBoothMarkers = []
      }
      
      // Clean up info window
      if ((window as any).currentInfoWindow) {
        (window as any).currentInfoWindow.close()
        ;(window as any).currentInfoWindow = null
      }
    }
  }, [])

  // Auto-refresh booth status every 60 seconds with enhanced animations
  useEffect(() => {
    const interval = setInterval(() => {
      setBooths(prevBooths => 
        prevBooths.map(booth => {
          if (booth.status === 'busy' && booth.timeRemaining && booth.timeRemaining > 0) {
            const newTimeRemaining = booth.timeRemaining - 1
            
            // If time runs out, change status to available
            if (newTimeRemaining <= 0) {
              // Trigger status change animation
              setTimeout(() => {
                if ((window as any).boothMarkers) {
                  const marker = (window as any).boothMarkers.find((m: any) => 
                    m.getTitle() === booth.name
                  )
                  if (marker) {
                    // Flash green animation for status change
                    marker.setAnimation(google.maps.Animation.BOUNCE)
                    setTimeout(() => marker.setAnimation(null), 2000)
                  }
                }
              }, 1000)
              
              return { 
                ...booth, 
                status: 'available' as const,
                timeRemaining: null,
                next_available_at: null,
                freeUntil: new Date(Date.now() + (booth.slotLengthMinutes || 45) * 60000).toISOString()
              }
            }
            
            return { ...booth, timeRemaining: newTimeRemaining }
          }
          
          // Update freeUntil for available booths
          if (booth.status === 'available' && booth.freeUntil) {
            const freeUntil = new Date(booth.freeUntil)
            const now = new Date()
            if (freeUntil <= now) {
              // Booth is no longer free, change to busy
              return {
                ...booth,
                status: 'busy' as const,
                timeRemaining: 30, // 30 minutes busy time
                next_available_at: new Date(Date.now() + 30 * 60000).toISOString(),
                freeUntil: null
              }
            }
          }
          
          return booth
        })
      )
    }, 60000) // Changed to 60 seconds

    return () => clearInterval(interval)
  }, [])

  // Add status change flash effect
  const triggerStatusChangeAnimation = (boothId: string, newStatus: string) => {
    if ((window as any).boothMarkers) {
      const marker = (window as any).boothMarkers.find((m: any) => 
        m.getTitle().includes(boothId)
      )
      if (marker) {
        // Flash animation for status changes
        marker.setAnimation(google.maps.Animation.BOUNCE)
        setTimeout(() => marker.setAnimation(null), 1500)
      }
    }
  }

  return (
    <section className={`${compact ? '' : 'bg-[#F9FAFB] py-20'}`}>
      <div className="mx-auto max-w-6xl px-6">
        {!hideHeader && (
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">
              Find a Booth That Fits Your Schedule
            </h2>
            <p className="text-lg text-[#666] max-w-2xl mx-auto font-body">
              Instant access or pre-book your preferred time. Live booth availability updated in real time.
            </p>
          </div>
        )}
        
        {/* External filtering is handled by props; tabs removed for landing */}
        
        <div className="bg-white rounded-2xl shadow-sm border border-[#E6E6E6] overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2E6A9C] border-t-transparent"></div>
                <span className="text-[#666] font-medium">Loading booth availability...</span>
              </div>
            </div>
          )}
          <div className="h-96 w-full">
            <div ref={mapRef} className="h-full w-full" />
          </div>
        </div>
        {!hideHeader && (
          <>
            {/* Enhanced Status Legend */}
            <div className="mt-6 flex justify-center">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-[#E6E6E6]">
                <div className="text-sm font-medium text-[#1A1A1A] mb-3 text-center">Booth Status</div>
                <div className="flex gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#27AE60]"></div>
                    <span className="text-[#666]">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#F1C40F]"></div>
                    <span className="text-[#666]">Busy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#E74C3C]"></div>
                    <span className="text-[#666]">Pre-booked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#BDC3C7] opacity-60"></div>
                    <span className="text-[#666]">Maintenance</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-center gap-4">
              <button 
                onClick={() => (window as any).recenterMap?.()}
                className="bg-[#2E6A9C] text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-[#1e4a6b] transition-colors"
              >
                📍 Find My Location
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="bg-white border border-[#E6E6E6] text-[#1A1A1A] px-6 py-2 rounded-full text-sm font-medium hover:bg-[#F9FAFB] transition-colors"
              >
                🏪 View All Booths
              </button>
            </div>
          </>
        )}
      </div>

      {/* Debug modal state */}
      {(() => {
        return null
      })()}
      
      {/* QR Code Reader Modal */}
      {showQRReader && currentBoothId && (
        <QRCodeReader
          isOpen={showQRReader}
          onClose={closeQRReader}
          onBookingSuccess={(reservationId) => {
            closeQRReader()
            
            // Update booth status in state
            setBooths(prevBooths => 
              prevBooths.map(booth => 
                booth.id === currentBoothId 
                  ? { ...booth, status: 'busy', timeRemaining: 60, next_available_at: new Date(Date.now() + 60 * 60000).toISOString() }
                  : booth
              )
            )
            
            // Trigger a global event to refresh bookings in Dashboard
            window.dispatchEvent(new CustomEvent('bookingUpdated', { 
              detail: { type: 'immediate', reservationId } 
            }))
            
            alert('Booth booked successfully! Your session has started.')
          }}
          boothId={currentBoothId}
          boothName={currentBoothName}
          userId={userId}
        />
      )}

      {/* Pre-booking Scheduler Modal */}
      {showScheduler && currentBoothId && (
        <PreBookingScheduler
          isOpen={showScheduler}
          onClose={closeScheduler}
          onBookingSuccess={(reservationId) => {
            closeScheduler()
            
            // Trigger a global event to refresh bookings in Dashboard
            window.dispatchEvent(new CustomEvent('bookingUpdated', { 
              detail: { type: 'prebooked', reservationId } 
            }))
            
            alert('Booth pre-booked successfully! You will receive a confirmation shortly.')
          }}
          boothId={currentBoothId}
          boothName={currentBoothName}
        />
      )}
    </section>
  )
}
