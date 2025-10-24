import { supabase } from './supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// API client with authentication
class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Places API
  async getNearbyBooths(lat: number, lng: number, radius = 5000) {
    return this.request<any>('/api/places/7eleven', {
      method: 'GET',
    });
  }

  async getPlaceDetails(placeId: string) {
    return this.request<any>(`/api/places/details/${placeId}`);
  }

  // Booths API
  async getBooths(lat?: number, lng?: number, radius?: number) {
    const params = new URLSearchParams();
    if (lat) params.append('lat', lat.toString());
    if (lng) params.append('lng', lng.toString());
    if (radius) params.append('radius', radius.toString());

    return this.request<any>(`/api/booths?${params.toString()}`);
  }

  async getBooth(id: string) {
    return this.request<any>(`/api/booths/${id}`);
  }

  async reserveBooth(boothId: string, durationMinutes: number) {
    return this.request<any>(`/api/booths/${boothId}/reserve`, {
      method: 'POST',
      body: JSON.stringify({ duration_minutes: durationMinutes }),
    });
  }

  // Sessions API
  async getSessions() {
    return this.request<any>('/api/sessions');
  }

  async startSession(boothId: string, reservationId: string) {
    return this.request<any>('/api/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ booth_id: boothId, reservation_id: reservationId }),
    });
  }

  async endSession(sessionId: string, totalMinutes: number, totalCost: number) {
    return this.request<any>(`/api/sessions/${sessionId}/end`, {
      method: 'POST',
      body: JSON.stringify({ total_minutes: totalMinutes, total_cost: totalCost }),
    });
  }

  async getSessionTimer(sessionId: string) {
    return this.request<any>(`/api/sessions/${sessionId}/timer`);
  }

  // Payments API
  async createPaymentIntent(amount: number, currency: string, boothId: string) {
    return this.request<any>('/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ amount, currency, booth_id: boothId }),
    });
  }

  async capturePayment(paymentIntentId: string, amount?: number) {
    return this.request<any>('/api/payments/capture', {
      method: 'POST',
      body: JSON.stringify({ 
        payment_intent_id: paymentIntentId, 
        amount 
      }),
    });
  }

  async createSubscription(priceId: string, paymentMethodId: string) {
    return this.request<any>('/api/payments/create-subscription', {
      method: 'POST',
      body: JSON.stringify({ price_id: priceId, payment_method_id: paymentMethodId }),
    });
  }

  // User API
  async getUserProfile() {
    return this.request<any>('/api/users/profile');
  }

  async updateUserProfile(data: any) {
    return this.request<any>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserSessions(limit = 20, offset = 0) {
    return this.request<any>(`/api/users/sessions?limit=${limit}&offset=${offset}`);
  }

  async getUserStats() {
    return this.request<any>('/api/users/stats');
  }

  // Analytics API
  async trackEvent(event: string, properties: Record<string, any>) {
    return this.request<any>('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ event, properties }),
    });
  }

  async identifyUser(properties: Record<string, any>) {
    return this.request<any>('/api/analytics/identify', {
      method: 'POST',
      body: JSON.stringify({ properties }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
