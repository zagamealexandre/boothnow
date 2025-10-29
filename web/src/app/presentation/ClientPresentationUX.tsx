'use client'

import { useEffect, useState } from 'react'

export default function ClientPresentationUX() {
  const [activeSection, setActiveSection] = useState('')
  useEffect(() => {
    const container = document.getElementById('slides')
    const pills = Array.from(document.querySelectorAll<HTMLAnchorElement>('a.nav-pill'))
    const ids = pills.map((p) => p.dataset.id!).filter(Boolean)
    const NAV_OFFSET = 72

    const setActive = (currentId: string) => {
      setActiveSection(currentId)
      // Update navbar pills if they exist
      pills.forEach((pill) => {
        const isActive = pill.dataset.id === currentId
        pill.classList.toggle('bg-[#2B3F5F]', isActive)
        pill.classList.toggle('text-white', isActive)
        pill.classList.toggle('border-[#2B3F5F]', isActive)
      })
      
      // Update navbar active section via custom event
      const event = new CustomEvent('sectionChange', { detail: { activeSection: currentId } })
      window.dispatchEvent(event)
    }

    const computeCurrent = () => {
      if (!container || ids.length === 0) return ids[0]
      const scrollTop = container.scrollTop
      const containerHeight = container.clientHeight
      let current = ids[0]
      
      for (let i = 0; i < ids.length; i++) {
        const el = document.getElementById(ids[i])
        if (!el) continue
        const top = (el as HTMLElement).offsetTop
        const bottom = top + (el as HTMLElement).offsetHeight
        
        // Check if section is in view (at least 50% visible)
        const sectionVisible = top <= scrollTop + containerHeight * 0.5 && bottom >= scrollTop + containerHeight * 0.5
        if (sectionVisible) {
          current = ids[i]
        }
      }
      return current
    }

    const onScroll = () => setActive(computeCurrent())
    container?.addEventListener('scroll', onScroll, { passive: true })
    setActive(computeCurrent())

    // Click on nav pills -> scroll in container
    const onClick = (e: Event) => {
      e.preventDefault()
      const targetId = (e.currentTarget as HTMLAnchorElement).dataset.id
      const target = targetId ? document.getElementById(targetId) : null
      if (target && container) {
        const top = Math.max((target as HTMLElement).offsetTop - NAV_OFFSET, 0)
        container.scrollTo({ top, behavior: 'smooth' })
      } else if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    pills.forEach((p) => p.addEventListener('click', onClick))

    // Keyboard navigation
    const onKey = (e: KeyboardEvent) => {
      if (!ids.length) return
      const currentId = computeCurrent()
      const idx = ids.indexOf(currentId)
      const goTo = (toIdx: number) => {
        const el = document.getElementById(ids[toIdx])
        if (el && container) {
          const top = Math.max((el as HTMLElement).offsetTop - NAV_OFFSET, 0)
          container.scrollTo({ top, behavior: 'smooth' })
        } else if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        goTo(Math.min(idx + 1, ids.length - 1))
      }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        goTo(Math.max(idx - 1, 0))
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      container?.removeEventListener('scroll', onScroll)
      pills.forEach((p) => p.removeEventListener('click', onClick))
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return null
}


