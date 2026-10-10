# Changelog

## Unreleased

- Ignore IDE metadata and package archives in Git; exclude Git, IDE, dependencies, and archives from Docker build contexts.

## 0.1.0

- Fetch and cache live Herdr instructions at session initialization.
- Inject one structured prompt section with project-local visible-worker guidance.
- Omit instructions outside Herdr or after failed initialization.
- Ignore superseded initialization results and preserve complete CLI output.
- Add package metadata, installation documentation, and six runtime-contract tests.
