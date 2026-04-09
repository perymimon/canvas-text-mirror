import { vi } from 'vitest'

export interface FakeLine {
  text: string
  top: number
  left: number
  height: number
}

/**
 * Mock document.createRange() so getClientRects() returns predictable rects.
 *
 * Pass an array of lines (in order). Each character in the concatenated text
 * maps to its line's top/left/height. The left advances by 8px per character
 * within each line (simplified monospace assumption — enough to test logic).
 */
export function mockRange(lines: FakeLine[]) {
  // Build per-character rect map from the line descriptors
  const charRects: DOMRect[] = []
  for (const line of lines) {
    for (let i = 0; i < line.text.length; i++) {
      charRects.push(new DOMRect(line.left + i * 8, line.top, 8, line.height))
    }
  }

  let startOffset = 0
  let endOffset = 0

  const mockRangeObj = {
    setStart: vi.fn((_node: Node, offset: number) => { startOffset = offset }),
    setEnd:   vi.fn((_node: Node, offset: number) => { endOffset   = offset }),
    getClientRects: vi.fn((): DOMRectList => {
      // We're called with a single character range (end = start + 1)
      const rect = charRects[startOffset]
      if (!rect) return Object.assign([], { item: () => null }) as unknown as DOMRectList
      const list = [rect]
      return Object.assign(list, { item: (i: number) => list[i] ?? null }) as unknown as DOMRectList
    }),
    detach: vi.fn(),
  } as unknown as Range

  vi.spyOn(document, 'createRange').mockReturnValue(mockRangeObj)

  return mockRangeObj
}

export function makeTextNode(text: string): Text {
  return document.createTextNode(text)
}