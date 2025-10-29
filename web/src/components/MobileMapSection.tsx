"use client";

import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { boothService, Booth } from '../services/boothService'
import BoothInfoCard from './ui/booth-info-card'
import QRCodeReader from './QRCodeReader'
import PreBookingScheduler from './PreBookingScheduler'
import { useBoothActions, EnhancedBooth } from '../hooks/useBoothActions'

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
      return { 
        label: `Reserved until ${next?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`, 
        sub: 'Next slot available afterward', 
        color: 'red',
        bgColor: '#FCE8E6',
        textColor: '#E74C3C'
      }
    case 'maintenance':
      return { 
        label: 'Under maintenance', 
        sub: 'Temporarily unavailable', 
        color: 'gray',
        bgColor: '#F3F4F6',
        textColor: '#6B7280'
      }
    default:
      return { 
        label: 'Status unknown', 
        sub: 'Check availability', 
        color: 'blue',
        bgColor: '#EFF6FF',
        textColor: '#2563EB'
      }
  }
}

export default function MobileMapSection({ userId }: { userId?: string } = {}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const [booths, setBooths] = useState<EnhancedBooth[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)
  
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

  // Mock booths data as fallback
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
  ]

  // Load booths and set up real-time updates
  useEffect(() => {
    const loadBooths = async () => {
      try {
        setIsLoading(true)
        const fetchedBooths = await boothService.fetchBooths()
        setBooths(fetchedBooths.length > 0 ? fetchedBooths : mockBooths)
      } catch (error) {
        console.error('❌ MobileMapSection: Error loading booths:', error)
        console.error('❌ MobileMapSection: SUPABASE NOT CONFIGURED!')
        console.error('❌ MobileMapSection: Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file')
        setBooths(mockBooths)
      } finally {
        setIsLoading(false)
      }
    }

    loadBooths()

    // Subscribe to real-time updates
    const unsubscribe = boothService.subscribeToBoothUpdates((updatedBooths) => {
      setBooths(updatedBooths.length > 0 ? updatedBooths : mockBooths)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Helper functions for booth rendering
  const getBoothIcon = (status: string) => {
    const colors = {
      available: '#2ECC71', // Green
      busy: '#F1C40F',      // Yellow
      prebooked: '#E74C3C', // Red
      maintenance: '#95A5A6' // Gray
    }

    const color = colors[status as keyof typeof colors] || '#2E6A9C'

    // Use simple circle markers for better visibility
    return {
      url: 'data:image/svg+xml;utf8,' +
        encodeURIComponent(
          `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="4"/>
          </svg>`
        ),
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 16),
    }
  }

  const renderBoothCard = (booth: EnhancedBooth) => {
    const infoWindowContent = document.createElement('div')
    const root = createRoot(infoWindowContent)

    root.render(
      <BoothInfoCard
        booth={booth}
        userLocation={userLocation}
        handleBoothAction={(boothId, action) => handleBoothAction(boothId, action, booths, setBooths)}
        dist={dist}
      />
    )

    return infoWindowContent
  }

  const dist = (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) => {
    const R = 6371000
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180
    const dLng = ((p2.lng - p1.lng) * Math.PI) / 180
    const la1 = (p1.lat * Math.PI) / 180
    const la2 = (p2.lat * Math.PI) / 180
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  }


  // Make handleBoothAction globally available
  useEffect(() => {
    ;(window as any).handleBoothAction = (boothId: string, action: string) => handleBoothAction(boothId, action, booths, setBooths)
  }, [booths])

  // Effect to add markers when booths change and map is ready
  useEffect(() => {
    if (mapReady && mapInstanceRef.current && booths.length > 0) {
      
      // Clear existing markers
      if ((window as any).boothMarkers) {
        (window as any).boothMarkers.forEach((marker: google.maps.Marker) => marker.setMap(null))
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
      
      booths.forEach((booth) => {
        const marker = new google.maps.Marker({
          position: { lat: booth.lat, lng: booth.lng },
          map: mapInstanceRef.current,
          title: booth.name,
          icon: getBoothIcon(booth.status),
          animation: google.maps.Animation.DROP,
        })

        marker.addListener('click', () => {
          // Close any existing info window first
          if ((window as any).currentInfoWindow) {
            (window as any).currentInfoWindow.close()
          }
          
          // Create new info window with increased height
          const info = new google.maps.InfoWindow({
            content: renderBoothCard(booth),
            ariaLabel: 'Booth details',
            maxWidth: 300,
            pixelOffset: new google.maps.Size(0, -10)
          })
          
          // Store reference and open
          ;(window as any).currentInfoWindow = info
          info.open({ map: mapInstanceRef.current, anchor: marker })
        })

        markers.push(marker)
      })
      
      // Add click outside listener
      addClickOutsideListener()
      
      ;(window as any).boothMarkers = markers
    } else if (!mapReady) {
    } else if (!booths.length) {
    }
  }, [booths, userLocation, mapReady])

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
      ;(window as any).mapInstanceRef = mapInstanceRef
      map.setOptions({ 
        zoomControl: false, // Disable default zoom controls
        fullscreenControl: false, 
        mapTypeControl: false, 
        streetViewControl: false 
      })
      
      // Center map on Stockholm and set appropriate zoom
      map.setCenter({ lat: 59.334591, lng: 18.06324 })
      map.setZoom(13)
      
      // Add custom CSS to remove InfoWindow default styling and fix height issues
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
          max-height: none !important;
        }
        .gm-style-iw-c {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          max-height: none !important;
          overflow: visible !important;
        }
        .gm-style-iw-tc {
          display: none !important;
        }
      `
      document.head.appendChild(style)

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

      ;(window as any).recenterMap = locate
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
  }, [])

  // Reset map ready state when component unmounts
  useEffect(() => {
    return () => {
      setMapReady(false)
    }
  }, [])

  return (
    <div className="h-full w-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2E6A9C] border-t-transparent"></div>
            <span className="text-[#666] font-medium">Loading booth availability...</span>
          </div>
        </div>
      )}
      
      <div ref={mapRef} className="h-full w-full" />
      
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
    </div>
  )
}
