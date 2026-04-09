import { useRef, useCallback } from 'react'
import { CanvasMirror } from './core'

/**
 * React hook — thin wrapper around CanvasMirror.
 *
 * @example
 * const canvasRef = useRef<HTMLCanvasElement>(null)
 * const rootRef   = useRef<HTMLElement>(null)
 * const mirror    = useCanvasMirror(canvasRef, rootRef)
 * await mirror.draw()
 */
export function useCanvasMirror(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  rootRef: React.RefObject<HTMLElement | null>,
) {
  const instanceRef = useRef<CanvasMirror | null>(null)

  function getInstance(): CanvasMirror | null {
    const c = canvasRef.current
    const r = rootRef.current
    if (!c || !r) return null
    if (!instanceRef.current) instanceRef.current = new CanvasMirror({ canvas: c, root: r })
    return instanceRef.current
  }

  const draw = useCallback(async () => {
    await getInstance()?.draw()
  }, [])

  const update = useCallback(() => {
    getInstance()?.update()
  }, [])

  const reprepare = useCallback(async () => {
    await getInstance()?.reprepare()
  }, [])

  const clear = useCallback(() => {
    getInstance()?.clear()
    instanceRef.current = null
  }, [])

  return { draw, update, reprepare, clear }
}