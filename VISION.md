# Pi Herdr Flock — Technical Vision

## Scope

Automatically inject the installed `herdr --skill` output into Pi context when running inside Herdr, plus a short project-local delegation policy. Instructions only; no execution host.

## Runtime contract

| Concern | Requirement |
| --- | --- |
| Activation | `HERDR_ENV === "1"`, nonempty `HERDR_PANE_ID` and `HERDR_SOCKET_PATH`. Use caller context, never infer the focused pane. |
| Fetch | On `session_start`, clear cached text; call `pi.exec("herdr", ["--skill"], { timeout: 5000 })` once when active. |
| Validation | Accept only `code === 0`, not killed, and nonempty stdout. Preserve complete instruction text; no silent truncation. |
| Storage | In-memory cache only. No bundled fallback, generated file, skill registration, or filesystem writes. |
| Injection | Before the first and every subsequent agent run inside Herdr, assign cached text + policy to the `pi_herdr_flock` prompt section. If `forceSystemPrompt` is already set, also return the current prompt with an explicit `<pi_herdr_flock>` appendix so the model receives the instructions. No prompt-keyword gate. |
| Failure | Leave cache empty; omit the section. Warn once per failed initialization where UI is available, distinguishing missing CLI, timeout/stopped execution, nonzero exit, or empty instructions; include `/reload` recovery guidance. On older Pi versions that discard spawn errors, inspect PATH after an unexplained failed execution. Do not crash Pi or inject stale text. |
| Refresh | Reload/session changes fetch again. Ignore late results from superseded initialization, including after runtime teardown. No periodic refresh or per-turn subprocess. |
| Outside Herdr | No fetch, injected section, or delegation-policy change. |
| Status | Show `🐑 Flock` by default through Pi's extension-status API after successful initialization where UI is available. A string setting `piHerdrFlock.footerStatus` takes precedence over deprecated `PI_HERDR_FLOCK_STATUS`, then the default. An empty string hides the label without disabling instructions. Clear it when inactive or initialization fails; do not replace the footer. |

The implementation uses one extension file, an in-memory cache, an initialization identity, and three hooks: `session_start`, `session_shutdown`, and `before_agent_start`. It normally modifies Pi's structured `systemPromptOptions.sections`, without adding conversation messages. Pi ignores those sections when `forceSystemPrompt` is set, so in that case the hook also returns a `systemPrompt` override preserving the current prompt and appending the labeled instructions.

Pi 1.5.0 is the pinned development version. Tests and TypeScript checks pass against both the supported minimum Pi 1.1.0 and Pi 1.5.0, the latest published 1.x at verification. The CI matrix installs Pi 1.1.0 and the latest 1.x on pushes, pull requests, manual dispatch, and weekly runs. The package uses a `"*"` host peer dependency following Pi's packaging convention; this does not guarantee compatibility outside the documented Pi 1.x range or with every intervening release.

Use the stable section key `pi_herdr_flock`. Assign rather than concatenate; remove extension-owned content when inactive or uninitialized if the API retains it. Reassert instructions on subsequent agent starts; verify behavior across compaction and reload instead of assuming one-time injection survives.

Caching saves process launches, **not context tokens**. Installed-binary changes take effect at the next initialization, not mid-session.

## Delegation policy appendix

Keep CLI output unchanged. Append only Flock's delegation preference; leave operational details to the live skill.

Enabling Flock is the user's standing request to prefer visible Pi workers through Herdr when delegation is useful and permitted. For delegation, this satisfies the Herdr skill's requirement for an explicit request to use Herdr. Flock does not launch workers itself.

- Follow the user's instructions, including restrictions on delegation and editing.
- Default to the current project and Herdr workspace; preserve the user's focus.
- Follow the live Herdr skill for worker setup, verification, and cleanup. Honor requested models and thinking levels.
- After collecting and verifying results, close workers and panes you created; leave pre-existing panes untouched.
- If visible delegation fails, report the blocker; do not silently fall back to hidden workers.

These are instructions, not enforcement. Herdr's own safety and permission rules still apply.

## Non-goals

