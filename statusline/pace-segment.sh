#!/bin/bash
# Prints the pace segment for Claude Code's statusLine JSON on stdin.
# Options (env): USAGE_PACE_AHEAD_POSITIVE=1 flips signs, USAGE_PACE_THRESHOLD=5,
# USAGE_PACE_COUNTDOWN=1 shows the 5h reset countdown.

input=$(cat)
now=$(date +%s)
flip=${USAGE_PACE_AHEAD_POSITIVE:-0}
threshold=${USAGE_PACE_THRESHOLD:-5}
show_countdown=${USAGE_PACE_COUNTDOWN:-1}

pace_diff() {
  awk -v u="$1" -v r="$2" -v n="$now" -v w="$3" -v t="$threshold" -v f="$flip" \
    'BEGIN {
       e = (1 - (r - n) / w) * 100; if (e < 0) e = 0; if (e > 100) e = 100;
       x = u - e + 0.5; d = int(x); if (d > x) d -= 1;
       if (d > t) color = "\033[31m";
       else if (d < -t) color = "\033[32m";
       else color = "\033[33m";
       shown = f == 1 ? -d : d;
       s = sprintf("%+d", shown); if (s == "+0" || s == "-0") s = "0";
       printf "%s%s\033[0m", color, s
     }'
}

parts=""
for spec in "five_hour:5h:18000" "seven_day:7d:604800"; do
  IFS=: read -r kind label secs <<<"$spec"
  used=$(echo "$input" | jq -r ".rate_limits.$kind.used_percentage // empty")
  reset=$(echo "$input" | jq -r ".rate_limits.$kind.resets_at // empty")
  if [ -n "$used" ] && [ -n "$reset" ]; then
    seg="$label $(pace_diff "$used" "$reset" "$secs")"
    parts="${parts:+$parts, }$seg"
  fi
done

[ -z "$parts" ] && exit 0

out="pace $parts"
five_reset=$(echo "$input" | jq -r '.rate_limits.five_hour.resets_at // empty')
if [ "$show_countdown" = "1" ] && [ -n "$five_reset" ]; then
  remaining=$((five_reset - now)); [ "$remaining" -lt 0 ] && remaining=0
  out="$out | 5h resets in $(printf '%dh%02dm' $((remaining / 3600)) $(((remaining % 3600) / 60)))"
fi
printf '%s' "$out"
