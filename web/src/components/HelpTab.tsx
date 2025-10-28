"use client";

import { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Mail, 
  AlertTriangle, 
  Shield, 
  Star, 
  ChevronRight,
  ChevronDown,
  Search,
  BookOpen,
  Video,
  FileText,
  Send,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Calendar,
  Play,
  TrendingUp
} from 'lucide-react';
import { helpService, FAQItem } from '../services/helpService';

interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  items: {
    title: string;
    description: string;
    icon: any;
  }[];
}

export default function HelpTab() {
  const [activeSection, setActiveSection] = useState('get-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState('general');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [isLoadingFAQs, setIsLoadingFAQs] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock FAQs data
  const mockFAQs: FAQItem[] = [
    {
      id: '1',
      question: 'How do I book a booth?',
      answer: 'To book a booth, open the app and go to the Map tab. Find an available booth near you, tap on it, and select "Book now" to scan the QR code, or "Pre-book" to schedule for later. You can also use the QR code scanner directly from the Scan tab.',
      category: 'booking',
      order_index: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      question: 'How do I start a session?',
      answer: 'Once you\'ve booked a booth, go to the booth location and scan the QR code on the booth. The session will start automatically and you\'ll see a live timer and cost counter in your Bookings tab.',
      category: 'sessions',
      order_index: 2,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      question: 'How much does it cost to use a booth?',
      answer: 'We offer two pricing options: Pay-per-minute at €0.50 per minute (1 hour max per session, unlimited sessions) or Membership at €29/month (1.5 hours max per session, 3 sessions per day). You can see the exact cost when booking and during your session in the live cost counter.',
      category: 'pricing',
      order_index: 3,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '4',
      question: 'How do I end my session?',
      answer: 'To end your session, go to the Bookings tab and tap "End Session" on your active session. You can also end it directly from the booth by scanning the QR code again. Your payment will be processed automatically.',
      category: 'sessions',
      order_index: 4,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '5',
      question: 'Can I cancel a pre-booking?',
      answer: 'Yes, you can cancel a pre-booking up to 30 minutes before the scheduled start time. Go to your Bookings tab, find the pre-booking, and tap "Cancel". You won\'t be charged for cancelled pre-bookings.',
      category: 'booking',
      order_index: 5,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '6',
      question: 'How do I earn rewards points?',
      answer: 'You earn points by using booths! Book a booth for 50 points, pre-book for 25 points, and complete sessions for additional points. You can also earn bonus points for consecutive days of usage.',
      category: 'rewards',
      order_index: 6,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '7',
      question: 'What rewards can I claim?',
      answer: 'We partner with 7-Eleven to offer exclusive discounts and free items! Available rewards include coffee discounts, free snacks, lunch combos, and more. Check the Rewards tab to see current offers.',
      category: 'rewards',
      order_index: 7,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '8',
      question: 'How do I use a reward?',
      answer: 'Claim a reward in the Rewards tab, then tap "Use Now" to generate a QR code. Show this QR code to the cashier at participating 7-Eleven stores to redeem your reward.',
      category: 'rewards',
      order_index: 8,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '9',
      question: 'What if I have technical issues?',
      answer: 'If you experience any technical issues, try refreshing the app or logging out and back in. For persistent problems, contact support through the Help tab or email us at support@boothnow.com.',
      category: 'technical',
      order_index: 9,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '10',
      question: 'How do I update my payment method?',
      answer: 'Go to your Profile tab and select "Payment Methods". You can add, remove, or update your payment cards. All payments are processed securely through our payment partners.',
      category: 'account',
      order_index: 10,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '11',
      question: 'Are booths available 24/7?',
      answer: 'Booth availability varies by location. Most booths are available during business hours (8 AM - 10 PM), but some locations may have extended hours. Check the booth details in the app for specific availability.',
      category: 'availability',
      order_index: 11,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '12',
      question: 'Can I extend my session?',
      answer: 'Yes! If your booth is available and no one else has booked it, you can extend your session directly from the Bookings tab. Just tap "Extend Session" and choose how much longer you need.',
      category: 'sessions',
      order_index: 12,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '13',
      question: 'What are the benefits of a membership?',
      answer: 'Membership costs €29/month and includes: 1.5 hours maximum per session (vs 1 hour for pay-per-minute), up to 3 sessions per day, and no per-minute charges. Perfect for regular users who want predictable monthly costs.',
      category: 'pricing',
      order_index: 13,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '14',
      question: 'What are the pay-per-minute limits?',
      answer: 'Pay-per-minute costs €0.50 per minute with a 1-hour maximum per session. There are no daily session limits, so you can use booths as many times as you want throughout the day.',
      category: 'pricing',
      order_index: 14,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // Load FAQs when component mounts or search changes
  useEffect(() => {
    const loadFAQs = async () => {
      setIsLoadingFAQs(true);
      try {
        // For now, use mock data. Later this can be replaced with API call
        const faqData = await helpService.getFAQ(undefined, searchQuery).catch(() => {
          // Fallback to mock data if API fails
          return mockFAQs.filter(faq => 
            !searchQuery || 
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
          );
        });
        setFaqs(faqData);
      } catch (error) {
        console.error('Failed to load FAQs:', error);
        // Use mock data as fallback
        setFaqs(mockFAQs.filter(faq => 
          !searchQuery || 
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ));
      } finally {
        setIsLoadingFAQs(false);
      }
    };

    loadFAQs();
  }, [searchQuery]);

  const helpSections: HelpSection[] = [
    {
      id: 'get-started',
      title: 'Get started',
      description: 'Learn the basics of using BoothNow',
      icon: BookOpen,
      items: [
        {
          title: 'How to book a booth',
          description: 'Step-by-step guide to booking your first workspace',
          icon: MapPin
        },
        {
          title: 'How to start a session',
          description: 'Learn how to begin your workspace session',
          icon: Play
        },
        {
          title: 'Zone guide',
          description: 'Find booths in your area and understand coverage',
          icon: MapPin
        }
      ]
    },
    {
      id: 'ask-for-help',
      title: 'Ask for help',
      description: 'Get support when you need it',
      icon: MessageSquare,
      items: [
        {
          title: 'Report an issue',
          description: 'Report technical problems or booth issues',
          icon: AlertTriangle
        },
        {
          title: 'Chat with us',
          description: 'Get instant help from our support team',
          icon: MessageSquare
        },
        {
          title: 'Emergency support',
          description: '24/7 emergency assistance',
          icon: Phone
        }
      ]
    },
    {
      id: 'learn-more',
      title: 'Learn more',
      description: 'Advanced features and tips',
      icon: Star,
      items: [
        {
          title: 'BoothNow Academy',
          description: 'Master your workspace productivity',
          icon: Star
        },
        {
          title: 'Safety guidelines',
          description: 'Best practices for safe workspace usage',
          icon: Shield
        },
        {
          title: 'Productivity tips',
          description: 'Maximize your workspace experience',
          icon: TrendingUp
        }
      ]
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = !searchQuery || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = ['all', ...Array.from(new Set(faqs.map(faq => faq.category)))];

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingFeedback(true);
    
    try {
      await helpService.submitFeedback({
        type: feedbackType as 'general' | 'bug' | 'feature' | 'improvement',
        message: feedbackMessage,
      });
      
      // Reset form
      setFeedbackMessage('');
      setFeedbackType('general');
      
      // Show success message (you could add a toast notification here)
      alert('Thank you for your feedback! We\'ll get back to you soon.');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const renderGetStarted = () => (
    <div className="space-y-4">
      {helpSections[0].items.map((item, index) => (
        <button
          key={index}
          className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <item.icon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>
      ))}
    </div>
  );

  const renderAskForHelp = () => (
    <div className="space-y-4">
      {helpSections[1].items.map((item, index) => (
        <button
          key={index}
          className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <item.icon className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>
      ))}
    </div>
  );

  const renderLearnMore = () => (
    <div className="space-y-4">
      {helpSections[2].items.map((item, index) => (
        <button
          key={index}
          className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <item.icon className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>
      ))}
    </div>
  );

  const renderFAQ = () => (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      {!isLoadingFAQs && filteredFAQs.length > 0 && (
        <div className="text-sm text-gray-500 px-2">
          {filteredFAQs.length} {filteredFAQs.length === 1 ? 'article' : 'articles'} found
        </div>
      )}

      {/* FAQ Items */}
      <div className="space-y-2">
        {isLoadingFAQs ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-500">Loading FAQs...</p>
          </div>
        ) : (
          <>
            {filteredFAQs.map((faq) => (
              <div key={faq.id} className="bg-white rounded-xl shadow-sm">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  {expandedFAQ === faq.id ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {expandedFAQ === faq.id && (
                  <div className="px-4 pb-4">
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {!isLoadingFAQs && filteredFAQs.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500">Try searching with different keywords</p>
        </div>
      )}

      {!isLoadingFAQs && filteredFAQs.length === 0 && !searchQuery && (
        <div className="text-center py-8">
          <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs available</h3>
          <p className="text-gray-500">Check back later for helpful information</p>
        </div>
      )}
    </div>
  );

  const renderFeedback = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Give us feedback</h3>
        <p className="text-gray-600 mb-6">Help us make BoothNow better by sharing your thoughts and suggestions.</p>
        
        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback Type
            </label>
            <select
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="general">General Feedback</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="improvement">Improvement Suggestion</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Message
            </label>
            <textarea
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder="Tell us what you think..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmittingFeedback || !feedbackMessage.trim()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isSubmittingFeedback ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Feedback</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Contact Options */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Other ways to reach us</h3>
        <div className="space-y-3">
          <button className="w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Live Chat</div>
                <div className="text-sm text-gray-500">Available 24/7</div>
              </div>
            </div>
          </button>
          
          <button className="w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-gray-900">Phone Support</div>
                <div className="text-sm text-gray-500">+46 8 123 456 78</div>
              </div>
            </div>
          </button>
          
          <button className="w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-gray-900">Email Support</div>
                <div className="text-sm text-gray-500">support@boothnow.com</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-[#F3F3F3] p-4 pb-24 overflow-y-auto">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 mb-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Help Center</h1>
        <p className="text-gray-600">Find answers and get support</p>
      </div>

      {/* Section Navigation - Mobile Optimized */}
      <div className="bg-white rounded-xl p-1 mb-4 shadow-sm">
        {/* Mobile: 2x2 grid, Desktop: Horizontal row */}
        <div className="grid grid-cols-2 gap-1 md:flex md:space-x-1">
          {helpSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center justify-center space-x-1 md:space-x-2 py-3 px-2 md:px-4 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <section.icon className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
              <span className="truncate">{section.title}</span>
            </button>
          ))}
          <button
            onClick={() => setActiveSection('faq')}
            className={`flex items-center justify-center space-x-1 md:space-x-2 py-3 px-2 md:px-4 rounded-lg text-xs md:text-sm font-medium transition-colors ${
              activeSection === 'faq'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <HelpCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="truncate">FAQ</span>
          </button>
          <button
            onClick={() => setActiveSection('feedback')}
            className={`flex items-center justify-center space-x-1 md:space-x-2 py-3 px-2 md:px-4 rounded-lg text-xs md:text-sm font-medium transition-colors ${
              activeSection === 'feedback'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <MessageSquare className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="truncate">Feedback</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeSection === 'get-started' && renderGetStarted()}
        {activeSection === 'ask-for-help' && renderAskForHelp()}
        {activeSection === 'learn-more' && renderLearnMore()}
        {activeSection === 'faq' && renderFAQ()}
        {activeSection === 'feedback' && renderFeedback()}
      </div>
    </div>
  );
}
