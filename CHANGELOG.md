# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2026-10-10

### Added

- README badges, delegation diagrams, and Pi package gallery preview metadata; include preview images in the published package

### Changed

- Update the package description and keywords for visible Herdr worker delegation
- Simplify the README, switch installation instructions to npm, and explain the session-start and prompt-injection hooks
- Use a wildcard Pi host peer dependency following Pi's packaging convention; retain documented Pi 1.1.0+ (1.x) compatibility
- Rename the technical vision to `VISION.md` and update it to describe the implemented runtime and verification limits

## [0.2.0] - 2026-10-10

### Added

- Show `🐑 flock` in the footer after successful initialization; configure the label with `PI_HERDR_FLOCK_STATUS` and clear it when inactive or initialization fails
- Pi 1.1.0 runtime integration tests for prompt coexistence, compaction retention/deduplication, inactive removal, reload teardown races, and session-start refresh dispatch

### Changed

- Tighten the user-facing README and move implementation/verification details into the technical vision
- Strengthen regression tests for delegation-policy boundaries, zero headless UI calls, and empty status overrides
- Expand Git exclusions for TypeScript builds, caches, coverage, logs, local environment files, editors, and OS metadata
- Ignore IDE metadata and package archives in Git; exclude Git, IDE, dependencies, and archives from Docker build contexts

### Fixed

- Invalidate pending fetches on session shutdown so late completions cannot access a stale Pi context after reload

## 0.1.0

### Added

- Fetch and cache live Herdr instructions at session initialization
- Inject one structured prompt section with project-local visible-worker guidance
- Omit instructions outside Herdr or after failed initialization
- Ignore superseded initialization results and preserve complete CLI output
- Package metadata, installation documentation, and six runtime-contract tests

[Unreleased]: https://github.com/Ryu-CZ/pi-herdr-flock/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/Ryu-CZ/pi-herdr-flock/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Ryu-CZ/pi-herdr-flock/releases/tag/v0.2.0
