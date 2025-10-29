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

interface ActiveSessionProps {
  session: ActiveSession;
  onEndSession: (sessionId: string) => void;
  onModifySession: (sessionId: string) => void;
}

export default function ActiveSession({ session, onEndSession, onModifySession }: ActiveSessionProps) {
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
      setCurrentCost(elapsedMinutes * session.cost_per_minute);
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
  }, [session.start_time, session.cost_per_minute, session.max_duration_minutes]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleEndSession = () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      onEndSession(session.id);
    }
  };

  const handleModifySession = () => {
    onModifySession(session.id);
  };

  return (
    <div className="min-h-screen bg-[#F3F3F3] p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Active Session Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Active Session</h2>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-600">In Use</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">{session.booth_name}</h3>
            <p className="text-sm text-gray-600">Booth #1 • {session.booth_address}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Plan: {session.plan_type === 'pay_per_minute' ? 'Pay Per Minute' : 'Subscription'}</span>
              <span>Started: {new Date(session.start_time).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}</span>
            </div>
            <div className="text-sm text-gray-500">
              Max Duration: {session.max_duration_minutes} minutes
            </div>
          </div>
        </div>

        {/* Timer and Cost Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-center space-y-4">
            {/* Time Remaining */}
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {formatTime(timeRemaining)}
              </div>
              <p className="text-sm text-gray-600">Time Remaining</p>
            </div>

            {/* Current Cost */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-lg font-semibold text-blue-900">
                Current Cost: {currentCost.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SEK
              </div>
              <div className="text-sm text-blue-700">
                {session.cost_per_minute} SEK/minute
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleEndSession}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <X className="w-5 h-5" />
                <span>End Session Now</span>
              </button>
              
              <button
                onClick={handleModifySession}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Modify Session
              </button>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
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
        <div className="bg-white rounded-xl p-6 shadow-sm">
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
  );
}
