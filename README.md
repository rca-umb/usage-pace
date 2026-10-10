# usage-pace

A Claude Code plugin that adds a pace indicator for your 5-hour and 7-day usage to the end of your existing status line:

```
<your status line> | pace 5h -5, 7d +13 | 5h resets in 2h03m
```

Pace helps you budget your usage across each window. It shows at a glance whether the rate you're using Claude at is sustainable for the rest of the window, so you know whether to ease off or whether you can afford to use more.

Each number is how many percentage points you are above or below an even spread: if 60% of the window has passed and you've used 60% of your limit, your pace is 0. Using 50% in the first hour of a 5-hour window puts you at +30; using 50% over four hours puts you at -30.

The pace numbers are colored by value:

- **Red (over pace):** your usage rate is unsustainable, and at this rate you'll run out before the window resets.
- **Yellow (on pace):** you're close to an even spread (within ±5 by default).
- **Green (under pace):** you're unlikely to run out before the window resets, so you can probably afford to use more.

The session color (`/color`) also follows whichever window is further over pace, unless you turn that off.

Needs a Claude.ai Pro/Max subscription (that's where rate-limit windows are reported), plus `jq` and `bash`.

## Install

```
/plugin install usage-pace --marketplace rca-umb/usage-pace
```

Answer `y` to add the marketplace, then pick a scope. Then run:

```
/pace-setup
```

This keeps your current status line command and appends the pace segment to it. `/pace-remove` puts your original back.

## Settings

Change these in `/config`:

| Setting | Default | What it does |
| --- | --- | --- |
| Session color by pace | worse | `off`, `5h`, `7d` or `worse`: sets `/color` to green, yellow or red to match that window's pace (`worse` follows whichever window is further over pace) |
| Show under pace as positive | off | Flips the signs, so using less than the time elapsed shows as `+12` instead of `-12` |
| On-pace margin (±) | 5 | How many points from pace still count as on pace (yellow) |
| Show 5h reset countdown | on | Appends the time until the 5-hour window resets |

## Uninstall

First restore your original status line:

```
/pace-remove
```

Then uninstall the plugin:

```
/plugin uninstall usage-pace
```

Run `/pace-remove` first: uninstalling alone leaves your status line pointed at the pace scripts in `~/.claude/usage-pace`, which keep running without the plugin to update them. Once both are done, you can delete `~/.claude/usage-pace`.
