import { MapPin, ArrowRight } from 'lucide-react'
import { SignInButton } from '@clerk/nextjs'

export function CtaSection() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Find Your Perfect Workspace?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
            Join thousands of remote professionals who have discovered the perfect 
            workspace solution. Start your first session today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <SignInButton mode="modal">
              <button className="bg-white text-primary-600 hover:bg-gray-50 font-semibold py-4 px-8 rounded-lg text-lg flex items-center space-x-2 transition-colors duration-200">
                <MapPin className="w-5 h-5" />
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </SignInButton>
            
            <div className="text-primary-100 text-sm">
              <p>✓ No setup fees</p>
              <p>✓ Pay only for time used</p>
              <p>✓ Cancel anytime</p>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 pt-8 border-t border-primary-500">
            <p className="text-primary-200 text-sm mb-4">Available in</p>
            <div className="flex flex-wrap justify-center items-center gap-6 text-primary-100">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Stockholm</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Oslo</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Copenhagen</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>More cities coming soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
