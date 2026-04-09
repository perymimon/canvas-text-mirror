import { describe, it, expect, afterEach, vi } from 'vitest'
import { getRenderedLines } from '../src/core'
import { mockRange, makeTextNode } from './helpers/mockRange'

afterEach(() => vi.restoreAllMocks())

describe('getRenderedLines', () => {
  it('returns empty array for whitespace-only text', () => {
    const node = makeTextNode('   ')
    const lines = getRenderedLines(node)
    expect(lines).toEqual([])
  })

  it('single line — returns one entry with correct text and position', () => {
    mockRange([{ text: 'Hello world', top: 100, left: 50, height: 24 }])
    const node = makeTextNode('Hello world')

    const lines = getRenderedLines(node)

    expect(lines).toHaveLength(1)
    expect(lines[0].text).toBe('Hello world')
    expect(lines[0].top).toBe(100)
    expect(lines[0].left).toBe(50)
    expect(lines[0].height).toBe(24)
  })

  it('two lines — splits at the correct character offset', () => {
    mockRange([
      { text: 'Hello ', top: 100, left: 50, height: 24 },
      { text: 'world',  top: 124, left: 50, height: 24 },
    ])
    const node = makeTextNode('Hello world')

    const lines = getRenderedLines(node)

    expect(lines).toHaveLength(2)
    expect(lines[0].text).toBe('Hello ')
    expect(lines[1].text).toBe('world')
    expect(lines[1].top).toBe(124)
  })

  it('three lines', () => {
    mockRange([
      { text: 'one ',  top: 0,  left: 0, height: 20 },
      { text: 'two ',  top: 20, left: 0, height: 20 },
      { text: 'three', top: 40, left: 0, height: 20 },
    ])
    const node = makeTextNode('one two three')

    const lines = getRenderedLines(node)
    expect(lines).toHaveLength(3)
    expect(lines.map(l => l.text)).toEqual(['one ', 'two ', 'three'])
  })

  it('stores unrounded top (float), not rounded', () => {
    // top is 100.7 — should be stored as-is, not rounded to 101
    mockRange([{ text: 'Hi', top: 100.7, left: 0, height: 20 }])
    const node = makeTextNode('Hi')

    const [line] = getRenderedLines(node)
    expect(line.top).toBe(100.7)
  })

  it('uses rounding only for line-break detection, not for position', () => {
    // Two characters on the same visual line but with different sub-pixel tops.
    // 100.2 and 100.4 both round to 100 → treated as the same line.
    // The stored top must be the unrounded value of the first character.
    mockRange([{ text: 'AB', top: 100, left: 0, height: 20 }])
    const range = document.createRange() as any
    let calls = 0
    range.getClientRects.mockImplementation(() => {
      const tops = [100.2, 100.4]
      const top = tops[calls] ?? 100.4
      const r = new DOMRect(calls * 8, top, 8, 20)
      calls++
      return Object.assign([r], { item: (i: number) => [r][i] ?? null })
    })

    const node = makeTextNode('AB')
    const lines = getRenderedLines(node)

    // Math.round(100.2) === Math.round(100.4) === 100 → one line
    expect(lines).toHaveLength(1)
    expect(lines[0].text).toBe('AB')
    expect(lines[0].top).toBe(100.2)  // stored as the first char's unrounded top
  })

  it('stores height from the first character of each line', () => {
    mockRange([
      { text: 'line1', top: 0,  left: 0, height: 32 },
      { text: 'line2', top: 32, left: 0, height: 24 },
    ])
    const node = makeTextNode('line1line2')

    const lines = getRenderedLines(node)
    expect(lines[0].height).toBe(32)
    expect(lines[1].height).toBe(24)
  })
})