import PostHog from 'posthog-react-native';

const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY!;
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

export const posthog = new PostHog(posthogApiKey, {
  host: posthogHost,
  enableSessionRecording: true,
  captureApplicationLifecycleEvents: true,
  captureDeepLinks: true,
});

// Analytics helper functions
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  posthog.capture(eventName, properties);
};

export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  posthog.identify(userId, properties);
};

export const setUserProperties = (properties: Record<string, any>) => {
  posthog.setPersonProperties(properties);
};

// Common events
export const trackBoothView = (boothId: string, partner: string, location: { lat: number; lng: number }) => {
  trackEvent('booth_viewed', {
    booth_id: boothId,
    partner,
    location,
    timestamp: new Date().toISOString(),
  });
};

export const trackBoothReservation = (boothId: string, partner: string, duration: number) => {
  trackEvent('booth_reserved', {
    booth_id: boothId,
    partner,
    duration_minutes: duration,
    timestamp: new Date().toISOString(),
  });
};

export const trackSessionStart = (sessionId: string, boothId: string, partner: string) => {
  trackEvent('session_started', {
    session_id: sessionId,
    booth_id: boothId,
    partner,
    timestamp: new Date().toISOString(),
  });
};

export const trackSessionEnd = (sessionId: string, duration: number, cost: number) => {
  trackEvent('session_ended', {
    session_id: sessionId,
    duration_minutes: duration,
    total_cost: cost,
    timestamp: new Date().toISOString(),
  });
};

export const trackPaymentIntent = (amount: number, currency: string, boothId: string) => {
  trackEvent('payment_intent_created', {
    amount,
    currency,
    booth_id: boothId,
    timestamp: new Date().toISOString(),
  });
};

export const trackMapInteraction = (action: string, location?: { lat: number; lng: number }) => {
  trackEvent('map_interaction', {
    action,
    location,
    timestamp: new Date().toISOString(),
  });
};
