import type { Ref } from 'vue'
import { CanvasMirror } from './core'

/**
 * Vue 3 composable — thin wrapper around CanvasMirror.
 *
 * @example
 * const canvasEl = ref<HTMLCanvasElement | null>(null)
 * const rootEl   = ref<HTMLElement | null>(null)
 * const mirror   = useCanvasMirror(canvasEl, rootEl)
 * await mirror.draw()
 */
export function useCanvasMirror(
  canvas: Ref<HTMLCanvasElement | null>,
  root: Ref<HTMLElement | null>,
) {
  let instance: CanvasMirror | null = null

  function getInstance(): CanvasMirror | null {
    const c = canvas.value
    const r = root.value
    if (!c || !r) return null
    if (!instance) instance = new CanvasMirror({ canvas: c, root: r })
    return instance
  }

  async function draw() {
    getInstance()?.draw()
  }

  function update() {
    getInstance()?.update()
  }

  async function reprepare() {
    getInstance()?.reprepare()
  }

  function clear() {
    getInstance()?.clear()
    instance = null
  }

  return { draw, update, reprepare, clear }
}