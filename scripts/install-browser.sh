#!/bin/bash
# Installs the headless Chromium that scripts/screenshot.mjs drives, at the
# exact build the installed `playwright` package expects.
#
# The zip comes from Google's Chrome for Testing bucket first, because
# storage.googleapis.com is on the cloud sessions' default network allowlist
# and cdn.playwright.dev is not. Playwright's own installer is the fallback.
# On Linux it also installs the shared libraries Chromium needs, via apt.
set -euo pipefail

cd "$(dirname "$0")/.."

dry_run="$(npx playwright install --dry-run --only-shell chromium)"
install_dir="$(printf '%s\n' "$dry_run" | awk '/Install location:/ {print $3; exit}')"
download_url="$(printf '%s\n' "$dry_run" | awk '/Download url:/ {print $3; exit}')"

if [ -z "$install_dir" ] || [ -z "$download_url" ]; then
  echo "install-browser: could not read Playwright's dry run:" >&2
  printf '%s\n' "$dry_run" >&2
  exit 1
fi

if [ ! -f "$install_dir/INSTALLATION_COMPLETE" ]; then
  # .../builds/cft/<version>/<platform>/chrome-headless-shell-<platform>.zip
  version="$(printf '%s\n' "$download_url" | sed -n 's#.*/cft/\([^/]*\)/.*#\1#p')"
  platform="$(printf '%s\n' "$download_url" | sed -n 's#.*/cft/[^/]*/\([^/]*\)/.*#\1#p')"
  google_url="https://storage.googleapis.com/chrome-for-testing-public/$version/$platform/chrome-headless-shell-$platform.zip"

  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  if [ -n "$version" ] && curl -fsSL --retry 2 --max-time 300 -o "$tmp/shell.zip" "$google_url"; then
    rm -rf "$install_dir"
    mkdir -p "$install_dir"
    if command -v unzip >/dev/null; then
      unzip -q "$tmp/shell.zip" -d "$install_dir"
    else
      # Python's zipfile drops the executable bits, so restore them after.
      python3 -m zipfile -e "$tmp/shell.zip" "$install_dir"
      chmod -R a+rx "$install_dir"
    fi
    touch "$install_dir/INSTALLATION_COMPLETE"
    echo "install-browser: Chrome Headless Shell $version from storage.googleapis.com"
  else
    echo "install-browser: Google download failed, trying Playwright's installer" >&2
    npx playwright install --only-shell chromium
  fi
fi

if [ "$(uname -s)" = "Linux" ]; then
  binary="$(find "$install_dir" -maxdepth 2 -type f -name chrome-headless-shell | head -n 1)"
  if [ -n "$binary" ] && ldd "$binary" | grep -q "not found"; then
    echo "install-browser: installing Chromium's system libraries"
    sudo=""
    if [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null; then sudo="sudo"; fi
    $sudo npx playwright install-deps chromium
  fi
fi
