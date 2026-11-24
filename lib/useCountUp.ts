import { useEffect, useRef, useState } from 'react'

// Counts a number up (or down) to its target, so changes feel alive.
export function useCountUp(target: number, ms = 900) {
  const [value, setValue] = useState(0)
  const shown = useRef(0) // the number currently on screen

  useEffect(() => {
    const from = shown.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const k = Math.min((now - start) / ms, 1)
      shown.current = Math.round(from + (target - from) * (1 - Math.pow(1 - k, 3)))
      setValue(shown.current)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])

  return value
}
