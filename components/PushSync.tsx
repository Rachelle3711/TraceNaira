'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useKeepPushFresh } from '@/lib/push'
import { useSettings } from '@/lib/settings'

// When the app opens, and when the Profile switches change, update this phone's alert settings
export function PushSync() {
  const { user } = useAuth()
  const [s] = useSettings()
  const [ready, setReady] = useState(false) // wait for the saved settings to load
  useEffect(() => setReady(true), [])
  useKeepPushFresh(user?.uid, s, ready)
  return null
}