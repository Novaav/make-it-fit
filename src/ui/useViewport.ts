import { useEffect, useState } from 'react'
import type { Viewport } from './fit'

const read = (): Viewport => (typeof window === 'undefined' ? { w: 1280, h: 800 } : { w: window.innerWidth, h: window.innerHeight })

/**
 * The window size, updated at most once per frame. A height-only change of under 150 px (a phone's address bar
 * collapsing while scrolling) is ignored, so the layout never jumps in the middle of a drag.
 */
export function useViewport(): Viewport {
  const [vp, setVp] = useState<Viewport>(read)
  useEffect(() => {
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const next = read()
        setVp((prev) => (next.w === prev.w && Math.abs(next.h - prev.h) < 150 ? prev : next))
      })
    }
    window.addEventListener('resize', update)
    update()
    return () => {
      window.removeEventListener('resize', update)
      cancelAnimationFrame(raf)
    }
  }, [])
  return vp
}
