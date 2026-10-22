#!/usr/bin/env bash
# Usage: bash sync.sh "commit message"
# Pulls, commits everything, pushes the current branch. Stops on conflicts.
set -e
msg="${1:-update}"
branch="$(git rev-parse --abbrev-ref HEAD)"
git pull --rebase origin "$branch" 2>/dev/null || true
git add -A
git commit -m "$msg" || echo "nothing to commit"
git push -u origin "$branch"
