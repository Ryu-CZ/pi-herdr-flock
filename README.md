# pi-herdr-flock

<p>
  <a href="https://www.npmjs.com/package/pi-herdr-flock"><img src="https://img.shields.io/npm/v/pi-herdr-flock" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/pi-herdr-flock"><img src="https://img.shields.io/npm/dt/pi-herdr-flock" alt="npm downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/pi-herdr-flock" alt="license"></a>
  <a href="https://pi.dev/packages/pi-herdr-flock"><img src="https://img.shields.io/badge/pi-package-1a1a2e" alt="pi package"></a>
</p>

Guides Pi to delegate work to a visible flock of Herdr terminals.

[![Watch the pi-herdr-flock demo](https://raw.githubusercontent.com/Ryu-CZ/pi-herdr-flock/main/media/readme-preview.gif)](https://raw.githubusercontent.com/Ryu-CZ/pi-herdr-flock/main/media/pi-preview.mp4)

[Watch the full-speed demo](https://raw.githubusercontent.com/Ryu-CZ/pi-herdr-flock/main/media/pi-preview.mp4): Pi delegates to two visible workers, each launches a child, and all four worker panes close after results are collected. The animated preview runs at 2.5× speed.

Flock loads `herdr --skill` at session start and gives Pi guidance for delegating through visible panes in your project. It launches no agents and stays inactive outside Herdr.

## Install

Requires Pi **1.1.0 or later (1.x)**, Node.js **22.19.0 or later**, and `herdr` on PATH. Integration tests run against Pi **1.2.0**.

```sh
pi install npm:pi-herdr-flock
```

Run Pi inside Herdr. If Pi was already running, use `/reload`.

## Status

The footer shows `🐑 Flock` when instructions have loaded successfully. Compatible with `pi-minimal-footer` when extension statuses are enabled.

Customize the label before launching Pi:

```sh
PI_HERDR_FLOCK_STATUS="my flock" pi
```

An empty value hides the label without disabling the extension.

If loading fails, Flock stays inactive and Pi shows a warning when a UI is available. Check `herdr --skill`, then use `/reload`. Reload also picks up updated Herdr instructions.

## Delegation limits

Flock provides guidance, not enforcement. Your restrictions still apply. Work in other projects or worktrees, and unrelated Herdr operations, require permission. Hidden workers are not a fallback.

Instructions consume context tokens. Loading a separate Herdr skill may duplicate them.

See [the technical vision](./VISION.md) for development and design details.

MIT licensed.
