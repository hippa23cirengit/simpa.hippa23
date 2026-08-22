"use client"

import { useState, useEffect, useCallback, useRef } from "react"

const TIMEOUT_MS = 2 * 60 * 1000 // 2 minutes

export function useKasirSession(onTimeout?: () => void) {
  const [isKasirMode, setIsKasirMode] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const lockSession = useCallback(() => {
    setIsKasirMode(false)
    if (onTimeout) onTimeout()
  }, [onTimeout])

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (isKasirMode) {
      timeoutRef.current = setTimeout(lockSession, TIMEOUT_MS)
    }
  }, [isKasirMode, lockSession])

  const activateKasir = () => {
    setIsKasirMode(true)
  }

  const deactivateKasir = () => {
    setIsKasirMode(false)
  }

  useEffect(() => {
    if (isKasirMode) {
      resetTimer()
      
      const events = ['mousemove', 'keydown', 'scroll', 'click']
      const handleActivity = () => resetTimer()

      events.forEach(event => document.addEventListener(event, handleActivity))

      return () => {
        events.forEach(event => document.removeEventListener(event, handleActivity))
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
      }
    }
  }, [isKasirMode, resetTimer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return {
    isKasirMode,
    activateKasir,
    deactivateKasir
  }
}
