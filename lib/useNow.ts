import { useEffect, useState } from 'react'

// Returns the current time and refreshes it every 15 seconds, so timers keep moving.
export function useNow(ms = 15000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}