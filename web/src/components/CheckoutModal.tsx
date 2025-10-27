'use client';

import { useState } from 'react';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import { creemService, CreemProduct, CreemCheckout } from '../services/creemService';

interface CheckoutModalProps {
  product: CreemProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (checkout: CreemCheckout) => void;
  customerEmail?: string;
  customerName?: string;
  metadata?: Record<string, any>;
}

export default function CheckoutModal({
  product,
  isOpen,
  onClose,
  onSuccess,
  customerEmail,
  customerName,
  metadata = {}
}: CheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [checkout, setCheckout] = useState<CreemCheckout | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateCheckout = async () => {
    if (!product) return;

    try {
      setLoading(true);
      setError(null);

      const checkoutSession = await creemService.createCheckout({
        productId: product.id,
        customerEmail,
        customerName,
        metadata
      });

      if (checkoutSession) {
        setCheckout(checkoutSession);
        if (onSuccess) {
          onSuccess(checkoutSession);
        }
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err) {
      setError('An error occurred while creating checkout');
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCheckout = () => {
    if (checkout?.url) {
      window.open(checkout.url, '_blank');
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Checkout</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {!checkout ? (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">{product.name}</h3>
                {product.description && (
                  <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {product.type === 'subscription' ? 'Subscription' : 'One-time payment'}
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {product.price > 0 ? `€${product.price}` : 'Free'}
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCheckout}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Continue to Payment'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-green-900">Checkout Session Created</h3>
                    <p className="text-sm text-green-700">You will be redirected to complete your payment.</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleOpenCheckout}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Payment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
