'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { creemService, CreemSubscription } from '../services/creemService';
import { Calendar, CreditCard, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface SubscriptionManagerProps {
  customerEmail?: string;
  onSubscriptionUpdate?: (subscription: CreemSubscription) => void;
}

export default function SubscriptionManager({ 
  customerEmail, 
  onSubscriptionUpdate 
}: SubscriptionManagerProps) {
  const { getToken } = useAuth();
  const [subscriptions, setSubscriptions] = useState<CreemSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (customerEmail) {
      loadSubscriptions();
    }
  }, [customerEmail]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading subscriptions...');
      const token = await getToken();
      console.log('🔑 Got token:', token ? 'Yes' : 'No');
      
      const userSubscriptions = await creemService.getSubscriptions(token || undefined);
      console.log('📊 Subscriptions received:', userSubscriptions);
      setSubscriptions(userSubscriptions);
      
      if (onSubscriptionUpdate && userSubscriptions.length > 0) {
        onSubscriptionUpdate(userSubscriptions[0]);
      }
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      setCancelling(subscriptionId);
      const success = await creemService.cancelSubscription(subscriptionId);
      
      if (success) {
        setSubscriptions(prev => 
          prev.map(sub => 
            sub.id === subscriptionId 
              ? { ...sub, status: 'cancelled' as const }
              : sub
          )
        );
      } else {
        setError('Failed to cancel subscription');
      }
    } catch (err) {
      setError('An error occurred while cancelling subscription');
      console.error('Cancel subscription error:', err);
    } finally {
      setCancelling(null);
    }
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'past_due':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading subscriptions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Subscriptions</h3>
        <button
          onClick={loadSubscriptions}
          disabled={loading}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {subscriptions.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Subscriptions</h4>
          <p className="text-gray-600 mb-4">
            You don't have any active subscriptions yet.
          </p>
          <p className="text-sm text-gray-500">
            Subscribe to a plan to get started with BoothNow.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(subscription.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center mb-1">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        {new Date(subscription.current_period_start).toLocaleDateString()} - {' '}
                        {new Date(subscription.current_period_end).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {subscription.customer_email && (
                      <div className="text-gray-500">
                        {subscription.customer_email}
                      </div>
                    )}
                  </div>
                </div>

                {subscription.status === 'active' && (
                  <button
                    onClick={() => handleCancelSubscription(subscription.id)}
                    disabled={cancelling === subscription.id}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {cancelling === subscription.id ? 'Cancelling...' : 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
