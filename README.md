# canvas-text-mirror

Pixel-perfect DOM text → Canvas 2D mirror.

Clone any HTML subtree onto a canvas with exact fonts, colors, line breaks, and letter-spacing — then layer canvas effects on top: particles, grain dissolve, scanlines, shaders.

```
HTML layer  (z: 1)  — stays visible, links work, SEO intact
Canvas layer (z: 2) — identical text, ready for effects
```

## Install

```bash
npm install canvas-text-mirror
```

## Usage

### Vanilla JS

```ts
import { CanvasMirror } from 'canvas-text-mirror'

const canvas = document.getElementById('my-canvas') as HTMLCanvasElement
const root   = document.getElementById('my-page')   as HTMLElement

// Size canvas to viewport
CanvasMirror.resize(canvas)
window.addEventListener('resize', () => CanvasMirror.resize(canvas))

const mirror = new CanvasMirror({ canvas, root })
await mirror.draw()

// On resize — cheap redraw, no re-walk
mirror.update()

// On content change — re-walk DOM
await mirror.reprepare()

// Clear
mirror.clear()
```

### Vue 3

```ts
import { useCanvasMirror } from 'canvas-text-mirror/vue'

const canvasEl = ref<HTMLCanvasElement | null>(null)
const rootEl   = ref<HTMLElement | null>(null)
const mirror   = useCanvasMirror(canvasEl, rootEl)

onMounted(async () => {
  await nextTick()
  await mirror.draw()
})
onUnmounted(() => mirror.clear())
```

### React

```ts
import { useCanvasMirror } from 'canvas-text-mirror/react'

const canvasRef = useRef<HTMLCanvasElement>(null)
const rootRef   = useRef<HTMLElement>(null)
const mirror    = useCanvasMirror(canvasRef, rootRef)

useEffect(() => {
  mirror.draw()
  return () => mirror.clear()
}, [])
```

## Canvas setup (CSS)

```css
.mirror-canvas {
  position: fixed;
  inset: 0;
  pointer-events: none;  /* HTML links stay clickable */
  z-index: 1000;
}
```

## Effects you can build on this

Once the mirror is drawn, the canvas is a pixel-accurate copy of the text. Use it as the source for:

| Effect | How |
|--------|-----|
| **Particle letterform** | `getImageData()` on the canvas → sample filled pixels → animate particles |
| **Grain dissolve** | Mask drawn text with animated noise via `globalCompositeOperation` |
| **Scanlines** | Draw text at low opacity + sweep horizontal scanlines |
| **Chromatic aberration** | Draw text 3× (R/G/B) with small offsets + `globalCompositeOperation: 'screen'` |
| **Glitch** | Random horizontal slice shifts on canvas regions |

## How it works

The core challenge: canvas has no CSS layout engine. Reproducing browser line breaks in JS is a rabbit hole. The solution: **ask the browser where the lines are**.

`Range.getClientRects()` on each character returns its viewport position. When the `y` changes, a new line started. No layout reimplementation needed.

Y-position uses the CSS line-box model:

```
baseline y = line_box_top + halfLeading + fontBoundingBoxAscent
```

where:
- `line_box_top` comes from `rects[0].top` (unrounded float)
- `halfLeading = (rects[0].height - emHeight) / 2`  — real line height from browser
- `fontBoundingBoxAscent` — font's designed ascender, NOT `actualBoundingBoxAscent` (capHeight)

## License

MIT