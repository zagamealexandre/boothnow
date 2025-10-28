"use client";

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Clock, 
  Check, 
  Star, 
  Zap, 
  Shield, 
  Gift, 
  ChevronRight,
  Calendar,
  DollarSign,
  TrendingUp,
  Crown,
  Sparkles
} from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  period: string;
  description: string;
  features: string[];
  badge?: string;
  popular?: boolean;
  savings?: string;
  validity?: string;
  buttonText: string;
  buttonStyle: 'primary' | 'secondary' | 'outline';
}

interface Subscription {
  id: string;
  status: string;
  product_name: string;
  current_period_end: string;
  next_transaction_date: string;
}

interface PricingTabProps {
  subscriptions: Subscription[];
  onPlanSelect: (plan: PricingPlan) => void;
}

export default function PricingTab({ subscriptions, onPlanSelect }: PricingTabProps) {
  const [selectedCity, setSelectedCity] = useState('Stockholm');
  const [activeTab, setActiveTab] = useState('pay-as-you-go');

  const cities = [
    { id: 'stockholm', name: 'Stockholm', active: true },
    { id: 'gothenburg', name: 'Gothenburg', active: false },
    { id: 'malmo', name: 'Malmö', active: false },
  ];

  const payAsYouGoPlans: PricingPlan[] = [
    {
      id: 'payg-stockholm',
      name: 'Pay as you go',
      price: '10 kr/unlock + 3 kr/minute',
      period: 'Per session',
      description: 'Stay flexible – ride at standard rates.',
      features: [
        'No subscription required',
        'Start and stop anytime',
        'Access all locations',
        'Billed by the minute'
      ],
      buttonText: 'Start Session',
      buttonStyle: 'outline',
      validity: 'Per session'
    }
  ];

  const monthlyPlans: PricingPlan[] = [
    {
      id: 'monthly-300',
      name: 'Monthly 300',
      price: '349 kr/month',
      originalPrice: '500 kr/month',
      period: 'month',
      description: 'With free unlocks. Cancel anytime.',
      features: [
        '300 mins/month included',
        'Free unlocks',
        'Lower minute rate',
        'Cancel anytime'
      ],
      badge: 'Most Popular',
      popular: true,
      savings: 'Save 71% on a 10-min ride',
      buttonText: 'Subscribe Now',
      buttonStyle: 'primary'
    },
    {
      id: 'monthly-750',
      name: 'Monthly 750',
      price: '699 kr/month',
      originalPrice: '1000 kr/month',
      period: 'month',
      description: 'With free unlocks. Cancel anytime.',
      features: [
        '750 mins/month included',
        'Free unlocks',
        'Lower minute rate',
        'Cancel anytime'
      ],
      savings: 'Save 77% on a 10-min ride',
      buttonText: 'Subscribe Now',
      buttonStyle: 'primary'
    },
    {
      id: 'unlimited-unlocks',
      name: 'Unlimited Unlocks',
      price: '39 kr/month',
      period: 'month',
      description: 'With free unlocks. Cancel anytime.',
      features: [
        'Unlimited unlocks',
        'Save the unlock fee every time',
        'Standard minute rate applies',
        'Cancel anytime'
      ],
      buttonText: 'Subscribe Now',
      buttonStyle: 'secondary'
    }
  ];

  const prepaidPlans: PricingPlan[] = [
    {
      id: 'prepaid-30',
      name: '30 minutes',
      price: '43 kr',
      originalPrice: '90 kr',
      period: 'one-time',
      description: 'Buy minutes at a lower rate. With free unlocks.',
      features: [
        '30 minutes included',
        'Free unlocks',
        'Valid for 1 day',
        'No subscription required'
      ],
      savings: 'Save 65% on a 10-min ride',
      validity: 'Valid for 1 day',
      buttonText: 'Buy Now',
      buttonStyle: 'primary'
    },
    {
      id: 'prepaid-60',
      name: '60 minutes',
      price: '79 kr',
      originalPrice: '180 kr',
      period: 'one-time',
      description: 'Buy minutes at a lower rate. With free unlocks.',
      features: [
        '60 minutes included',
        'Free unlocks',
        'Valid for 3 days',
        'No subscription required'
      ],
      savings: 'Save 68% on a 10-min ride',
      validity: 'Valid for 3 days',
      buttonText: 'Buy Now',
      buttonStyle: 'primary'
    },
    {
      id: 'prepaid-120',
      name: '120 minutes',
      price: '149 kr',
      originalPrice: '360 kr',
      period: 'one-time',
      description: 'Buy minutes at a lower rate. With free unlocks.',
      features: [
        '120 minutes included',
        'Free unlocks',
        'Valid for 7 days',
        'No subscription required'
      ],
      savings: 'Save 72% on a 10-min ride',
      validity: 'Valid for 7 days',
      buttonText: 'Buy Now',
      buttonStyle: 'primary'
    }
  ];

  const getButtonStyles = (style: string) => {
    switch (style) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700';
      case 'secondary':
        return 'bg-gray-100 text-gray-900 hover:bg-gray-200';
      case 'outline':
        return 'border border-blue-600 text-blue-600 hover:bg-blue-50';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700';
    }
  };

  const renderPlanCard = (plan: PricingPlan) => (
    <div key={plan.id} className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all hover:shadow-md ${
      plan.popular ? 'border-blue-200 ring-2 ring-blue-100' : 'border-gray-100'
    }`}>
      {plan.badge && (
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-4">
          <Star className="w-3 h-3 mr-1" />
          {plan.badge}
        </div>
      )}
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{plan.name}</h3>
        {plan.savings && (
          <p className="text-sm text-red-600 font-medium mb-2">{plan.savings}</p>
        )}
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
          {plan.originalPrice && (
            <span className="text-sm text-gray-500 line-through">{plan.originalPrice}</span>
          )}
          {plan.period && (
            <span className="text-sm text-gray-500">/{plan.period}</span>
          )}
        </div>
        {plan.validity && (
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            {plan.validity}
          </div>
        )}
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-gray-700">
              <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => onPlanSelect(plan)}
        className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${getButtonStyles(plan.buttonStyle)}`}
      >
        {plan.buttonText}
      </button>
    </div>
  );

  return (
    <div className="h-full bg-[#F3F3F3] p-4 pb-24 overflow-y-auto">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 mb-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Plans and pricing</h1>
        <p className="text-gray-600">Choose the plan that works best for you</p>
      </div>

      {/* City Selector */}
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">Select City</h3>
        <div className="flex space-x-2">
          {cities.map((city) => (
            <button
              key={city.id}
              onClick={() => setSelectedCity(city.name)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCity === city.name
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl p-1 mb-4 shadow-sm">
        <div className="flex space-x-1">
          {[
            { id: 'pay-as-you-go', label: 'Pay as you go', icon: Zap },
            { id: 'subscribe', label: 'Subscribe monthly', icon: Calendar },
            { id: 'prepaid', label: 'Prepay and save', icon: Gift }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pay as you go */}
      {activeTab === 'pay-as-you-go' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-green-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pay as you go</h3>
            <p className="text-gray-600 mb-4">Stay flexible – ride at standard rates.</p>
            
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">{selectedCity}</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">10 kr/unlock + 3 kr/minute</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscribe monthly */}
      {activeTab === 'subscribe' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscribe monthly</h3>
            <p className="text-gray-600 mb-6">With free unlocks. Cancel anytime.</p>
            
            <div className="grid gap-4">
              {monthlyPlans.map(renderPlanCard)}
            </div>
          </div>
        </div>
      )}

      {/* Prepay and save */}
      {activeTab === 'prepaid' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Prepay and save</h3>
            <p className="text-gray-600 mb-6">Buy minutes at a lower rate. With free unlocks.</p>
            
            <div className="grid gap-4">
              {prepaidPlans.map(renderPlanCard)}
            </div>
          </div>
        </div>
      )}

      {/* Current Subscriptions */}
      {subscriptions.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm mt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Subscriptions</h3>
          <div className="space-y-3">
            {subscriptions.map((subscription) => (
              <div key={subscription.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Crown className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{subscription.product_name}</div>
                    <div className="text-sm text-gray-500">
                      Next billing: {new Date(subscription.next_transaction_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    subscription.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {subscription.status}
                  </span>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="bg-white rounded-xl p-6 shadow-sm mt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
          <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
            Manage
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">•••• •••• •••• 4242</span>
            </div>
            <span className="text-sm text-gray-500">Expires 12/25</span>
          </div>
          <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 transition-colors">
            + Add payment method
          </button>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-xl p-6 shadow-sm mt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
          <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
            View All
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">Monthly 300 Plan</div>
                <div className="text-sm text-gray-500">Dec 1, 2024</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-900">349 kr</div>
              <div className="text-sm text-green-600">Paid</div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">Pay as you go</div>
                <div className="text-sm text-gray-500">Nov 15, 2024</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-900">45 kr</div>
              <div className="text-sm text-green-600">Paid</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
