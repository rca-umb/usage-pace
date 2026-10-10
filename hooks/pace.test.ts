import { expect, test } from 'claude-code/testing'

import { computePace, normalizeThreshold, optionsEnv, paceDiff, sessionColorFor, toneFor, unwrapStatusLine, wrapStatusLine } from './pace'

const NOW = Date.parse('2026-10-07T12:00:00Z')
const readings = [
  { kind: 'five_hour', percentUsed: 40, resetsAt: new Date(NOW + 2 * 3600_000).toISOString() },
  { kind: 'seven_day', percentUsed: 70, resetsAt: new Date(NOW + 3 * 86400_000).toISOString() },
]

test('paceDiff compares usage with elapsed window time', () => {
  expect(paceDiff(55, NOW + 2 * 3600_000, NOW, 5 * 3600)).toBe(-5)
  expect(paceDiff(70, NOW + 2 * 3600_000, NOW, 5 * 3600)).toBe(10)
})

test('toneFor respects the threshold', () => {
  expect(toneFor(-6, 5)).toBe('success')
  expect(toneFor(5, 5)).toBe('warning')
  expect(toneFor(6, 5)).toBe('error')
  expect(toneFor(6, 10)).toBe('warning')
})

test('sessionColorFor follows the chosen window', () => {
  expect(sessionColorFor(computePace(readings, NOW, 5), '5h')).toBe('green')
  expect(sessionColorFor(computePace(readings, NOW, 5), '7d')).toBe('red')
  expect(sessionColorFor(computePace(readings, NOW, 20), '7d')).toBe('yellow')
  expect(sessionColorFor(computePace(readings, NOW, 5), 'worse')).toBe('red')
  expect(sessionColorFor([], '5h')).toBeUndefined()
  expect(sessionColorFor([], 'worse')).toBeUndefined()
})

test('normalizeThreshold rounds and floors at zero', () => {
  expect(normalizeThreshold(7.4)).toBe(7)
  expect(normalizeThreshold(-3)).toBe(0)
})

test('optionsEnv writes shell-safe values', () => {
  expect(optionsEnv({ aheadIsPositive: true, threshold: 7.4, showCountdown: false })).toBe(
    'USAGE_PACE_AHEAD_POSITIVE=1\nUSAGE_PACE_THRESHOLD=7\nUSAGE_PACE_COUNTDOWN=0\n',
  )
})

test('wrap keeps other settings and remembers the original command', () => {
  const before = { model: 'sonnet', statusLine: { type: 'command', command: 'bash mine.sh', padding: 1 } }
  const { settings, original } = wrapStatusLine(before, 'bash wrapper.sh')

  expect(original).toBe('bash mine.sh')
  expect(settings).toEqual({ model: 'sonnet', statusLine: { type: 'command', command: 'bash wrapper.sh', padding: 1 } })
  expect(wrapStatusLine(settings, 'bash wrapper.sh').original).toBeUndefined()
  expect(unwrapStatusLine(settings, 'bash mine.sh')).toEqual(before)
})

test('unwrap with no original removes statusLine', () => {
  const { settings, original } = wrapStatusLine({ model: 'sonnet' }, 'bash wrapper.sh')

  expect(original).toBe('')
  expect(unwrapStatusLine(settings, '')).toEqual({ model: 'sonnet' })
})
