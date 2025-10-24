"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap, ChevronDown, ChevronUp } from 'lucide-react';

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const plans = [
    {
      id: "payg",
      name: "Pay-as-you-go",
      price: "€0.50/min",
      yearlyPrice: "€0.50/min",
      subtitle: "Only pay for what you use.",
      features: [
        "Start and stop anytime",
        "No subscription required",
        "Access all locations",
        "Billed by the minute"
      ],
      buttonStyle: "outline",
    },
    {
      id: "monthly",
      name: "Monthly",
      price: "€29/mo",
      yearlyPrice: "€24/mo",
      subtitle: "Included minutes and lower rates.",
      features: [
        "Unlimited sessions",
        "90 minutes per session",
        "Lower minute rate",
        "App access and support"
      ],
      badge: "Most Popular",
      buttonStyle: "primary",
    },
    {
      id: "prebook",
      name: "Pre-book",
      price: "from €4/slot",
      yearlyPrice: "from €3.50/slot",
      subtitle: "Reserve ahead, skip the wait.",
      features: [
        "Book specific time slots",
        "Priority access at busy hours",
        "Auto-reminders",
        "Cancel anytime"
      ],
      buttonStyle: "outline",
    },
  ];

  const comparisonData = [
    {
      feature: "Access",
      payg: "All booths",
      monthly: "All booths",
      prebook: "All booths"
    },
    {
      feature: "Max Session Time",
      payg: "60 min",
      monthly: "90 min",
      prebook: "120 min"
    },
    {
      feature: "Priority Booking",
      payg: false,
      monthly: true,
      prebook: true
    },
    {
      feature: "Support Level",
      payg: "Email",
      monthly: "Email + Chat",
      prebook: "Chat + Phone"
    },
    {
      feature: "Reward Discounts",
      payg: "0%",
      monthly: "10%",
      prebook: "10%"
    },
    {
      feature: "Pre-booking",
      payg: false,
      monthly: true,
      prebook: true
    }
  ];

  const faqs = [
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel anytime from your dashboard. You'll keep access until the end of your billing period."
    },
    {
      question: "What happens if I exceed my session time?",
      answer: "Sessions automatically end at the maximum time. You can start a new session right away."
    },
    {
      question: "Can I pre-book multiple booths?",
      answer: "Yes, pre-booking allows up to 2 booths at once for group work."
    },
    {
      question: "Do you offer refunds?",
      answer: "First-time subscribers have a 7-day refund window. No refunds for used time."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section className="bg-[#F9FAFB] py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-[#1A1A1A] mb-4"
          >
            Choose Your Plan
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-[#666] max-w-2xl mx-auto"
          >
            Flexible options for private on-demand workspaces.
          </motion.p>
        </div>

        {/* Pricing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center bg-white rounded-full p-1 shadow-sm border border-[#E6E6E6]">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                !isYearly 
                  ? 'bg-[#2E6A9C] text-white' 
                  : 'text-[#666] hover:text-[#1A1A1A]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                isYearly 
                  ? 'bg-[#2E6A9C] text-white' 
                  : 'text-[#666] hover:text-[#1A1A1A]'
              }`}
            >
              Yearly <span className="text-green-600 ml-1">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative rounded-2xl border p-8 shadow-sm transition-all hover:scale-105 hover:shadow-lg ${
                plan.badge 
                  ? 'border-[#2E6A9C] bg-white' 
                  : 'border-[#E6E6E6] bg-white'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#2E6A9C] text-white px-4 py-1 rounded-full text-sm font-medium">
                    {plan.badge}
                  </span>
                </div>
              )}
              
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-[#1A1A1A]">
                  {isYearly ? plan.yearlyPrice : plan.price}
                </span>
                {isYearly && plan.id !== 'payg' && (
                  <span className="text-sm text-green-600 ml-2">Save 17%</span>
                )}
              </div>
              <p className="text-[#666] mb-6">{plan.subtitle}</p>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-sm text-[#666]">
                    <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                className={`w-full rounded-full px-6 py-3 text-sm font-medium transition-all ${
                  plan.buttonStyle === 'primary'
                    ? 'bg-[#2E6A9C] text-white hover:bg-[#1e4a6b]'
                    : 'border border-[#E2E2E2] text-[#1A1A1A] hover:bg-[#F9F9F9]'
                }`}
              >
                {plan.buttonStyle === 'primary' ? 'Choose Monthly' : 'Choose'}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <h3 className="text-2xl font-bold text-[#1A1A1A] text-center mb-8">
            Feature Comparison
          </h3>
          
          <div className="bg-white rounded-2xl shadow-sm border border-[#E6E6E6] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F9FAFB]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#1A1A1A]">Features</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-[#1A1A1A]">Pay-as-you-go</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-[#1A1A1A]">Monthly</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-[#1A1A1A]">Pre-book</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}>
                      <td className="px-6 py-4 text-sm font-medium text-[#1A1A1A]">{row.feature}</td>
                      <td className="px-6 py-4 text-center text-sm text-[#666]">
                        {typeof row.payg === 'boolean' ? (
                          row.payg ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-red-400 mx-auto" />
                          )
                        ) : (
                          row.payg
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-[#666]">
                        {typeof row.monthly === 'boolean' ? (
                          row.monthly ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-red-400 mx-auto" />
                          )
                        ) : (
                          row.monthly
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-[#666]">
                        {typeof row.prebook === 'boolean' ? (
                          row.prebook ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-red-400 mx-auto" />
                          )
                        ) : (
                          row.prebook
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <h3 className="text-2xl font-bold text-[#1A1A1A] text-center mb-8">
            Frequently Asked Questions
          </h3>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl border border-[#E6E6E6] shadow-sm">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-[#F9FAFB] transition-colors"
                >
                  <span className="font-medium text-[#1A1A1A]">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-[#666]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#666]" />
                  )}
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6 pb-4"
                  >
                    <p className="text-[#666] leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h3 className="text-2xl font-bold text-[#1A1A1A] mb-4">
            Ready to start?
          </h3>
          <p className="text-[#666] mb-6">
            Find your nearest booth and begin your focused work session.
          </p>
          <button className="bg-[#2E6A9C] text-white px-8 py-3 rounded-full font-medium hover:bg-[#1e4a6b] transition-colors">
            Find your nearest booth →
          </button>
        </motion.div>
      </div>
    </section>
  );
}
