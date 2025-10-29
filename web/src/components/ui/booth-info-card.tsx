"use client"

import { MapPin, Clock, Lock, Wrench, Info, CalendarDays, UserPlus, CircleDot, QrCode } from "lucide-react"
import { cn } from "../../lib/utils"

// Import the EnhancedBooth interface from MapSection
import { EnhancedBooth } from '../minimal/MapSection'

// Props for the BoothInfoCard
interface BoothInfoCardProps {
  booth: EnhancedBooth
  userLocation: { lat: number; lng: number } | null
  handleBoothAction: (boothId: string, action: string) => void
  dist: (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) => number
}

export default function BoothInfoCard({ booth, userLocation, handleBoothAction, dist }: BoothInfoCardProps) {
  const distance = userLocation ? dist(userLocation, { lat: booth.lat, lng: booth.lng }) : null
  const distText = distance ? `${Math.round(distance)} m away` : ''

  // Helper function to format booth status with enhanced styling
  const formatBoothStatus = (booth: EnhancedBooth) => {
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
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          textColor: 'text-green-700 dark:text-green-400',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: <CircleDot className="h-4 w-4" />,
          pulse: true
        }
      case 'busy':
        return { 
          label: diffMin > 0 ? `Busy - ${diffMin} min left` : 'Busy - finishing soon', 
          sub: `Available at ${next?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`, 
          color: 'yellow',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          textColor: 'text-yellow-700 dark:text-yellow-400',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          icon: <Clock className="h-3 w-3" />,
          pulse: false
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
              sub: 'Booked by someone else', 
              color: 'red',
              bgColor: 'bg-red-50 dark:bg-red-900/20',
              textColor: 'text-red-700 dark:text-red-400',
              borderColor: 'border-red-200 dark:border-red-800',
              icon: <Lock className="h-3 w-3" />,
              pulse: false
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
              bgColor: 'bg-green-50 dark:bg-green-900/20',
              textColor: 'text-green-700 dark:text-green-400',
              borderColor: 'border-green-200 dark:border-green-800',
              icon: <CircleDot className="h-4 w-4" />,
              pulse: true
            }
          }
          // If more than 1 hour away, treat as available
          else {
            return { 
              label: 'Available now', 
              sub: `Free for ${booth.slotLengthMinutes || 45} min`, 
              color: 'green',
              bgColor: 'bg-green-50 dark:bg-green-900/20',
              textColor: 'text-green-700 dark:text-green-400',
              borderColor: 'border-green-200 dark:border-green-800',
              icon: <CircleDot className="h-4 w-4" />,
              pulse: true
            }
          }
        }
        // If no next booking, treat as available
        return { 
          label: 'Available now', 
          sub: `Free for ${booth.slotLengthMinutes || 45} min`, 
          color: 'green',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          textColor: 'text-green-700 dark:text-green-400',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: <CircleDot className="h-4 w-4" />,
          pulse: true
        }
      case 'maintenance':
        return { 
          label: 'Maintenance', 
          sub: 'Temporarily unavailable', 
          color: 'gray',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          textColor: 'text-gray-700 dark:text-gray-400',
          borderColor: 'border-gray-200 dark:border-gray-800',
          icon: <Wrench className="h-3 w-3" />,
          pulse: false
        }
      default:
        return { 
          label: 'Status unknown', 
          sub: 'Check availability', 
          color: 'blue',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          textColor: 'text-blue-700 dark:text-blue-400',
          borderColor: 'border-blue-200 dark:border-blue-800',
          icon: <Info className="h-4 w-4" />,
          pulse: false
        }
    }
  }
  
  const statusInfo = formatBoothStatus(booth)

  // Determine button text and action based on status
  const getButtonInfo = (status: string) => {
    switch (status) {
      case 'available':
        return { 
          buttons: [
            { 
              text: '📱 Book now', 
              action: 'book_now', 
              primary: true, 
              icon: <QrCode className="h-4 w-4 mr-2" />,
              disabled: false
            },
            { 
              text: '📅 Pre-book', 
              action: 'prebook', 
              primary: false, 
              icon: <CalendarDays className="h-4 w-4 mr-2" />,
              disabled: false
            }
          ]
        }
      case 'busy':
        return { 
          buttons: [
            { 
              text: 'Pre-book slot', 
              action: 'prebook', 
              primary: true, 
              icon: <CalendarDays className="h-4 w-4 mr-2" />,
              disabled: false
            }
          ]
        }
      case 'prebooked':
        return { 
          buttons: [
            { 
              text: 'Join waitlist', 
              action: 'waitlist', 
              primary: true, 
              icon: <UserPlus className="h-4 w-4 mr-2" />,
              disabled: false
            }
          ]
        }
      case 'maintenance':
        return { 
          buttons: [
            { 
              text: 'Notify when ready', 
              action: 'notify', 
              primary: true, 
              icon: <Info className="h-4 w-4 mr-2" />,
              disabled: true
            }
          ]
        }
      default:
        return { 
          buttons: [
            { 
              text: 'Check availability', 
              action: 'check', 
              primary: true, 
              icon: <Info className="h-4 w-4 mr-2" />,
              disabled: false
            }
          ]
        }
    }
  }
  
  const buttonInfo = getButtonInfo(booth.status)

  return (
    <div className="group relative overflow-visible rounded-2xl bg-gray-900 p-4 w-64 min-h-40 shadow-[12px_12px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-[16px_16px_32px_rgba(0,0,0,0.5)] hover:scale-102 hover:-translate-y-1">
      
      {/* Status indicator - moved to left, smaller font */}
      <div className="absolute left-2 top-2 z-10">
        <div className={cn(
          "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-all duration-300",
          statusInfo.bgColor,
          statusInfo.textColor,
          statusInfo.borderColor,
          "border"
        )}>
          {statusInfo.icon}
          <span className="text-xs">{statusInfo.label}</span>
        </div>
      </div>

      {/* Header - smaller font for mobile */}
      <div className="mb-3 mt-6 relative z-10">
        <h3 className="text-sm font-semibold text-white transition-colors duration-300 group-hover:text-blue-400">
          {booth.name}
        </h3>
      </div>

      {/* Distance - smaller font */}
      <div className="text-xs text-gray-400 mb-4 relative z-10">
        <span className="font-medium">{distText}</span>
      </div>

      {/* Action Buttons - stacked vertically, full width */}
      <div className="space-y-2 relative z-10 pb-2">
        {buttonInfo.buttons.map((button, index) => (
          <button
            key={index}
            onClick={() => {
              console.log(`🔧 BoothInfoCard - Button clicked: ${button.text}, Action: ${button.action}`)
              if (!button.disabled) {
                handleBoothAction(booth.id, button.action)
              }
            }}
            disabled={button.disabled}
            className={cn(
              "w-full flex items-center justify-center rounded-lg py-2 text-xs font-medium transition-all duration-300 hover:scale-95 active:scale-90",
              button.primary
                ? "bg-blue-600 text-white shadow-[4px_4px_8px_rgba(59,130,246,0.3)] hover:shadow-[2px_2px_4px_rgba(59,130,246,0.2)] group-hover:bg-blue-500"
                : "bg-gray-800 text-blue-400 border border-blue-600 shadow-[4px_4px_8px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.1)] group-hover:bg-gray-700 group-hover:border-blue-500",
              button.disabled && "opacity-50 cursor-not-allowed hover:scale-100"
            )}
          >
            {button.icon}
            <span className="ml-1.5 text-xs">{button.text}</span>
          </button>
        ))}
        
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booth.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center rounded-lg bg-gray-800 border border-gray-600 py-2 text-xs font-medium text-gray-300 shadow-[4px_4px_8px_rgba(0,0,0,0.2)] transition-all duration-300 hover:shadow-[2px_2px_4px_rgba(0,0,0,0.1)] hover:scale-95 active:scale-90 group-hover:bg-gray-700 group-hover:border-gray-500"
        >
          <MapPin className="h-3 w-3 mr-1.5" />
          <span className="text-xs">Open in Maps</span>
        </a>
      </div>

      {/* Subtle animated border on hover */}
      <div className="absolute inset-0 rounded-2xl border border-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  )
}
