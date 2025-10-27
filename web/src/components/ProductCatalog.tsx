'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { creemService, CreemProduct } from '../services/creemService';
import { CreditCard, Clock, CheckCircle } from 'lucide-react';

interface ProductCatalogProps {
  onProductSelect?: (product: CreemProduct) => void;
  showBoothProducts?: boolean;
}

export default function ProductCatalog({ onProductSelect, showBoothProducts = true }: ProductCatalogProps) {
  const { getToken } = useAuth();
  const [products, setProducts] = useState<CreemProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const fetchedProducts = await creemService.getProducts(token || undefined);
      
      // For now, show all products (filtering can be added later if needed)
      setProducts(fetchedProducts);
    } catch (err) {
      setError('Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: CreemProduct) => {
    if (onProductSelect) {
      onProductSelect(product);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading products...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={loadProducts}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 mb-4">No products available</p>
        <button 
          onClick={loadProducts}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Available Products</h3>
      <div className="grid gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
            onClick={() => handleProductClick(product)}
          >
            {/* Mobile-first layout: Stack content vertically */}
            <div className="space-y-3">
              {/* Header with title and price */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <h4 className="font-medium text-gray-900 text-base">
                    {product.displayName || product.name}
                  </h4>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-semibold text-gray-900">
                    {product.displayPrice || (product.price > 0 ? `€${product.price}` : 'Free')}
                  </div>
                  {product.currency && product.currency !== 'EUR' && (
                    <div className="text-sm text-gray-500">{product.currency}</div>
                  )}
                </div>
              </div>
              
              {/* Description */}
              {product.description && (
                <p className="text-sm text-gray-600">
                  {product.description}
                </p>
              )}
              
              {/* Attributes - Stack on mobile */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  <CreditCard className="w-3 h-3 mr-1" />
                  {product.billing_type === 'recurring' || product.type === 'subscription' || product.type === 'monthly' ? 'Subscription' : 'One-time'}
                </div>
                
                {(product.billing_type === 'recurring' || product.type === 'subscription' || product.type === 'monthly') && (
                  <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    <Clock className="w-3 h-3 mr-1" />
                    Recurring
                  </div>
                )}
                
                <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {product.status === 'active' ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
            
            {(product.metadata || product.features) && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                {product.features && product.features.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-gray-700 mb-2">Features:</div>
                    <div className="grid grid-cols-1 gap-1">
                      {product.features.map((feature, index) => (
                        <div key={index} className="flex items-start">
                          <CheckCircle className="w-3 h-3 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-gray-600 leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {product.metadata && (
                  <div className="text-xs text-gray-500 space-y-1">
                    {product.metadata.duration_minutes && (
                      <div>Duration: {product.metadata.duration_minutes} minutes</div>
                    )}
                    {product.metadata.booth_type && (
                      <div>Type: {product.metadata.booth_type}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
