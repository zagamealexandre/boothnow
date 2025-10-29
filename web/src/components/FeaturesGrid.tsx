import { Lock, Clock, MapPin, CreditCard } from 'lucide-react'

export default function FeaturesGrid() {
  const items = [
    { 
      icon: Lock, 
      title: 'NO SETUP', 
      text: 'Walk in, tap, and start your session.' 
    },
    { 
      icon: Clock, 
      title: 'FAIR MINUTES', 
      text: 'Pay only for the time you use.' 
    },
    { 
      icon: MapPin, 
      title: '10 LOCATIONS', 
      text: 'Find your booth conveniently located in Central Stockholm.' 
    },
    { 
      icon: CreditCard, 
      title: 'SIMPLE PLANS', 
      text: 'Subscribe or top up anytime you need.' 
    },
  ]
  
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl tracking-[0.18em] text-kubo-textDark">PRODUCT HIGHLIGHTS</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const IconComponent = item.icon
            return (
              <div key={item.title} className="bg-kubo-secondary rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="font-heading text-lg tracking-[0.16em] text-white mb-2">{item.title}</h3>
                <p className="text-white text-sm font-body">{item.text}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}


