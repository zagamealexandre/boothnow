import { Users, MapPin, Clock, Star } from 'lucide-react'

const stats = [
  {
    icon: Users,
    value: '500+',
    label: 'Active Users',
    description: 'Remote professionals using BoothNow',
  },
  {
    icon: MapPin,
    value: '50+',
    label: 'Locations',
    description: '7-Eleven stores across Nordic countries',
  },
  {
    icon: Clock,
    value: '10,000+',
    label: 'Hours Used',
    description: 'Productive work time in our booths',
  },
  {
    icon: Star,
    value: '4.9/5',
    label: 'Rating',
    description: 'Average user satisfaction score',
  },
]

export function StatsSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Remote Professionals
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of professionals who have discovered the perfect 
            workspace solution for their remote work needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4 group-hover:bg-primary-200 transition-colors duration-300">
                <stat.icon className="w-8 h-8 text-primary-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {stat.value}
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-2">
                {stat.label}
              </div>
              <div className="text-gray-600">
                {stat.description}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-12">
            What Our Users Say
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-primary-600 font-bold">A</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Anna Lindqvist</h4>
                  <p className="text-sm text-gray-600">Freelance Designer</p>
                </div>
              </div>
              <div className="flex items-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600">
                "BoothNow has been a game-changer for my client calls. The soundproof 
                environment is perfect, and I love that I only pay for what I use."
              </p>
            </div>

            <div className="card">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-secondary-600 font-bold">E</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Erik Hansen</h4>
                  <p className="text-sm text-gray-600">Remote Developer</p>
                </div>
              </div>
              <div className="flex items-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600">
                "Perfect for when I need to focus on coding. The WiFi is fast and reliable, 
                and the environment is exactly what I need for deep work."
              </p>
            </div>

            <div className="card">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-purple-600 font-bold">M</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Maria Andersson</h4>
                  <p className="text-sm text-gray-600">Consultant</p>
                </div>
              </div>
              <div className="flex items-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600">
                "I use BoothNow for all my client meetings. The professional environment 
                and convenience of 7-Eleven locations make it perfect for my business."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
