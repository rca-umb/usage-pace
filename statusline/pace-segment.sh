#!/bin/bash
# Prints the pace segment for Claude Code's statusLine JSON on stdin.
# Usage: pace-segment.sh [flip] [threshold] [countdown]
#   flip=1 shows under pace as positive, threshold is the on-pace margin (5),
#   countdown=1 shows the 5h reset countdown.

input=$(cat)
now=$(date +%s)
flip=${1:-0}
threshold=${2:-5}
show_countdown=${3:-1}

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

five_used=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
five_reset=$(echo "$input" | jq -r '.rate_limits.five_hour.resets_at // empty')
week_used=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')
week_reset=$(echo "$input" | jq -r '.rate_limits.seven_day.resets_at // empty')

parts=""
if [ -n "$five_used" ] && [ -n "$five_reset" ]; then
  parts="5h $(pace_diff "$five_used" "$five_reset" 18000)"
fi
if [ -n "$week_used" ] && [ -n "$week_reset" ]; then
  parts="${parts:+$parts, }7d $(pace_diff "$week_used" "$week_reset" 604800)"
fi

[ -z "$parts" ] && exit 0

out="pace $parts"
if [ "$show_countdown" = "1" ] && [ -n "$five_reset" ]; then
  remaining=$((five_reset - now)); [ "$remaining" -lt 0 ] && remaining=0
  out="$out | 5h resets in $(printf '%dh%02dm' $((remaining / 3600)) $(((remaining % 3600) / 60)))"
fi
printf '%s' "$out"
