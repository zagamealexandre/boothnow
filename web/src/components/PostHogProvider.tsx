'use client'

import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const posthog = usePostHog()

  useEffect(() => {
    if (typeof window !== 'undefined' && posthog) {
      // Initialize PostHog
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false,
        capture_pageleave: false,
      })
    }
  }, [posthog])

  return <>{children}</>
}
