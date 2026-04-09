import { describe, it, expect } from 'vitest'

/**
 * Tests for the CSS line-box baseline formula used in drawCached().
 *
 *   baseline y = line.top + halfLeading + fontBoundingBoxAscent
 *   halfLeading = max(0, (line.height - emHeight) / 2)
 *   emHeight    = fontBoundingBoxAscent + fontBoundingBoxDescent
 *
 * These are pure arithmetic tests — no browser APIs needed.
 */

function computeBaselineY(
  lineTop: number,
  lineHeight: number,
  fontAscent: number,
  fontDescent: number,
): number {
  const emHeight = fontAscent + fontDescent
  const halfLeading = Math.max(0, (lineHeight - emHeight) / 2)
  return lineTop + halfLeading + fontAscent
}

describe('baseline formula', () => {
  it('no leading — baseline = lineTop + fontAscent', () => {
    // When line height = em height, halfLeading = 0
    const fontAscent = 13
    const fontDescent = 3
    const emHeight = 16  // = fontAscent + fontDescent

    const y = computeBaselineY(100, emHeight, fontAscent, fontDescent)
    expect(y).toBe(100 + 13)  // 113
  })

  it('leading-tight (1.15 × 16px) — small halfLeading', () => {
    const fontAscent = 13
    const fontDescent = 3
    const lineHeight = 16 * 1.15  // 18.4
    const emHeight = 16

    const halfLeading = (18.4 - 16) / 2  // 1.2
    const expected = 100 + 1.2 + 13      // 114.2

    const y = computeBaselineY(100, lineHeight, fontAscent, fontDescent)
    expect(y).toBeCloseTo(expected)
  })

  it('leading-loose (1.8 × 16px) — larger halfLeading', () => {
    const fontAscent = 13
    const fontDescent = 3
    const lineHeight = 16 * 1.8  // 28.8
    const emHeight = 16

    const halfLeading = (28.8 - 16) / 2  // 6.4
    const expected = 100 + 6.4 + 13      // 119.4

    const y = computeBaselineY(100, lineHeight, fontAscent, fontDescent)
    expect(y).toBeCloseTo(expected)
  })

  it('halfLeading never goes negative (line height < em height edge case)', () => {
    // If a browser returns a rect height smaller than the em box (unlikely but defensive)
    const y = computeBaselineY(100, 10, 13, 3)  // lineHeight 10 < emHeight 16
    // halfLeading clamped to 0, so y = 100 + 0 + 13 = 113
    expect(y).toBe(113)
  })

  it('large font size scales correctly', () => {
    // 40px font, leading-tight 1.15
    const fontAscent = 32   // fontBoundingBoxAscent for a large font
    const fontDescent = 8
    const lineHeight = 40 * 1.15  // 46
    const emHeight = 40

    const halfLeading = (46 - 40) / 2  // 3
    const expected = 200 + 3 + 32      // 235

    const y = computeBaselineY(200, lineHeight, fontAscent, fontDescent)
    expect(y).toBeCloseTo(expected)
  })

  it('correctly distinguishes fontBoundingBoxAscent from capHeight', () => {
    // This is the bug we fixed: capHeight (actualBoundingBoxAscent of 'H')
    // is shorter than fontBoundingBoxAscent. Using capHeight places text too high.
    const lineTop = 100
    const lineHeight = 46  // leading-tight on 40px font
    const fontAscent = 32  // fontBoundingBoxAscent (correct)
    const capHeight = 29   // actualBoundingBoxAscent of 'H' (wrong — too small)
    const fontDescent = 8

    const correct = computeBaselineY(lineTop, lineHeight, fontAscent, fontDescent)
    const wrong   = computeBaselineY(lineTop, lineHeight, capHeight, fontDescent)

    // Wrong formula places baseline higher on screen (smaller y).
    // The net difference is (fontAscent - capHeight) / 2 — not the full delta,
    // because changing ascent also changes emHeight → halfLeading absorbs half the shift.
    expect(correct).toBeGreaterThan(wrong)
    expect(correct - wrong).toBeCloseTo((fontAscent - capHeight) / 2)
  })
})