export type PaceTone = 'success' | 'warning' | 'error'

export type PaceWindow = { label: string; diff: number; tone: PaceTone }

type Reading = { kind: string; percentUsed: number; resetsAt?: string }

const WINDOWS = [
  { kind: 'five_hour', label: '5h', seconds: 5 * 3600 },
  { kind: 'seven_day', label: '7d', seconds: 7 * 86400 },
] as const

// Points of usage over (+) or under (-) the share of the window already elapsed.
export const paceDiff = (percentUsed: number, resetsAtMs: number, nowMs: number, windowSeconds: number) => {
  const elapsed = Math.min(100, Math.max(0, (1 - (resetsAtMs - nowMs) / 1000 / windowSeconds) * 100))

  return Math.round(percentUsed - elapsed)
}

export const toneFor = (diff: number, threshold: number): PaceTone =>
  diff > threshold ? 'error' : diff < -threshold ? 'success' : 'warning'

export const computePace = (readings: Reading[], nowMs: number, threshold: number): PaceWindow[] => {
  const windows: PaceWindow[] = []

  for (const { kind, label, seconds } of WINDOWS) {
    const reading = readings.find(r => r.kind === kind)
    const resetsAtMs = reading?.resetsAt ? Date.parse(reading.resetsAt) : NaN

    if (reading && !Number.isNaN(resetsAtMs)) {
      const diff = paceDiff(reading.percentUsed, resetsAtMs, nowMs, seconds)
      windows.push({ label, diff, tone: toneFor(diff, threshold) })
    }
  }

  return windows
}

const SESSION_COLOR: Record<PaceTone, string> = { success: 'green', warning: 'yellow', error: 'red' }

export const sessionColorFor = (windows: PaceWindow[], follow: string) => {
  const window =
    follow === 'worse' && windows.length > 0
      ? windows.reduce((a, b) => (b.diff > a.diff ? b : a))
      : windows.find(w => w.label === follow)

  return window === undefined ? undefined : SESSION_COLOR[window.tone]
}

export const normalizeThreshold = (threshold: number) => Math.max(0, Math.round(threshold))

export const optionsEnv = (o: { aheadIsPositive: boolean; threshold: number; showCountdown: boolean }) =>
  [
    `USAGE_PACE_AHEAD_POSITIVE=${o.aheadIsPositive ? 1 : 0}`,
    `USAGE_PACE_THRESHOLD=${normalizeThreshold(o.threshold)}`,
    `USAGE_PACE_COUNTDOWN=${o.showCountdown ? 1 : 0}`,
  ].join('\n') + '\n'

type StatusLine = { type?: string; command?: string; [key: string]: unknown }

// Points statusLine at the wrapper, returning the command it replaced (or undefined if already wrapped).
export const wrapStatusLine = (settings: { statusLine?: StatusLine }, wrapperCommand: string) => {
  const previous = settings.statusLine?.command

  if (previous === wrapperCommand) {
    return { settings, original: undefined }
  }

  return {
    settings: { ...settings, statusLine: { ...settings.statusLine, type: 'command', command: wrapperCommand } },
    original: previous ?? '',
  }
}

export const unwrapStatusLine = (settings: { statusLine?: StatusLine }, original: string) => {
  const { statusLine, ...rest } = settings

  return original === '' ? rest : { ...rest, statusLine: { ...statusLine, type: 'command', command: original } }
}
