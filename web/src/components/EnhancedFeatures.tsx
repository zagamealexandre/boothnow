'use client'

import { motion } from 'framer-motion'
import { MapPin, Clock, Shield, Wifi, Zap, Users, Star, CheckCircle } from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Soundproof Environment',
    description: 'Private, quiet spaces perfect for calls, meetings, and focused work.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    delay: 0.1,
  },
  {
    icon: Wifi,
    title: 'High-Speed WiFi',
    description: 'Reliable, fast internet connection for all your work needs.',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    delay: 0.2,
  },
  {
    icon: Clock,
    title: 'Pay Per Minute',
    description: 'Only pay for the time you use. No subscriptions, no commitments.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    delay: 0.3,
  },
  {
    icon: MapPin,
    title: 'Convenient Locations',
    description: 'Find workspaces in 7-Eleven stores across Nordic countries.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    delay: 0.4,
  },
  {
    icon: Zap,
    title: 'Instant Access',
    description: 'Reserve and start using your workspace in seconds with our mobile app.',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    delay: 0.5,
  },
  {
    icon: Users,
    title: 'Professional Network',
    description: 'Join a community of remote professionals and freelancers.',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    delay: 0.6,
  },
]

const testimonials = [
  {
    name: 'Anna Lindqvist',
    role: 'Freelance Designer',
    content: 'BoothNow has been a game-changer for my client calls. The soundproof environment is perfect, and I love that I only pay for what I use.',
    rating: 5,
    avatar: 'A',
  },
  {
    name: 'Erik Hansen',
    role: 'Remote Developer',
    content: 'Perfect for when I need to focus on coding. The WiFi is fast and reliable, and the environment is exactly what I need for deep work.',
    rating: 5,
    avatar: 'E',
  },
  {
    name: 'Maria Andersson',
    role: 'Consultant',
    content: 'I use BoothNow for all my client meetings. The professional environment and convenience of 7-Eleven locations make it perfect for my business.',
    rating: 5,
    avatar: 'M',
  },
]

export function EnhancedFeatures() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
              Productive Remote Work
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our soundproof micro-workspaces are equipped with everything you need 
            to work productively, no matter where you are.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              className="group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: feature.delay }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 group-hover:border-blue-200">
                <div className="flex items-center mb-4">
                  <motion.div 
                    className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mr-4`}
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <motion.div 
          className="mt-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-12">
            What Our Users Say
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex items-center mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 italic">
                  "{testimonial.content}"
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
