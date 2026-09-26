#!/bin/bash
# Prepares a Claude Code cloud session: npm dependencies, the headless
# Chromium behind `npm run shot`, and the Python packages the scripts/hero
# pipeline runs with. Local machines already have all of this, so the hook
# exits early there.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# `npm install` (not `npm ci`) so a resumed session with an existing
# node_modules only fetches what changed.
npm install --no-audit --no-fund --loglevel=error

# A failed browser install should not block the session; screenshots are
# the only thing that needs it, and the error stays in the hook output.
./scripts/install-browser.sh || echo "session-start: browser install failed, run ./scripts/install-browser.sh to retry" >&2

# scripts/hero/*.sh run `uv run --with pillow --with numpy`; warm uv's cache
# so the first rebuild does not wait on PyPI.
if command -v uv >/dev/null; then
  uv run --quiet --with pillow --with numpy python -c "import PIL, numpy" || true
fi
