import { MapPin, Clock, Shield, Wifi, Zap, Users } from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Soundproof Environment',
    description: 'Private, quiet spaces perfect for calls, meetings, and focused work.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    icon: Wifi,
    title: 'High-Speed WiFi',
    description: 'Reliable, fast internet connection for all your work needs.',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    icon: Clock,
    title: 'Pay Per Minute',
    description: 'Only pay for the time you use. No subscriptions, no commitments.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    icon: MapPin,
    title: 'Convenient Locations',
    description: 'Find workspaces in 7-Eleven stores across Stockholm, Norway, and Copenhagen.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    icon: Zap,
    title: 'Instant Access',
    description: 'Reserve and start using your workspace in seconds with our mobile app.',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  {
    icon: Users,
    title: 'Professional Network',
    description: 'Join a community of remote professionals and freelancers.',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for
            <span className="text-gradient block">Productive Remote Work</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our soundproof micro-workspaces are equipped with everything you need 
            to work productively, no matter where you are.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group">
              <div className="card hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mr-4`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Perfect for Remote Professionals
              </h3>
              <p className="text-gray-600 mb-6">
                Whether you're a freelancer, consultant, or remote employee, 
                BoothNow provides the perfect workspace solution for your needs.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  <span className="text-gray-700">Video calls and meetings</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  <span className="text-gray-700">Client consultations</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  <span className="text-gray-700">Focused deep work</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  <span className="text-gray-700">On-the-go productivity</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Soundproof Booth</p>
                      <p className="text-sm text-gray-600">Private & quiet environment</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Wifi className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">High-speed WiFi</p>
                      <p className="text-sm text-gray-600">Reliable internet connection</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Pay per minute</p>
                      <p className="text-sm text-gray-600">Only €0.50 per minute</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
