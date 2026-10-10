# pi-herdr-flock

A minimal Pi extension that loads the installed `herdr --skill` instructions and appends a local preference for visible Herdr workers. No tools, automatic worker launches, or generated skill files.

## Install

Requires Pi **1.1.0 or newer (1.x)**, Node.js **22.19+**, and `herdr` on PATH.

```sh
pi install git:github.com/Ryu-CZ/pi-herdr-flock
```

Or try this checkout without changing configuration:

```sh
pi -e ./extensions/index.ts
```

## Behavior

Activates only when `HERDR_ENV=1` and both `HERDR_PANE_ID` and `HERDR_SOCKET_PATH` are nonempty. Uses caller context, never the focused pane.

At session start (including reload/session changes), runs `herdr --skill` once with a five-second timeout. Keeps the complete successful stdout in memory and injects it plus delegation guidance into the `pi_herdr_flock` system-prompt section on every agent start. Late results from superseded initialization are ignored.

After successful initialization, the footer shows `🐑 flock` through Pi's extension-status API (also supported by `pi-minimal-footer` when extension statuses are enabled). The indicator clears when inactive or initialization fails.

Override the label with the `PI_HERDR_FLOCK_STATUS` environment variable before launching Pi:

```sh
PI_HERDR_FLOCK_STATUS="my flock" pi
```

An empty value hides the label without disabling the extension.

Failed initialization clears prior instructions and warns once when UI is available. Outside Herdr, the extension does nothing. Installed CLI changes require reload or a new session. Caching saves subprocess launches, not context tokens.

Enabling this extension expresses a standing preference for otherwise-permitted delegation through visible project-local Herdr sibling panes/tabs. It does not override explicit no-delegation constraints or authorize unrelated operations, worktrees, or other projects. Worker selection, verification, focus preservation, and cleanup are model guidance—not enforced behavior. No hidden-worker fallback is authorized.

Only this extension's section is deduplicated; independently loaded Herdr skills may coexist. Herdr's managed Pi lifecycle integration remains unchanged.

## Development

```sh
npm ci
npm test
npm run check
npm pack --dry-run
```

Tests cover mocked hooks plus Pi 1.1.0's actual extension loader/runner, guarded-context reload teardown, prompt rendering, coexisting extensions, in-memory compaction, and session-start refresh dispatch. Fetch results are controlled; complete interactive reload/session-switch flows, live CLI subprocess behavior, and real Herdr workers remain manual integration checks. See [the technical vision](./pi-herdr-flock) for scope and acceptance criteria.

MIT licensed.
