"use client"

import { MenuItem, MenuContainer } from "@/components/ui/fluid-menu"
import { Menu as MenuIcon, X, Home, DollarSign, Star } from "lucide-react"
import { useRouter } from "next/navigation"

export function MobileFluidMenu() {
  const router = useRouter()

  const handleNavigation = (path: string) => {
    if (path === 'home') {
      router.push('/')
    } else if (path === 'pricing') {
      router.push('/#pricing')
    } else if (path === 'features') {
      router.push('/#features')
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-kubo-primary/30 to-transparent blur-2xl -z-10 rounded-full" />
        <MenuContainer>
          <MenuItem 
            icon={
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 transition-all duration-300 ease-in-out origin-center opacity-100 scale-100 rotate-0 [div[data-expanded=true]_&]:opacity-0 [div[data-expanded=true]_&]:scale-0 [div[data-expanded=true]_&]:rotate-180">
                  <MenuIcon size={24} strokeWidth={1.5} className="text-kubo-textDark" />
                </div>
                <div className="absolute inset-0 transition-all duration-300 ease-in-out origin-center opacity-0 scale-0 -rotate-180 [div[data-expanded=true]_&]:opacity-100 [div[data-expanded=true]_&]:scale-100 [div[data-expanded=true]_&]:rotate-0">
                  <X size={24} strokeWidth={1.5} className="text-kubo-textDark" />
                </div>
              </div>
            } 
          />
          <MenuItem 
            icon={<Home size={24} strokeWidth={1.5} className="text-kubo-textDark" />} 
            onClick={() => handleNavigation('home')}
          />
          <MenuItem 
            icon={<DollarSign size={24} strokeWidth={1.5} className="text-kubo-textDark" />} 
            onClick={() => handleNavigation('pricing')}
          />
          <MenuItem 
            icon={<Star size={24} strokeWidth={1.5} className="text-kubo-textDark" />} 
            onClick={() => handleNavigation('features')}
          />
        </MenuContainer>
      </div>
    </div>
  )
}