- Tools, commands, CLI wrappers, widgets, background processes, orchestration, role packs, model-routing configuration, or automatic worker launches.
- Blocking/intercepting competing delegation tools; routing remains model-dependent.
- Lifecycle/session-restore reporting; reuse Herdr's managed Pi integration unchanged.
- Editing `pi-minimal-footer`, Herdr integration files, independently installed skills, or user configuration.
- Installing packages, restarting servers, provisioning worktrees, or managing unrelated terminals.

Deduplication covers this extension's own section only; independently loaded copies of Herdr instructions may still coexist.

## Development

```sh
npm ci
npm test
npm run check
npm pack --dry-run
```

Test a different supported Pi version without changing the manifest or lockfile:

```sh
npm install --no-save --package-lock=false @earendil-works/pi-coding-agent@1.1.0
npm test
npm run check
npm ci # restore the pinned development version
```

Try this checkout without installing: `pi -e ./extensions/index.ts`. Avoid loading the installed package alongside the checkout when testing injection.

## Verification

**Deterministic extension tests**

| Case | Expected |
| --- | --- |
| Missing activation variables | No exec or injected section. |
| Successful initialization; ordinary prompt | One fetch; complete output + appendix injected without mentioning Herdr. |
| Repeated turns | Same section key/content; no additional fetch or text growth. |
| Missing CLI, timeout, killed/nonzero/empty result | No crash, fallback, stale text, or repeated per-turn warnings. |
| Reload/session change | Fresh fetch; older pending result cannot replace current cache. |
| Failed initialization after success | Previous cached instructions not retained. |
| Compaction and continuation | Verify the prompt seam reasserts one section on subsequent starts. |
| Coexisting extensions | Normal structured composition preserves other sections. An existing forced prompt is preserved with Flock appended to model-visible text. |

### Current verification coverage

The integration harness adapts Pi 1.1's internal `emitBeforeAgentStart(prompt, images, systemPromptOptions)` signature to the trigger-object signature used since Pi 1.2. Both paths exercise the real extension loader/runner and prompt renderer. On newer Pi, user and custom-message triggers are checked; on Pi 1.1, the no-prompt/no-images case exercises the legacy dispatch seam, not an end-to-end custom-message run.

`npm test` covers mocked hooks and the installed Pi version's actual extension loader/runner, guarded-context reload teardown, prompt rendering, coexisting extensions, in-memory compaction, and session-start refresh dispatch. Runner-level custom-message starts are also checked without user-only prompt or image fields, including model-visible skill and policy text, forced-prompt preservation, and inactive cleanup. The forced-prompt regression checks rendered model-visible text for the live skill and policy, one labeled appendix across repeated turns, and unchanged forced text when inactive.

Fetch results are controlled except for a real Pi subprocess test of a missing Herdr executable. Triggers are dispatched directly through the extension runner. End-to-end runs initiated by another extension, complete interactive reload/session-switch flows, successful live Herdr instruction loading, and real Herdr workers remain manual integration checks.

The extension's cache is memory-only and it performs no direct filesystem writes or custom conversation-message injection. Pi may persist injected system-prompt sections in session history.

Flock handles full-prompt overrides already present when its hook runs; a later extension can still replace the prompt and hide the appendix. Saved section metadata or a footer status alone is not proof that the provider received the instructions. Live provider delivery remains a manual integration check. Herdr's managed lifecycle integration remains unchanged.

**Behavioral scenarios—not hard guarantees**

- A permitted delegation creates a visible project-local Pi worker with an on-demand expert brief and requested model.
- Parent retains focus, verifies the result, and cleans up owned surfaces.
- Explicit no-delegation/read-only constraints are respected; no hidden fallback or unauthorized topology changes.

## Research basis

Npm/GitHub/web/source review, 2026-10-08: no exact match found; not an exhaustive absence proof.

Closest: [`@sfroment/pi-herdr`](https://github.com/sfroment/pi-herdr) 0.1.17 fetches live instructions but writes/registers skill files, bundles a fallback, adds a tool, and injects prompt-triggered guidance. Other inspected packages add lifecycle reporting, discoverable skills, control tools, or orchestration.

Use the installed CLI as the instruction authority. [Herdr's managed Pi integration](https://herdr.dev/docs/integrations/) already handles lifecycle/session reporting; this extension fills only the automatic-context gap.
