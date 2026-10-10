# pi-herdr-flock

Automatically loads Herdr's live instructions into Pi and adds a preference for visible, project-local Herdr workers. No extra tools or automatic worker launches.

## Install

Requires Pi **1.1.0+ (1.x)**, Node.js **22.19+**, and `herdr` on PATH.

```sh
pi install git:github.com/Ryu-CZ/pi-herdr-flock
```

Run Pi inside Herdr, then use `/reload` if Pi was already running. Outside Herdr, the extension stays inactive.

## Status

The footer shows `🐑 flock` when instructions have loaded successfully. Compatible with `pi-minimal-footer` when extension statuses are enabled.

Customize the label before launching Pi:

```sh
PI_HERDR_FLOCK_STATUS="my flock" pi
```

An empty value hides the label without disabling the extension.

If instructions cannot load, Pi warns when UI is available and leaves Flock inactive. Check that `herdr --skill` works, then `/reload`. Reload also picks up updated Herdr instructions.

## Delegation limits

Enabling Flock expresses a preference for otherwise-permitted delegation through visible sibling panes or project-local tabs. Explicit no-delegation instructions still apply; other projects, worktrees, and unrelated Herdr operations need separate authorization. No hidden-worker fallback is authorized.

Worker selection, focus preservation, verification, and cleanup are model guidance—not enforced guarantees. Instructions consume context tokens, and separately loaded Herdr skills may duplicate them.

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
