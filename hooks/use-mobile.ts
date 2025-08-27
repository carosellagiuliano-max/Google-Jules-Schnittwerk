'use client'

import * as React from 'react'

export function useIsMobile(query = '(max-width: 768px)') {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handler = () => setIsMobile(mediaQuery.matches)

    // Set the initial value
    handler()

    // Add listener for changes
    mediaQuery.addEventListener('change', handler)

    // Cleanup listener on unmount
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return isMobile
}
