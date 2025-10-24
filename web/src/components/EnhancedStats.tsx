'use client'

import { motion } from 'framer-motion'
import { Users, MapPin, Clock, Star, TrendingUp, DollarSign } from 'lucide-react'

const stats = [
  {
    icon: Users,
    value: '500+',
    label: 'Active Users',
    description: 'Remote professionals using BoothNow',
    color: 'from-blue-600 to-blue-700',
    delay: 0.1,
  },
  {
    icon: MapPin,
    value: '50+',
    label: 'Locations',
    description: '7-Eleven stores across Nordic countries',
    color: 'from-green-600 to-green-700',
    delay: 0.2,
  },
  {
    icon: Clock,
    value: '10,000+',
    label: 'Hours Used',
    description: 'Productive work time in our booths',
    color: 'from-purple-600 to-purple-700',
    delay: 0.3,
  },
  {
    icon: Star,
    value: '4.9/5',
    label: 'Rating',
    description: 'Average user satisfaction score',
    color: 'from-yellow-600 to-yellow-700',
    delay: 0.4,
  },
]

const metrics = [
  { label: 'Average Session', value: '45 min', icon: Clock },
  { label: 'Cost per Hour', value: '€30', icon: DollarSign },
  { label: 'Growth Rate', value: '+25%', icon: TrendingUp },
]

export function EnhancedStats() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Remote Professionals
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of professionals who have discovered the perfect 
            workspace solution for their remote work needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <motion.div 
              key={index} 
              className="text-center group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: stat.delay }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <motion.div 
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl mb-4 group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <stat.icon className="w-8 h-8 text-blue-600" />
              </motion.div>
              <motion.div 
                className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, delay: stat.delay + 0.2 }}
                viewport={{ once: true }}
              >
                {stat.value}
              </motion.div>
              <div className="text-lg font-semibold text-gray-900 mb-2">
                {stat.label}
              </div>
              <div className="text-gray-600">
                {stat.description}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Metrics */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Key Performance Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {metrics.map((metric, index) => (
              <motion.div 
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center justify-center mb-3">
                  <metric.icon className="w-6 h-6 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-gray-600">{metric.label}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
