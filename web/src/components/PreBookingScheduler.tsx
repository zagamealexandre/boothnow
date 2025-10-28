"use client"

import { useState } from 'react'
import { X, Calendar, Clock, CheckCircle } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { boothService } from '../services/boothService'

interface PreBookingSchedulerProps {
  isOpen: boolean
  onClose: () => void
  onBookingSuccess: (reservationId: string) => void
  boothId: string
  boothName: string
}

export default function PreBookingScheduler({ 
  isOpen, 
  onClose, 
  onBookingSuccess, 
  boothId, 
  boothName 
}: PreBookingSchedulerProps) {
  const { userId } = useAuth()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [duration, setDuration] = useState(60) // Default 60 minutes
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate available time slots (every 30 minutes from 8 AM to 10 PM)
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(timeString)
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  // Get today's date and format it for the input
  const today = new Date()
  const minDate = today.toISOString().split('T')[0]
  
  // Get maximum date (30 days from now)
  const maxDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const maxDateString = maxDate.toISOString().split('T')[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time')
      return
    }

    if (!userId) {
      setError('Please sign in to book a booth')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Create the booking datetime
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const bookingDateTime = new Date(selectedDate)
      bookingDateTime.setHours(hours, minutes, 0, 0)

      const result = await boothService.prebookBooth(boothId, bookingDateTime.toISOString(), duration, userId)

      if (result.success && result.reservationId) {
        onBookingSuccess(result.reservationId)
        handleClose()
      } else {
        setError(result.error || 'Failed to pre-book booth')
      }
    } catch (err) {
      console.error('Pre-booking error:', err)
      setError('An error occurred while pre-booking the booth')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setError(null)
    setSelectedDate('')
    setSelectedTime('')
    setDuration(60)
    setIsProcessing(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Pre-book Booth</h2>
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
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{boothName}</h3>
            <p className="text-sm text-gray-600">
              {isProcessing ? 'Processing pre-booking...' : 'Select your preferred date and time'}
            </p>
          </div>

          {isProcessing ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Pre-booking in progress...</p>
              <p className="text-sm text-gray-600">Please wait while we confirm your reservation</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={minDate}
                  max={maxDateString}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Time
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose a time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Clock className="h-4 w-4" />
                <span>Pre-book Booth</span>
              </button>
            </form>
          )}

          {/* Instructions */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Your booth will be reserved for the selected time. You can cancel up to 1 hour before your booking.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}