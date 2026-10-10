# pi-herdr-flock

<p>
  <a href="https://www.npmjs.com/package/pi-herdr-flock"><img src="https://img.shields.io/npm/v/pi-herdr-flock" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/pi-herdr-flock"><img src="https://img.shields.io/npm/dt/pi-herdr-flock" alt="npm downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/pi-herdr-flock" alt="license"></a>
  <a href="https://pi.dev/packages/pi-herdr-flock"><img src="https://img.shields.io/badge/pi-package-1a1a2e" alt="pi package"></a>
</p>

Guides Pi to delegate work to a visible flock of Herdr terminals.

![pi-herdr-flock preview](media/github-preview.png)

Flock runs `herdr --skill` through Pi's session-start hook and adds the instructions to the system prompt before each agent run. It encourages delegation through visible panes in your project. It adds no tools and launches no agents. Outside Herdr, it stays inactive.

## Install

Requires Pi **1.1.0 or later (1.x)**, Node.js **22.19.0 or later**, and `herdr` on PATH.

```sh
pi install npm:pi-herdr-flock
```

Run Pi inside Herdr. If Pi was already running, use `/reload`.

## Status

The footer shows `🐑 flock` when instructions have loaded successfully. Compatible with `pi-minimal-footer` when extension statuses are enabled.

Customize the label before launching Pi:

```sh
PI_HERDR_FLOCK_STATUS="my flock" pi
```

An empty value hides the label without disabling the extension.

If instructions cannot load, Pi shows a warning when a UI is available and leaves Flock inactive. Check that `herdr --skill` works, then use `/reload`.

Reload also picks up updated Herdr instructions.

## Delegation limits

Flock provides guidance, not enforcement. Your restrictions still apply. Work in other projects or worktrees, and unrelated Herdr operations, require permission. Hidden workers are not a fallback.

Instructions consume context tokens. Loading a separate Herdr skill may duplicate them.

## Development

```sh
npm ci
npm test
npm run check
npm pack --dry-run
```

Try this checkout without installing: `pi -e ./extensions/index.ts`.

See [the technical vision](./pi-herdr-flock) for runtime contracts, delegation policy, and verification coverage.

MIT licensed.
