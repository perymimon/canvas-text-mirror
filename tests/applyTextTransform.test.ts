import { describe, it, expect } from 'vitest'
import { applyTextTransform } from '../src/core'

describe('applyTextTransform', () => {
  it('uppercase', () => {
    expect(applyTextTransform('hello world', 'uppercase')).toBe('HELLO WORLD')
  })

  it('lowercase', () => {
    expect(applyTextTransform('HELLO WORLD', 'lowercase')).toBe('hello world')
  })

  it('capitalize', () => {
    expect(applyTextTransform('hello world', 'capitalize')).toBe('Hello World')
  })

  it('capitalize handles mixed case', () => {
    expect(applyTextTransform('hELLO wORLD', 'capitalize')).toBe('HELLO WORLD')
  })

  it('none passes through unchanged', () => {
    expect(applyTextTransform('Hello World', 'none')).toBe('Hello World')
  })

  it('unknown value passes through unchanged', () => {
    expect(applyTextTransform('Hello', 'full-width')).toBe('Hello')
  })

  it('empty string', () => {
    expect(applyTextTransform('', 'uppercase')).toBe('')
  })
})