# Changelog

## Unreleased

- Add Pi 1.1.0 runtime integration tests for prompt coexistence, compaction retention/deduplication, inactive removal, reload teardown races, and session-start refresh dispatch.
- Invalidate pending fetches on session shutdown so late completions cannot access a stale Pi context after reload.
- Strengthen regression tests for delegation-policy boundaries, zero headless UI calls, and empty status overrides.
- Show `🐑 flock` in the footer after successful initialization; configure the label with `PI_HERDR_FLOCK_STATUS` and clear it when inactive or initialization fails.
- Expand Git exclusions for TypeScript builds, caches, coverage, logs, local environment files, editors, and OS metadata.
- Ignore IDE metadata and package archives in Git; exclude Git, IDE, dependencies, and archives from Docker build contexts.

## 0.1.0

- Fetch and cache live Herdr instructions at session initialization.
- Inject one structured prompt section with project-local visible-worker guidance.
- Omit instructions outside Herdr or after failed initialization.
- Ignore superseded initialization results and preserve complete CLI output.
- Add package metadata, installation documentation, and six runtime-contract tests.
