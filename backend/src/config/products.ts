// Product mapping configuration for Creem products
export interface ProductConfig {
  id: string;
  name: string;
  type: 'pay-as-you-go' | 'monthly' | 'pre-book';
  description: string;
  price: string;
  features: string[];
}

export const PRODUCT_CONFIGS: ProductConfig[] = [
  {
    id: 'prod_7S7lFuxSRspLJras1ffsMF',
    name: 'Monthly Subscription',
    type: 'monthly',
    description: 'Unlimited booth access for one month.',
    price: '€29/mo',
    features: [
      'Unlimited sessions',
      '90 minutes per session',
      'Lower minute rate',
      'App access and support'
    ]
  },
  {
    id: 'prod_3I8jthL5XjFpu5RQoWZ3tf',
    name: 'Pay-Per-Use',
    type: 'pay-as-you-go',
    description: 'Connect your card and pay only for what you use.',
    price: '€0.50/minute',
    features: [
      'Connect payment method once',
      'Pay only when you use the booth',
      'No upfront charges',
      'Automatic billing after session'
    ]
  }
];

// Helper function to get product config by Creem product ID
export function getProductConfig(creemProductId: string): ProductConfig | undefined {
  return PRODUCT_CONFIGS.find(config => config.id === creemProductId);
}

// Helper function to get products by type
export function getProductsByType(type: 'pay-as-you-go' | 'monthly' | 'pre-book'): ProductConfig[] {
  return PRODUCT_CONFIGS.filter(config => config.type === type);
}
