"use client";

import { useEffect, useRef } from 'react'

// BoothNow Map - branded, minimal, with Places search and custom markers
export function MapSection() {
  const mapRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

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

      // UI: add zoom and locate controls (minimal)
      map.setOptions({ zoomControl: true, fullscreenControl: false, mapTypeControl: false, streetViewControl: false })

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

      let userPos: google.maps.LatLngLiteral | null = null

      // Geolocate helper
      const locate = () => {
        if (!navigator.geolocation) return
        navigator.geolocation.getCurrentPosition(
          (res) => {
            userPos = { lat: res.coords.latitude, lng: res.coords.longitude }
            map.panTo(userPos)
            map.setZoom(14)
            new google.maps.Marker({
              position: userPos,
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

      // Add a small locate button
      const locateBtn = document.createElement('button')
      locateBtn.textContent = 'Use my location'
      locateBtn.className = 'px-3 py-1.5 rounded-full bg-white border border-[#E0E0E0] text-sm shadow-sm hover:bg-[#FAFAFA]'
      map.controls[google.maps.ControlPosition.TOP_LEFT].push(locateBtn)
      locateBtn.addEventListener('click', locate)

      // Filters: basic available-now chip (demo)
      const chips = document.createElement('div')
      chips.className = 'flex gap-2 ml-2'
      const chip = document.createElement('button')
      chip.textContent = 'Available now'
      chip.className = 'px-3 py-1.5 rounded-full bg-white border border-[#E0E0E0] text-sm shadow-sm hover:bg-[#FAFAFA]'
      chips.appendChild(chip)
      map.controls[google.maps.ControlPosition.TOP_LEFT].push(chips)

      // Search input + autocomplete
      if (searchRef.current) {
        searchRef.current.placeholder = 'Find a booth or enter location'
        const ac = new google.maps.places.Autocomplete(searchRef.current, {
          fields: ['geometry'],
          types: ['geocode'],
        })
        ac.addListener('place_changed', () => {
          const place = ac.getPlace() as any
          const loc = place?.geometry?.location
          if (loc) {
            map.panTo({ lat: loc.lat(), lng: loc.lng() })
            map.setZoom(14)
          }
        })
      }

      // Custom booth icon (rounded rectangle silhouette)
      const boothIcon = (color: string, outline = 'white') => ({
        url:
          'data:image/svg+xml;utf8,' +
          encodeURIComponent(
            `<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="4" width="16" height="24" rx="4" fill="${color}" stroke="${outline}" stroke-width="3"/>
              <circle cx="14" cy="33" r="3" fill="${color}" stroke="${outline}" stroke-width="3"/>
            </svg>`
          ),
        scaledSize: new google.maps.Size(28, 36),
        anchor: new google.maps.Point(14, 34),
      })

      // Info card renderer (BoothNow-styled)
      const renderCard = (opts: {
        title: string
        address?: string
        openNow?: boolean
        url?: string
        distance?: number | null
      }) => {
        const { title, address, openNow, url, distance } = opts
        const distText = typeof distance === 'number' ? `${Math.round(distance)} m away` : ''
        const statusHtml = typeof openNow === 'boolean'
          ? `<span style="padding:2px 8px;border-radius:999px;font-size:12px;background:${openNow ? '#E6F4EA' : '#FCE8E6'};color:${openNow ? '#137333' : '#B3261E'}">${openNow ? 'Available now' : 'Occupied'}</span>`
          : ''
        const link = url || '#'
        return `
          <div style="font-family:Inter,ui-sans-serif,-apple-system;min-width:240px;max-width:280px;background:#fff;border:1px solid #E0E0E0;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,0.08);padding:12px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="font-size:16px">🏪</span>
              <div style="font-weight:600;color:#1A1A1A;flex:1">${title}</div>
            </div>
            ${address ? `<div style="color:#666;font-size:13px;margin-bottom:6px">${address}</div>` : ''}
            <div style="display:flex;align-items:center;gap:8px;justify-content:space-between">
              <div style="color:#666;font-size:12px">${distText}</div>
              ${statusHtml}
            </div>
            <div style="display:flex;gap:8px;margin-top:10px">
              <a href="/dashboard" style="flex:1;text-align:center;background:#2E6A9C;color:#fff;padding:8px 10px;border-radius:999px;text-decoration:none;font-size:13px">Book this booth</a>
              <a target="_blank" rel="noreferrer" href="${link}" style="flex:1;text-align:center;background:#fff;border:1px solid #E0E0E0;color:#1A1A1A;padding:8px 10px;border-radius:999px;text-decoration:none;font-size:13px">Open in map</a>
            </div>
          </div>`
      }

      const info = new google.maps.InfoWindow({
        content: '',
        ariaLabel: 'Booth details',
      })

      // Places service
      // @ts-ignore
      const service: google.maps.places.PlacesService = new google.maps.places.PlacesService(map)

      type BoothMeta = { marker: google.maps.Marker; available: boolean; placeId?: string; latlng: google.maps.LatLngLiteral; title: string; address?: string; url?: string }
      const allMarkers: BoothMeta[] = []

      const addMarker = (p: { lat: number; lng: number; title: string; address?: string; placeId?: string; openNow?: boolean; url?: string }) => {
        const available = typeof p.openNow === 'boolean' ? p.openNow : true
        const marker = new google.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          map,
          title: p.title,
          icon: boothIcon(available ? '#2E6A9C' : '#9CA3AF'),
        })
        const meta: BoothMeta = { marker, available, placeId: p.placeId, latlng: { lat: p.lat, lng: p.lng }, title: p.title, address: p.address, url: p.url }
        allMarkers.push(meta)

        marker.addListener('click', () => {
          if (p.placeId) {
            service.getDetails({ placeId: p.placeId, fields: ['name','formatted_address','opening_hours','url','geometry'] }, (detail: any, status: string) => {
              const ok = status === google.maps.places.PlacesServiceStatus.OK && detail
              const hours = ok ? detail.opening_hours : undefined
              const d = userPos ? dist(userPos, meta.latlng) : null
              info.close()
              info.setContent(
                renderCard({
                  title: (ok && detail.name) || p.title,
                  address: (ok && detail.formatted_address) || p.address,
                  openNow: hours?.isOpen ? hours.isOpen() : hours?.open_now,
                  url: (ok && detail.url) || p.url,
                  distance: d,
                })
              )
              info.open({ map, anchor: marker })
            })
          } else {
            const d = userPos ? dist(userPos, meta.latlng) : null
            info.close()
            info.setContent(renderCard({ title: p.title, address: p.address, distance: d }))
            info.open({ map, anchor: marker })
          }
        })
      }

      // Filter chip: Available now
      chip.addEventListener('click', () => {
        const active = chip.getAttribute('data-active') === '1'
        chip.setAttribute('data-active', active ? '0' : '1')
        chip.style.background = active ? '#FFFFFF' : '#EEF2F6'
        allMarkers.forEach((m) => m.marker.setVisible(active ? true : m.available))
      })

      // Search places near Stockholm for 7‑Eleven
      const request = { query: '7-Eleven', location: stockholm, radius: 15000 }
      service.textSearch(request, function handle(results: any, status: string, pagination: any) {
        if (status === google.maps.places.PlacesServiceStatus.OK && Array.isArray(results)) {
          results.forEach((r) => {
            const loc = r.geometry?.location
            if (!loc) return
            addMarker({
              lat: loc.lat(),
              lng: loc.lng(),
              title: r.name || '7‑Eleven',
              address: r.formatted_address || r.vicinity || '',
              placeId: r.place_id,
              openNow: r.opening_hours?.open_now,
              url: r.url,
            })
          })
          if (pagination?.hasNextPage) setTimeout(() => pagination.nextPage(), 1000)
        }
      })
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

  return (
    <section className="bg-[#F5F4F2]">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-[24px] font-medium text-[#1A1A1A]">Find your nearest booth.</h2>
          <div className="flex w-full items-center gap-3 md:w-auto">
            <input ref={searchRef} className="w-full md:w-[320px] rounded-full border border-[#E0E0E0] bg-white px-4 py-2 text-sm shadow-sm outline-none" placeholder="Find a booth or enter location" />
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#E0E0E0] shadow-sm">
          <div ref={mapRef} className="h-[460px] w-full" />
        </div>
        <p className="mt-3 text-sm text-[#666]">Live map powered by Google Maps JavaScript API. 7‑Eleven locations via Places. Design tuned for BoothNow’s calm identity.</p>
      </div>
    </section>
  )
}
