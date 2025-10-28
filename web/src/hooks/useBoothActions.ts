import { useState } from 'react'
import { boothService, Booth } from '../services/boothService'

export interface EnhancedBooth extends Booth {
  slotLengthMinutes?: number
  freeUntil?: string
}

export interface UseBoothActionsReturn {
  // Modal state
  showQRReader: boolean
  showScheduler: boolean
  currentBoothId: string | null
  currentBoothName: string
  
  // Modal controls
  setShowQRReader: (show: boolean) => void
  setShowScheduler: (show: boolean) => void
  setCurrentBoothId: (id: string | null) => void
  setCurrentBoothName: (name: string) => void
  
  // Action handler
  handleBoothAction: (boothId: string, action: string, booths: EnhancedBooth[], setBooths: (booths: EnhancedBooth[]) => void) => Promise<void>
  
  // Modal close handlers
  closeQRReader: () => void
  closeScheduler: () => void
}

export function useBoothActions(): UseBoothActionsReturn {
  // Modal state
  const [showQRReader, setShowQRReader] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)
  const [currentBoothId, setCurrentBoothId] = useState<string | null>(null)
  const [currentBoothName, setCurrentBoothName] = useState<string>('')

  // Enhanced booth action handler
  const handleBoothAction = async (
    boothId: string, 
    action: string, 
    booths: EnhancedBooth[], 
    setBooths: (booths: EnhancedBooth[]) => void
  ) => {
    console.log(`🔧 useBoothActions - handleBoothAction: Booth ${boothId}, Action: ${action}`)
    
    try {
      let result
      switch (action) {
        case 'book_now':
          console.log('🔧 useBoothActions - Opening QR code reader for immediate booking')
          // Open QR code reader for immediate booking
          const booth = booths.find(b => b.id === boothId)
          if (booth) {
            setCurrentBoothId(boothId)
            setCurrentBoothName(booth.name || booth.address)
            setShowScheduler(false) // Ensure scheduler is closed
            setShowQRReader(true)
            console.log('✅ useBoothActions - QR reader modal opened, showQRReader:', true, 'showScheduler:', false)
          }
          break
        case 'prebook':
          console.log('🔧 useBoothActions - Opening pre-booking scheduler')
          // Open pre-booking scheduler
          const prebookBooth = booths.find(b => b.id === boothId)
          if (prebookBooth) {
            setCurrentBoothId(boothId)
            setCurrentBoothName(prebookBooth.name || prebookBooth.address)
            setShowQRReader(false) // Ensure QR reader is closed
            setShowScheduler(true)
            console.log('✅ useBoothActions - Pre-booking scheduler modal opened, showQRReader:', false, 'showScheduler:', true)
          }
          break
        case 'waitlist':
          result = await boothService.joinWaitlist(boothId)
          if (result.success) {
            alert('Added to waitlist!')
          } else {
            alert(`Waitlist failed: ${result.error}`)
          }
          break
        case 'notify':
          alert('You will be notified when this booth becomes available!')
          break
        default:
          alert(`Action: ${action} for booth ${boothId}`)
      }
    } catch (error) {
      console.error('Error handling booth action:', error)
      alert('An error occurred. Please try again.')
    }
  }

  // Modal close handlers
  const closeQRReader = () => {
    setShowQRReader(false)
    setCurrentBoothId(null)
    setCurrentBoothName('')
  }

  const closeScheduler = () => {
    setShowScheduler(false)
    setCurrentBoothId(null)
    setCurrentBoothName('')
  }

  return {
    // Modal state
    showQRReader,
    showScheduler,
    currentBoothId,
    currentBoothName,
    
    // Modal controls
    setShowQRReader,
    setShowScheduler,
    setCurrentBoothId,
    setCurrentBoothName,
    
    // Action handler
    handleBoothAction,
    
    // Modal close handlers
    closeQRReader,
    closeScheduler
  }
}
