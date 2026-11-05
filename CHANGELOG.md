# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Reduce installation size by keeping developer documentation on GitHub

## [0.3.1] - 2026-11-05

### Fixed

- Remind Pi to close its workers and panes after verifying results, leaving existing panes untouched
- Verify compatibility with Pi 1.5.0
- Explain why Herdr instructions could not load and how to retry

## [0.3.0] - 2026-11-01

### Added

- Customize the footer label with `piHerdrFlock.footerStatus` in Pi settings; use an empty string to hide it

### Deprecated

- Deprecate `PI_HERDR_FLOCK_STATUS` in favor of `piHerdrFlock.footerStatus`; the environment variable remains a fallback

## [0.2.4] - 2026-10-16

### Changed

- Follow Herdr's guidance for worker setup and cleanup
- Stop asking for extra approval to use other projects or Git worktrees; your instructions and Herdr's safety rules still apply

## [0.2.3] - 2026-10-14

### Added

- Add animated previews and a video showing visible worker delegation

### Changed

- Reduce installation size by hosting preview media on GitHub

### Fixed

- Verify compatibility with Pi 1.2.0

## [0.2.2] - 2026-10-12

### Changed

- Capitalize the default footer label to `🐑 Flock`

### Fixed

- Keep Herdr instructions available when another extension replaces Pi's system prompt

## [0.2.1] - 2026-10-10

### Added

- Add delegation diagrams and a preview in the Pi package gallery

## [0.2.0] - 2026-10-10

### Added

- Show `🐑 flock` in the footer when Flock is active; customize it with `PI_HERDR_FLOCK_STATUS`

### Fixed

- Prevent outdated instructions or warnings after reload or shutdown

## [0.1.0] - 2026-10-08

### Added

- Give Pi the installed Herdr instructions and guidance for delegating to visible workers in the current project
- Activate only inside Herdr, when its instructions load successfully

[Unreleased]: https://github.com/Ryu-CZ/pi-herdr-flock/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/Ryu-CZ/pi-herdr-flock/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Ryu-CZ/pi-herdr-flock/compare/v0.2.4...v0.3.0
[0.2.4]: https://github.com/Ryu-CZ/pi-herdr-flock/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/Ryu-CZ/pi-herdr-flock/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/Ryu-CZ/pi-herdr-flock/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Ryu-CZ/pi-herdr-flock/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Ryu-CZ/pi-herdr-flock/releases/tag/v0.2.0
[0.1.0]: https://www.npmjs.com/package/pi-herdr-flock/v/0.1.0
