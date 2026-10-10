import type { Hook, Register } from 'claude-code'

import { computePace, normalizeThreshold, optionsEnv, sessionColorFor, unwrapStatusLine, wrapStatusLine } from './pace'

const REFRESH_MS = 60_000

type Host = Parameters<Hook<'session.start'>>[0]
type Reading = { kind: string; percentUsed: number; resetsAt?: string }
type Options = { sessionColor: 'off' | '5h' | '7d' | 'worse'; aheadIsPositive: boolean; threshold: number; showCountdown: boolean }

let lastColor: string | undefined

async function paths($: Host) {
  const home = await $.env.get('HOME')
  const dir = `${home}/.claude/usage-pace`

  return { dir, settings: `${home}/.claude/settings.json`, wrapper: `bash "${dir}/wrapper.sh"` }
}

async function readSettings($: Host, path: string) {
  return (await $.fs.exists(path)) ? JSON.parse(await $.fs.read(path)) : {}
}

// Keeps the installed copies of the scripts and options current with this version of the plugin.
async function syncScripts($: Host, options: Options) {
  const { dir } = await paths($)

  for (const file of ['wrapper.sh', 'pace-segment.sh']) {
    await $.fs.write(`${dir}/${file}`, await $.fs.read(`${$.plugin.root}/statusline/${file}`))
  }
  await $.fs.write(`${dir}/options.env`, optionsEnv(options))
}

async function setup($: Host, options: Options) {
  const p = await paths($)
  await syncScripts($, options)

  const { settings, original } = wrapStatusLine(await readSettings($, p.settings), p.wrapper)
  if (original === undefined) {
    return 'usage-pace is already in your status line.'
  }

  await $.fs.write(`${p.dir}/original-command`, original)
  await $.fs.write(p.settings, JSON.stringify(settings, null, 2) + '\n')

  return original === ''
    ? 'Status line set to show usage pace.'
    : 'Usage pace added to the end of your existing status line. Run /pace-remove to undo.'
}

async function remove($: Host) {
  const p = await paths($)
  const current = await readSettings($, p.settings)

  if (current.statusLine?.command !== p.wrapper) {
    return 'usage-pace is not in your status line.'
  }

  const originalPath = `${p.dir}/original-command`
  const original = (await $.fs.exists(originalPath)) ? await $.fs.read(originalPath) : ''
  await $.fs.write(p.settings, JSON.stringify(unwrapStatusLine(current, original), null, 2) + '\n')

  return 'Status line restored.'
}

function tint($: Host, readings: Reading[], options: Options) {
  if (options.sessionColor === 'off') {
    return
  }

  const color = sessionColorFor(computePace(readings, Date.now(), normalizeThreshold(options.threshold)), options.sessionColor)
  if (color !== undefined && color !== lastColor) {
    lastColor = color
    // Queued by the engine until the session is idle.
    $.command.run({ command: 'color', args: color }).catch(() => {
      lastColor = undefined
    })
  }
}

export const register: Register = (on, rawOptions) => {
  const options = rawOptions as unknown as Options
  let timer: { cancel: () => void } | undefined

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'pace-setup', description: 'Add usage pace to the end of your status line' })
    await $.command.register({ name: 'pace-remove', description: 'Restore your status line without usage pace' })

    if (await $.fs.exists(`${(await paths($)).dir}/wrapper.sh`)) {
      await syncScripts($, options)
    }

    const refresh = async () => tint($, (await $.session.usage()).rateLimits, options)
    await refresh()
    timer?.cancel()
    timer = $.clock.every(REFRESH_MS, refresh)

    return next(e)
  })

  on('session.measure', ($, e, next) => {
    tint($, e.rateLimits, options)

    return next(e)
  })

  on('command.run', { command: 'pace-setup' }, async $ => ({ text: await setup($, options) }))

  on('command.run', { command: 'pace-remove' }, async $ => ({ text: await remove($) }))

  on('session.end', ($, e, next) => {
    timer?.cancel()

    return next(e)
  })
}
