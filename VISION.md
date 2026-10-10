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
| Injection | On every `before_agent_start` inside Herdr, assign cached text + policy to one namespaced prompt section. No prompt-keyword gate. |
| Failure | Leave cache empty; omit the section. Warn once per failed initialization where UI is available; do not crash Pi or inject stale text. |
| Refresh | Reload/session changes fetch again. Ignore late results from superseded initialization, including after runtime teardown. No periodic refresh or per-turn subprocess. |
| Outside Herdr | No fetch, injected section, or delegation-policy change. |
| Status | Show `🐑 flock` by default (override with `PI_HERDR_FLOCK_STATUS`) through Pi's extension-status API after successful initialization where UI is available. An empty override hides the label. Clear it when inactive or initialization fails; do not replace the footer. |

The implementation uses one extension file, an in-memory cache, an initialization identity, and three hooks: `session_start`, `session_shutdown`, and `before_agent_start`. It modifies Pi's structured `systemPromptOptions.sections` rather than replacing the entire system prompt or adding conversation messages.

Pi 1.1.0 is the pinned development and integration-test version. The package uses a `"*"` host peer dependency following Pi's packaging convention; this does not guarantee compatibility with every Pi version. The README documents the supported minimum as Pi 1.1.0 (1.x).

Use the stable section key `pi_herdr_flock`. Assign rather than concatenate; remove extension-owned content when inactive or uninitialized if the API retains it. Reassert instructions on subsequent agent starts; verify behavior across compaction and reload instead of assuming one-time injection survives.

Caching saves process launches, **not context tokens**. Installed-binary changes take effect at the next initialization, not mid-session.

## Delegation policy appendix

Keep CLI output unchanged. Append a clearly labeled, narrowly scoped user preference:

> This enabled extension expresses the user's standing request to use Herdr for otherwise-permitted Pi delegation. For worker execution only, that satisfies the CLI skill's explicit-Herdr-request requirement and permits project-local sibling panes or tabs. It does not authorize delegation forbidden by the task or unrelated Herdr operations.

Worker guidance:

- Delegate only when useful and permitted. Define the required expert on demand; existing role definitions are optional references.
- Use visible Pi workers through Herdr, not hidden `Agent`/`SubagentWorkflow` mechanisms. This is guidance, not tool enforcement.
- Prefer sibling splits; use tabs when layout requires. Stay in the caller's workspace and working directory; preserve focus. Different projects, new workspaces, and worktrees require separate authorization.
- Give each worker a bounded task, expertise, context, read/edit scope, verification, completion criteria, and model/thinking choice. Honor user preferences; hardcode no providers, roles, or escalation tiers.
- Use returned surface IDs. Observe state and read results; submission is not completion. Inspect timeouts before retrying to avoid duplicate tasks. Access failures need an available model, not identical retries.
- Parent verifies actual results/diffs and relevant checks. Avoid concurrent conflicting writes. Prompt restrictions are not a sandbox.
- Close only task-created surfaces after collecting results unless retention was requested. No silent fallback to hidden workers when Herdr fails.

This appendix is an explicit local policy exception for worker transport and project-local topology—not a claim that upstream Herdr grants blanket permission. Other operations retain the live skill's consent and safety requirements. Later explicit user instructions take precedence over this default preference.

## Non-goals

- Tools, commands, CLI wrappers, widgets, background processes, orchestration, role packs, model-routing configuration, or automatic worker launches.
- Blocking/intercepting competing delegation tools; routing remains model-dependent.
- Lifecycle/session-restore reporting; reuse Herdr's managed Pi integration unchanged.
- Editing `pi-minimal-footer`, Herdr integration files, independently installed skills, or user configuration.
- Installing packages, restarting servers, provisioning worktrees, or managing unrelated terminals.

Deduplication covers this extension's own section only; independently loaded copies of Herdr instructions may still coexist.

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
| Coexisting extensions | Other prompt sections remain intact; no full-prompt replacement. |

### Current verification coverage

`npm test` covers mocked hooks and Pi 1.1.0's actual extension loader/runner, guarded-context reload teardown, prompt rendering, coexisting extensions, in-memory compaction, and session-start refresh dispatch.

Fetch results are controlled. Complete interactive reload/session-switch flows, live CLI subprocess behavior, and real Herdr workers remain manual integration checks.

The extension's cache is memory-only and it performs no direct filesystem writes or custom conversation-message injection. Pi may persist injected system-prompt sections in session history.

Another extension's full-prompt override can hide structured sections from the provider; Flock does not override that behavior. Herdr's managed lifecycle integration remains unchanged.

**Behavioral scenarios—not hard guarantees**

- A permitted delegation creates a visible project-local Pi worker with an on-demand expert brief and requested model.
- Parent retains focus, verifies the result, and cleans up owned surfaces.
- Explicit no-delegation/read-only constraints are respected; no hidden fallback or unauthorized topology changes.

## Research basis

Npm/GitHub/web/source review, 2026-10-08: no exact match found; not an exhaustive absence proof.

Closest: [`@sfroment/pi-herdr`](https://github.com/sfroment/pi-herdr) 0.1.17 fetches live instructions but writes/registers skill files, bundles a fallback, adds a tool, and injects prompt-triggered guidance. Other inspected packages add lifecycle reporting, discoverable skills, control tools, or orchestration.

Use the installed CLI as the instruction authority. [Herdr's managed Pi integration](https://herdr.dev/docs/integrations/) already handles lifecycle/session reporting; this extension fills only the automatic-context gap.
