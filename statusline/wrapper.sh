#!/bin/bash
# Runs the person's own statusLine command, then appends the pace segment.

dir="$HOME/.claude/usage-pace"
input=$(cat)

[ -f "$dir/options.env" ] && . "$dir/options.env"
export USAGE_PACE_AHEAD_POSITIVE USAGE_PACE_THRESHOLD USAGE_PACE_COUNTDOWN

base=""
if [ -s "$dir/original-command" ]; then
  base=$(printf '%s' "$input" | bash -c "$(cat "$dir/original-command")" 2>/dev/null)
fi
segment=$(printf '%s' "$input" | bash "$dir/pace-segment.sh")

if [ -z "$base" ]; then
  printf '%s\n' "$segment"
elif [ -z "$segment" ]; then
  printf '%s\n' "$base"
else
  printf '%s | %s\n' "$base" "$segment"
fi
