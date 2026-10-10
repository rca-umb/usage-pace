# usage-pace

A Claude Code plugin that adds a pace indicator for your 5-hour and 7-day usage to the end of your existing status line:

```
<your status line> | pace 5h -5, 7d +13 | 5h resets in 2h03m
```

Each number is your usage % minus the % of that window already elapsed. The purpose of pace is to show 

For example, if you have reached 50% of your usage only 1 hour into the 5 hour window, you are +30 pace, since you have used 30% more of your limit than time has passed. If you have reached 50% of your usage 4 hours into the 5 hour window, you would be -30 pace since you have used 30% less than time has passed.

The pace numbers are colored based on their value: green is ahead of pace, yellow is on track, red is burning faster than the clock. Optionally, the session color (`/color`) follows your pace too.

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
| Session color follows pace | 5h | `off`, `5h`, `7d` or `worse`: runs `/color green`, `yellow` or `red` as that window's pace changes (`worse` follows whichever is further over pace) |
| Ahead of pace is positive | off | Flips the signs so being under pace shows as `+` |
| On-track band | 5 | Points either side of pace that still count as on track |
| Show 5h reset countdown | on | Appends the time until the 5-hour window resets |
