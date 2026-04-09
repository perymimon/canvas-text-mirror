import { CanvasMirror } from './core'

/**
 * Svelte factory function — works with both Svelte 4 and Svelte 5.
 *
 * Pass getter functions so the factory can be called at module level
 * (before bind: has run). The getters are called lazily on first draw.
 *
 * @example
 * <script>
 *   import { onMount, onDestroy } from 'svelte'
 *   import { createCanvasMirror } from 'canvas-text-mirror/svelte'
 *
 *   let canvasEl: HTMLCanvasElement
 *   let rootEl: HTMLElement
 *
 *   const mirror = createCanvasMirror(() => canvasEl, () => rootEl)
 *
 *   onMount(async () => { await mirror.draw() })
 *   onDestroy(() => mirror.clear())
 * </script>
 *
 * <canvas bind:this={canvasEl} class="mirror-canvas" />
 * <main bind:this={rootEl}>...</main>
 */
export function createCanvasMirror(
  getCanvas: () => HTMLCanvasElement | null,
  getRoot: () => HTMLElement | null,
) {
  let instance: CanvasMirror | null = null

  function getInstance(): CanvasMirror | null {
    const c = getCanvas()
    const r = getRoot()
    if (!c || !r) return null
    if (!instance) instance = new CanvasMirror({ canvas: c, root: r })
    return instance
  }

  async function draw() {
    await getInstance()?.draw()
  }

  function update() {
    getInstance()?.update()
  }

  async function reprepare() {
    await getInstance()?.reprepare()
  }

  function clear() {
    getInstance()?.clear()
    instance = null
  }

  return { draw, update, reprepare, clear }
}