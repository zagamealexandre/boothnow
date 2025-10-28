'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { creemService } from '../services/creemService';
import { CreditCard, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface PaymentSetupProps {
  onSetupComplete?: () => void;
  clerkUser?: any; // Pass clerkUser from Dashboard
  userProfile?: any; // Pass userProfile from Dashboard to know when user is loaded
}

export default function PaymentSetup({ onSetupComplete, clerkUser, userProfile }: PaymentSetupProps) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<{
    isSetup: boolean;
    paymentType?: string;
    customerEmail?: string;
  } | null>(null);

  // Check payment setup status when user profile is loaded
  useEffect(() => {
    if (userProfile) {
      console.log('🔍 PaymentSetup - user profile loaded, checking payment status...');
      checkPaymentStatus();
    } else {
      console.log('🔍 PaymentSetup - waiting for user profile to load...');
      setCheckingStatus(false);
    }
  }, [userProfile]);

  const checkPaymentStatus = async () => {
    try {
      setCheckingStatus(true);
      console.log('🔍 PaymentSetup - checking payment status...');
      
      // Call backend to check if user has payment method setup
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = await getToken();
      console.log('🔍 PaymentSetup - token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${baseUrl}/api/payments/payment-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('🔍 PaymentSetup - response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 PaymentSetup - payment status response:', data);
        
        // If user not found, try to create them
        if (data.message === 'User not found' && userProfile && retryCount < 3) {
          console.log(`🔍 PaymentSetup - user not found in database, retrying in 2 seconds... (attempt ${retryCount + 1}/3)`);
          // The user should already be created by the Dashboard component
          // If we're here, there might be a timing issue - retry after a delay
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            checkPaymentStatus();
          }, 2000);
          return;
        } else if (data.message === 'User not found' && retryCount >= 3) {
          console.log('🔍 PaymentSetup - user not found after 3 retries, giving up');
          setPaymentStatus({
            isSetup: false
          });
        } else {
          setPaymentStatus({
            isSetup: data.payment_method_setup || false,
            paymentType: data.payment_type,
            customerEmail: data.customer_email
          });
          
          if (data.payment_method_setup) {
            setSuccess(true);
          }
        }
      } else {
        const errorText = await response.text();
        console.log('🔍 PaymentSetup - error response:', response.status, errorText);
        setPaymentStatus({
          isSetup: false
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus({
        isSetup: false
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSetupPayment = async () => {
    // Debug: Log user objects to understand the structure
    console.log('🔍 PaymentSetup - clerkUser prop:', clerkUser);
    
    // Try to get email from various possible locations
    let userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
    if (!userEmail) {
      userEmail = clerkUser?.primaryEmailAddress?.emailAddress;
    }
    if (!userEmail) {
      userEmail = clerkUser?.email;
    }
    
    // Also try from clerkUser prop
    if (!userEmail && clerkUser) {
      userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
    }
    if (!userEmail && clerkUser) {
      userEmail = clerkUser?.email;
    }

    console.log('🔍 PaymentSetup - extracted email:', userEmail);

    if (!userEmail) {
      setError('Email address not found. Please check your Clerk account settings.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get user name from various sources
      let userName = 'BoothNow User';
      if (clerkUser?.firstName || clerkUser?.lastName) {
        userName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
      }

      console.log('🔍 PaymentSetup - calling setupPaymentMethod with:', {
        customerEmail: userEmail,
        customerName: userName
      });

      const result = await creemService.setupPaymentMethod({
        customerEmail: userEmail,
        customerName: userName
      });

      console.log('🔍 PaymentSetup - setupPaymentMethod result:', result);

      if (result) {
        setSuccess(true);
        // Refresh payment status from database
        await checkPaymentStatus();
        if (onSetupComplete) {
          onSetupComplete();
        }
      } else {
        setError('Failed to setup payment method');
      }
    } catch (err) {
      setError('An error occurred while setting up payment');
      console.error('Payment setup error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking payment status
  if (checkingStatus) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center">
          <Loader className="w-5 h-5 text-gray-600 mr-2 animate-spin" />
          <div>
            <h3 className="font-medium text-gray-800">Checking Payment Status</h3>
            <p className="text-sm text-gray-600 mt-1">
              Loading your payment information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show success state if payment is already setup or just completed
  if (success || (paymentStatus && paymentStatus.isSetup)) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
          <div>
            <h3 className="font-medium text-green-900">Payment Method Connected</h3>
            <p className="text-sm text-green-700 mt-1">
              You're all set! You'll only be charged when you use a booth.
            </p>
            {paymentStatus?.customerEmail && (
              <p className="text-xs text-green-500 mt-1">
                Connected to: {paymentStatus.customerEmail}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start">
        <CreditCard className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-blue-900 mb-2">Connect Your Payment Method</h3>
          <p className="text-sm text-blue-700 mb-4">
            Connect your card to get started. You'll only be charged €0.50 per minute when you actually use a booth.
          </p>
          
          {error && (
            <div className="flex items-center mb-4">
              <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          <button
            onClick={handleSetupPayment}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Connect Payment Method
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
