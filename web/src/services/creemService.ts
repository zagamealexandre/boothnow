// Note: We use the backend API instead of calling Creem directly from frontend
// This avoids CORS issues and keeps API keys secure

import { useAuth } from '@clerk/nextjs';

export interface CreemProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  type: 'one_time' | 'subscription' | 'monthly' | 'pre-book';
  status: 'active' | 'inactive';
  metadata?: Record<string, any>;
  // Enhanced fields from backend
  displayName?: string;
  displayPrice?: string;
  features?: string[];
  billing_type?: 'recurring' | 'onetime';
  billing_period?: string;
  object?: string;
  mode?: string;
}

export interface CreemCheckout {
  id: string;
  url: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  product_id: string;
  customer_email?: string;
  customer_name?: string;
  metadata?: Record<string, any>;
}

export interface CreemSubscription {
  id: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  product_id: string;
  customer_email?: string;
  customer_name?: string;
  current_period_start: string;
  current_period_end: string;
  metadata?: Record<string, any>;
}

class CreemService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  /**
   * Get authentication headers with Clerk token
   */
  private async getAuthHeaders(token?: string): Promise<HeadersInit> {
    try {
      return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };
    } catch (error) {
      console.warn('Could not get auth token:', error);
      return {
        'Content-Type': 'application/json'
      };
    }
  }

  /**
   * Fetch all products from Creem via backend API
   */
  async getProducts(token?: string): Promise<CreemProduct[]> {
    try {
      const headers = await this.getAuthHeaders(token);
      const response = await fetch(`${this.baseUrl}/api/payments/products`, {
        method: 'GET',
        headers,
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  /**
   * Get a specific product by ID via backend API
   */
  async getProduct(productId: string): Promise<CreemProduct | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/products/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.product || null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  /**
   * Create a checkout session for a product via backend API
   */
  async createCheckout({
    productId,
    customerEmail,
    customerName,
    metadata = {}
  }: {
    productId: string;
    customerEmail?: string;
    customerName?: string;
    metadata?: Record<string, any>;
  }): Promise<CreemCheckout | null> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/payments/create-checkout`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          product_id: productId,
          booth_id: metadata.booth_id || null,
          duration_minutes: metadata.duration_minutes || 60
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        id: data.checkout_id,
        url: data.checkout_url,
        status: 'pending',
        product_id: productId,
        customer_email: customerEmail,
        customer_name: customerName,
        metadata
      };
    } catch (error) {
      console.error('Error creating checkout:', error);
      return null;
    }
  }

  /**
   * Get checkout session details via backend API
   */
  async getCheckout(checkoutId: string): Promise<CreemCheckout | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/checkout/${checkoutId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.checkout || null;
    } catch (error) {
      console.error('Error fetching checkout:', error);
      return null;
    }
  }

  /**
   * Create a subscription via backend API
   */
  async createSubscription({
    productId,
    customerEmail,
    customerName,
    metadata = {}
  }: {
    productId: string;
    customerEmail?: string;
    customerName?: string;
    metadata?: Record<string, any>;
  }): Promise<CreemSubscription | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          product_id: productId,
          customer_email: customerEmail,
          customer_name: customerName,
          metadata
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.subscription || null;
    } catch (error) {
      console.error('Error creating subscription:', error);
      return null;
    }
  }

  /**
   * Get subscription details via backend API
   */
  async getSubscription(subscriptionId: string): Promise<CreemSubscription | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/subscription/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.subscription || null;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  /**
   * Cancel a subscription via backend API
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subscription_id: subscriptionId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  }

  /**
   * Get all subscriptions for the current user via backend API
   */
  async getSubscriptions(token?: string): Promise<CreemSubscription[]> {
    try {
      console.log('🔄 Fetching subscriptions from backend...');
      const headers = await this.getAuthHeaders(token);
      const response = await fetch(`${this.baseUrl}/api/payments/subscriptions`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('❌ Backend API error:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Backend response:', data);
      return data.subscriptions || [];
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }
  }

  /**
   * Upgrade a subscription to a different product via backend API
   */
  async upgradeSubscription({
    subscriptionId,
    productId,
    updateBehavior = 'proration-charge-immediately'
  }: {
    subscriptionId: string;
    productId: string;
    updateBehavior?: 'proration-charge-immediately' | 'proration-charge' | 'proration-none';
  }): Promise<CreemSubscription | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/upgrade-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subscription_id: subscriptionId,
          product_id: productId,
          update_behavior: updateBehavior
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.subscription || null;
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      return null;
    }
  }

  /**
   * Update a subscription via backend API
   */
  async updateSubscription({
    subscriptionId,
    ...updateData
  }: {
    subscriptionId: string;
    [key: string]: any;
  }): Promise<CreemSubscription | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/update-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subscription_id: subscriptionId,
          ...updateData
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.subscription || null;
    } catch (error) {
      console.error('Error updating subscription:', error);
      return null;
    }
  }

  /**
   * Setup payment method for pay-per-use billing
   */
  async setupPaymentMethod({
    customerEmail,
    customerName
  }: {
    customerEmail: string;
    customerName?: string;
  }): Promise<{ customer_id: string; message: string; setup_url?: string } | null> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/payments/setup-payment-method`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          customer_email: customerEmail,
          customer_name: customerName
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error setting up payment method:', error);
      return null;
    }
  }

  /**
   * Charge user after booth session
   */
  async chargeSession({
    sessionId,
    durationMinutes,
    boothId
  }: {
    sessionId: string;
    durationMinutes: number;
    boothId?: string;
  }): Promise<{
    payment_intent_id: string;
    amount: number;
    amount_display: string;
    duration_minutes: number;
    message: string;
  } | null> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/payments/charge-session`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          session_id: sessionId,
          duration_minutes: durationMinutes,
          booth_id: boothId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error charging session:', error);
      return null;
    }
  }

  /**
   * Get payment status for a session
   */
  async getPaymentStatus(sessionId: string): Promise<{
    payment: {
      id: string;
      session_id: string;
      amount: number;
      currency: string;
      status: string;
      created_at: string;
      metadata: any;
    };
  } | null> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/payments/payment-status/${sessionId}`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting payment status:', error);
      return null;
    }
  }

}

export const creemService = new CreemService();
