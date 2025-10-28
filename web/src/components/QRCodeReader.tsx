"use client"

import { useState, useRef, useEffect } from 'react'
import { X, Camera, QrCode, CheckCircle } from 'lucide-react'
import { boothService } from '../services/boothService'

interface QRCodeReaderProps {
  isOpen: boolean
  onClose: () => void
  onBookingSuccess: (reservationId: string) => void
  boothId: string
  boothName: string
  userId?: string
}

export default function QRCodeReader({ 
  isOpen, 
  onClose, 
  onBookingSuccess, 
  boothId, 
  boothName,
  userId
}: QRCodeReaderProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanning()
    } else if (!isOpen) {
      stopScanning()
    }
  }, [isOpen])

  const startScanning = async () => {
    try {
      setError(null)
      setIsScanning(true)
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera if available
        } 
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Camera access denied. Please allow camera access to scan QR codes.')
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const handleQRCodeDetected = async (qrData: string) => {
    if (isProcessing) return
    
    setIsProcessing(true)
    setScanResult(qrData)
    stopScanning()
    
    try {
      console.log('🔧 QRCodeReader - QR Code detected:', qrData)
      console.log('🔧 QRCodeReader - Booking booth:', boothId)
      
      // Book the booth immediately
      const result = await boothService.bookBooth(boothId, 60, userId) // Default 60 minutes
      
      if (result.success) {
        console.log('✅ QRCodeReader - Booth booked successfully:', result.reservationId)
        onBookingSuccess(result.reservationId || 'unknown')
      } else {
        console.error('❌ QRCodeReader - Booking failed:', result.error)
        setError(result.error || 'Failed to book booth')
        setIsProcessing(false)
      }
    } catch (err) {
      console.error('❌ QRCodeReader - Exception during booking:', err)
      setError('An error occurred while booking the booth')
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    stopScanning()
    setError(null)
    setScanResult(null)
    setIsProcessing(false)
    onClose()
  }

  // Simple QR code detection (in a real app, you'd use a library like qr-scanner)
  const handleVideoLoad = () => {
    // This is a simplified version - in production you'd use a proper QR scanner library
    // For now, we'll simulate QR detection after a delay
    setTimeout(() => {
      if (isScanning && !isProcessing) {
        // Simulate QR code detection
        const mockQRData = `BOOTH_BOOKING_${boothId}_${Date.now()}`
        handleQRCodeDetected(mockQRData)
      }
    }, 3000) // Simulate 3 second scan time
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <QrCode className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Scan QR Code</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{boothName}</h3>
            <p className="text-sm text-gray-600">
              {isProcessing ? 'Processing booking...' : 'Position the QR code within the frame'}
            </p>
          </div>

          {/* Camera/Scanner Area */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '1/1' }}>
            {isScanning && !isProcessing ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                onLoadedMetadata={handleVideoLoad}
                playsInline
                muted
              />
            ) : isProcessing ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">QR Code detected!</p>
                  <p className="text-xs text-gray-500">Booking booth...</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Camera className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Camera not available</p>
                </div>
              </div>
            )}

            {/* Scanning overlay */}
            {isScanning && !isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-blue-500 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500 rounded-br-lg"></div>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">
              {isScanning ? 'Scan the QR code on the booth to book it' : 'Tap to start scanning'}
            </p>
            {!isScanning && !isProcessing && (
              <button
                onClick={startScanning}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Start Scanning
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
