#!/bin/bash
# Runs the person's own statusLine command, then appends the pace segment.

dir=$(dirname "$0")
input=$(cat)

flip="" threshold="" countdown=""
if [ -f "$dir/options.env" ]; then
  flip=$(sed -n 's/^USAGE_PACE_AHEAD_POSITIVE=//p' "$dir/options.env")
  threshold=$(sed -n 's/^USAGE_PACE_THRESHOLD=//p' "$dir/options.env")
  countdown=$(sed -n 's/^USAGE_PACE_COUNTDOWN=//p' "$dir/options.env")
fi

base=""
if [ -s "$dir/original-command" ]; then
  base=$(printf '%s' "$input" | bash -c "$(cat "$dir/original-command")" 2>/dev/null)
fi
segment=$(printf '%s' "$input" | bash "$dir/pace-segment.sh" "$flip" "$threshold" "$countdown")

if [ -z "$base" ]; then
  printf '%s\n' "$segment"
elif [ -z "$segment" ]; then
  printf '%s\n' "$base"
else
  printf '%s | %s\n' "$base" "$segment"
fi
