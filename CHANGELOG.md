# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Update the integration harness for Pi 1.2.0 and verify user and custom-message starts, including skill and policy injection, forced-prompt preservation, and inactive cleanup
- Clarify compatibility and verification limits in the README and technical vision; runtime behavior is unchanged

## [0.2.2] - 2026-10-12

### Changed

- Capitalize the default footer label to `🐑 Flock`
- Simplify the README for users; keep development and design details in `VISION.md`

### Fixed

- Fix missing Herdr instructions and delegation guidance when another extension has already replaced Pi's system prompt

## [0.2.1] - 2026-10-10

### Added

- Add README badges, delegation diagrams, and a preview in the Pi package gallery

### Changed

- Clarify the package description for visible Herdr worker delegation
- Simplify the README and document installation through npm

## [0.2.0] - 2026-10-10

### Added

- Show `🐑 flock` in the footer after successful initialization; configure the label with `PI_HERDR_FLOCK_STATUS` and clear it when inactive or initialization fails

### Changed

- Tighten the user-facing README and move implementation/verification details into the technical vision

### Fixed

- Prevent outdated instructions or warnings from appearing when a pending Herdr instruction load finishes after reload or shutdown

## 0.1.0

### Added

- Load the installed Herdr instructions when a session starts inside Herdr
- Give Pi guidance for delegation through visible workers in the current project
- Omit instructions outside Herdr or after failed initialization
- Keep complete Herdr instructions and ignore outdated instruction loads after session changes
- Document installation and usage

[Unreleased]: https://github.com/Ryu-CZ/pi-herdr-flock/compare/v0.2.2...HEAD
[0.2.2]: https://github.com/Ryu-CZ/pi-herdr-flock/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Ryu-CZ/pi-herdr-flock/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Ryu-CZ/pi-herdr-flock/releases/tag/v0.2.0
