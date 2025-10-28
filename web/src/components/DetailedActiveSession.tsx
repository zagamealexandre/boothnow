"use client";

import { useState, useEffect, useRef } from 'react';
import { Clock, X, Phone, AlertTriangle, Wifi, Shield, Zap, Gift } from 'lucide-react';

interface ActiveSession {
  id: string;
  booth_name: string;
  booth_address: string;
  start_time: string;
  plan_type: 'pay_per_minute' | 'subscription';
  max_duration_minutes: number;
  cost_per_minute: number;
}

interface DetailedActiveSessionProps {
  session: ActiveSession;
  onEndSession: (sessionId: string) => void;
  onClose: () => void;
}

export default function DetailedActiveSession({ 
  session, 
  onEndSession, 
  onClose 
}: DetailedActiveSessionProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentCost, setCurrentCost] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate elapsed time and cost
  useEffect(() => {
    const calculateTimeAndCost = () => {
      const startTime = new Date(session.start_time);
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000); // seconds
      const elapsedMinutes = elapsed / 60;
      
      setElapsedTime(elapsed);
      setCurrentCost(elapsedMinutes * 0.50); // Always use 0.50 per minute
      setTimeRemaining(Math.max(0, (session.max_duration_minutes * 60) - elapsed));
    };

    // Calculate immediately
    calculateTimeAndCost();

    // Update every second
    intervalRef.current = setInterval(calculateTimeAndCost, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session.start_time, session.max_duration_minutes]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleEndSession = () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      onEndSession(session.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Active Session</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Session Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{session.booth_name}</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">In Use</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">Booth #1 • {session.booth_address}</p>
          </div>

          {/* Session Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Plan Type</p>
              <p className="text-sm font-medium text-gray-900">
                {session.plan_type === 'pay_per_minute' ? 'Pay Per Minute (€0.50/min)' : 'Membership (€29/month)'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Started At</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(session.start_time).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Max Duration</p>
              <p className="text-sm font-medium text-gray-900">{session.max_duration_minutes} minutes</p>
            </div>
          </div>

          {/* Time Remaining - Large Display */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {formatTime(timeRemaining)}
            </div>
            <p className="text-sm text-gray-600">Time Remaining</p>
          </div>

          {/* Cost Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-900 mb-1">
                Current Cost: €{currentCost.toFixed(2)}
              </div>
              <div className="text-sm text-blue-700">
                €{session.cost_per_minute}/minute
              </div>
            </div>
          </div>

          {/* End Session Button */}
          <button
            onClick={handleEndSession}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <X className="w-5 h-5" />
            <span>End Session Now</span>
          </button>

          {/* Need Help? Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Need Help?</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Technical Support */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="font-medium text-orange-900 mb-2">Technical Support</h4>
                <p className="text-sm text-orange-700 mb-2">Booth not working? App issues?</p>
                <div className="flex items-center space-x-2 text-orange-800">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">+46 12 345 67 89</span>
                </div>
              </div>

              {/* Emergency */}
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">Emergency</h4>
                <p className="text-sm text-red-700 mb-2">Stuck inside? Safety concern?</p>
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Emergency Exit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booth Features */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Booth Features</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Soundproof</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">WiFi Available</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Power Outlets</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Gift className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Store Rewards</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
