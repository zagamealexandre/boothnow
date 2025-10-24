'use client'

import { useState } from 'react'
import { Menu, X, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

export function EnhancedHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <motion.header 
      className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              BoothNow
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <motion.a 
              href="#features" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
              whileHover={{ y: -2 }}
            >
              Features
            </motion.a>
            <motion.a 
              href="#pricing" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
              whileHover={{ y: -2 }}
            >
              Pricing
            </motion.a>
            <motion.a 
              href="#about" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
              whileHover={{ y: -2 }}
            >
              About
            </motion.a>
            <motion.button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900"
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: mobileMenuOpen ? 1 : 0, 
            height: mobileMenuOpen ? 'auto' : 0 
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            <a href="#features" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a href="#pricing" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
              Pricing
            </a>
            <a href="#about" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
              About
            </a>
            <button className="block w-full text-left px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">
              Get Started
            </button>
          </div>
        </motion.div>
      </nav>
    </motion.header>
  )
}
