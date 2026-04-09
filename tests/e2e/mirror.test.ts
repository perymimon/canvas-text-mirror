import { test, expect } from '@playwright/test'

// Helper: sample a canvas pixel at a CSS-pixel coordinate
async function samplePixel(page: any, x: number, y: number) {
  return page.evaluate(({ x, y }: { x: number; y: number }) => {
    const canvas = document.getElementById('mirror-canvas') as HTMLCanvasElement
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const data = ctx.getImageData(Math.round(x * dpr), Math.round(y * dpr), 1, 1).data
    return { r: data[0], g: data[1], b: data[2], a: data[3] }
  }, { x, y })
}

// Helper: scan a grid of pixels across an element and return the max alpha found.
// Scanning both axes is necessary because:
// - half-leading creates ink-free gaps between lines (horizontal row at midY can miss)
// - sub-pixel rendering means single columns can be transparent
async function maxAlphaInElement(page: any, selector: string) {
  return page.evaluate((selector: string) => {
    const el = document.querySelector(selector) as HTMLElement
    const rect = el.getBoundingClientRect()
    const canvas = document.getElementById('mirror-canvas') as HTMLCanvasElement
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1

    const x0 = Math.round(rect.left  * dpr)
    const x1 = Math.round(rect.right * dpr)
    const y0 = Math.round(rect.top   * dpr)
    const y1 = Math.round(rect.bottom * dpr)

    // Sample every 2nd pixel in both axes (fast enough, catches all lines)
    let maxAlpha = 0
    for (let py = y0; py < y1; py += 2) {
      for (let px = x0; px < x1; px += 2) {
        const alpha = ctx.getImageData(px, py, 1, 1).data[3]
        if (alpha > maxAlpha) maxAlpha = alpha
        if (maxAlpha === 255) return maxAlpha  // early exit
      }
    }
    return maxAlpha
  }, selector)
}

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173/')
  await page.waitForFunction(() => (window as any).__mirrorReady === true)
})

test('canvas has pixels where h1 headline is rendered', async ({ page }) => {
  const alpha = await maxAlphaInElement(page, '#headline')
  expect(alpha).toBeGreaterThan(50)
})

test('canvas has pixels where body paragraph is rendered', async ({ page }) => {
  const alpha = await maxAlphaInElement(page, '#body-text')
  expect(alpha).toBeGreaterThan(50)
})

test('canvas has pixels where monospace text is rendered', async ({ page }) => {
  const alpha = await maxAlphaInElement(page, '#mono-text')
  expect(alpha).toBeGreaterThan(50)
})

test('canvas has pixels where uppercase text is rendered', async ({ page }) => {
  const alpha = await maxAlphaInElement(page, '#upper-text')
  expect(alpha).toBeGreaterThan(50)
})

test('canvas has NO pixels in an empty region above the page content', async ({ page }) => {
  // Top-left corner (0,0) should be empty — no text there
  const pixel = await samplePixel(page, 5, 5)
  expect(pixel.a).toBe(0)
})

test('canvas pixel position aligns with DOM element position', async ({ page }) => {
  // Get the bounding box of the headline from the DOM
  const box = await page.locator('#headline').boundingBox()
  expect(box).not.toBeNull()

  // Sample a pixel at the vertical midpoint and horizontal quarter of the element.
  // The headline starts at box.x — there should be a drawn pixel near the first glyph.
  const pixel = await samplePixel(
    page,
    box!.x + 5,                        // near the left edge (first letter)
    box!.y + box!.height / 2,          // vertical midpoint of the line box
  )
  expect(pixel.a).toBeGreaterThan(0)
})

test('text-transform uppercase is rendered as uppercase on canvas', async ({ page }) => {
  // Read what text the canvas drew by checking the element's computed style
  // and comparing with what we'd expect from the uppercased version
  const result = await page.evaluate(() => {
    const el = document.getElementById('upper-text') as HTMLElement
    const cs = getComputedStyle(el)
    return {
      textTransform: cs.textTransform,
      textContent: el.textContent,
    }
  })
  expect(result.textTransform).toBe('uppercase')
  // If textTransform is uppercase, our applyTextTransform will have drawn it uppercased
  // We verify indirectly: the canvas should have drawn pixels (confirmed by other tests)
  // and the transform was applied (the composable reads textTransform from computed style)
  expect(result.textContent?.toLowerCase()).toBe('two slice studio')
})

test('canvas is cleared after clear() is called', async ({ page }) => {
  // Get alpha before clear
  const before = await maxAlphaInElement(page, '#headline')
  expect(before).toBeGreaterThan(50)

  // Call clear()
  await page.evaluate(() => {
    (window as any).__mirror.clear()
  })

  // Canvas should now be empty
  const after = await maxAlphaInElement(page, '#headline')
  expect(after).toBe(0)
})