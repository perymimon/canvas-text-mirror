export interface TextRecord {
  node: Text
  font: string
  fontSize: number
  color: string
  letterSpacing: string
  textTransform: string
}

export interface RenderedLine {
  text: string
  left: number
  top: number      // unrounded — used for drawing accuracy
  height: number   // actual line-box height from browser rect
}

export interface CanvasMirrorOptions {
  /** The canvas to draw onto */
  canvas: HTMLCanvasElement
  /** The DOM subtree to mirror */
  root: HTMLElement
}

export function applyTextTransform(text: string, transform: string): string {
  if (transform === 'uppercase') return text.toUpperCase()
  if (transform === 'lowercase') return text.toLowerCase()
  if (transform === 'capitalize') return text.replace(/\b\w/g, c => c.toUpperCase())
  return text
}

/**
 * Walk a text node character by character to detect browser line breaks.
 *
 * Rounding is used ONLY for line-break comparison. The stored top/height
 * are unrounded so drawing positions remain sub-pixel accurate.
 */
export function getRenderedLines(node: Text): RenderedLine[] {
  const text = node.textContent || ''
  if (!text.trim()) return []

  const range = document.createRange()
  const lines: RenderedLine[] = []

  let lineStart = 0
  let lineLeft = 0
  let lineTop: number | null = null
  let lineTopKey: number | null = null
  let lineHeight = 0

  for (let i = 0; i < text.length; i++) {
    range.setStart(node, i)
    range.setEnd(node, i + 1)
    const rects = range.getClientRects()
    if (!rects.length) continue

    const r = rects[0]
    const topKey = Math.round(r.top)

    if (lineTopKey === null) {
      lineTopKey = topKey
      lineTop = r.top
      lineLeft = r.left
      lineHeight = r.height
    } else if (topKey !== lineTopKey) {
      lines.push({ text: text.slice(lineStart, i), left: lineLeft, top: lineTop!, height: lineHeight })
      lineStart = i
      lineTopKey = topKey
      lineTop = r.top
      lineLeft = r.left
      lineHeight = r.height
    }
  }

  if (lineTop !== null) {
    lines.push({ text: text.slice(lineStart), left: lineLeft, top: lineTop, height: lineHeight })
  }

  range.detach()
  return lines
}

/**
 * Vanilla JS canvas text mirror.
 *
 * Walks a DOM subtree, reads computed styles, detects exact browser line
 * breaks via Range.getClientRects(), and redraws every text node onto a
 * Canvas 2D context with pixel-perfect position, font, color, and
 * letter-spacing.
 *
 * The canvas is purely additive — HTML text remains visible and interactive
 * underneath. The canvas layer is the foundation for effects: particles,
 * grain dissolve, scanlines, shaders, etc.
 *
 * @example
 * const mirror = new CanvasMirror({ canvas, root: document.body })
 * await mirror.draw()
 * // later:
 * mirror.clear()
 */
export class CanvasMirror {
  private canvas: HTMLCanvasElement
  private root: HTMLElement
  private cache = new Map<Text, TextRecord>()

  constructor({ canvas, root }: CanvasMirrorOptions) {
    this.canvas = canvas
    this.root = root
  }

  async prepare(): Promise<void> {
    await document.fonts.ready
    this.cache.clear()

    const walker = document.createTreeWalker(this.root, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      if (!node.textContent?.trim()) continue

      const parent = node.parentElement
      if (!parent) continue

      const cs = getComputedStyle(parent)
      const fontSize = parseFloat(cs.fontSize)
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`

      this.cache.set(node, {
        node, font, fontSize,
        color: cs.color,
        letterSpacing: cs.letterSpacing,
        textTransform: cs.textTransform,
      })
    }
  }

  drawCached(): void {
    const ctx = this.canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.textBaseline = 'alphabetic'

    for (const rec of this.cache.values()) {
      ctx.font = rec.font
      ctx.fillStyle = rec.color

      // ctx.letterSpacing persists between draws — always reset it
      if ('letterSpacing' in ctx) {
        (ctx as any).letterSpacing = rec.letterSpacing === 'normal' ? '0px' : rec.letterSpacing
      }

      // fontBoundingBoxAscent = distance from baseline to the font's designed
      // ascender (top of em box). CSS uses this for line-box layout.
      // Do NOT use actualBoundingBoxAscent (capHeight) — it's too small and
      // produces font-dependent misalignment.
      const m = ctx.measureText('H')
      const fontAscent = m.fontBoundingBoxAscent
      const emHeight = fontAscent + m.fontBoundingBoxDescent

      for (const line of getRenderedLines(rec.node)) {
        const text = applyTextTransform(line.text, rec.textTransform).trim()
        if (!text) continue

        // line.height = actual CSS line-box height from browser rect.
        // halfLeading = (line_box_height - em_height) / 2
        // baseline y  = line_box_top + halfLeading + fontBoundingBoxAscent
        const halfLeading = Math.max(0, (line.height - emHeight) / 2)
        ctx.fillText(text, line.left, line.top + halfLeading + fontAscent)
      }
    }
  }

  /** Full draw: prepare (if needed) then render */
  async draw(): Promise<void> {
    if (this.cache.size === 0) await this.prepare()
    this.drawCached()
  }

  /** Cheap redraw on resize — re-reads DOM positions, no style re-walk */
  update(): void {
    this.drawCached()
  }

  /** Force re-walk the DOM (call when content changes) */
  async reprepare(): Promise<void> {
    this.cache.clear()
    await this.prepare()
    this.drawCached()
  }

  /** Clear the canvas and discard the cache */
  clear(): void {
    const ctx = this.canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.cache.clear()
  }

  /**
   * Size the canvas to the full viewport, accounting for device pixel ratio.
   * Call on mount and on window resize.
   */
  static resize(canvas: HTMLCanvasElement): void {
    const dpr = window.devicePixelRatio || 1
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    canvas.style.width = window.innerWidth + 'px'
    canvas.style.height = window.innerHeight + 'px'
  }
}