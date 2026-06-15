# Security Policy

> 🇬🇧 English · [🇩🇪 Deutsch](SECURITY.de.md)

## Supported versions
The most recently published version receives security updates.

## Reporting a vulnerability
Please do **not** report security issues publicly as an issue. Email **code@jkaindl.de**
(PGP welcome). You will get a prompt acknowledgement and be kept informed about the fix.

## Auditability & supply chain
Letterhead is built so you can verify what it does by reading it:

- **The source is the release.** The plugin is dependency-free, zero-build Vanilla JS.
  The shipped `main.js` is the committed source — unminified, unbundled, byte-identical.
  There is no build step you have to trust; you can read exactly what runs.
- **No network, no telemetry.** No `fetch`/`XMLHttpRequest`, no remote endpoints, no
  tracking. Everything happens locally in your vault.
- **No dynamic code execution.** No `eval`, no `new Function`, no dynamic `import()`.
  The only module import is Obsidian's own API.
- **External assets only as `data:` URLs.** The single `btoa()` call embeds your
  configured logo (a local vault file) into the letter as a `data:` URL — nothing is
  fetched from the web.
- **Minimal vault access.** Reads notes via the Obsidian API and writes only the
  exported letter into a dedicated export folder (the iOS print path).

### A note on the community scorecard
The directory scorecard flags *"build verification not available"* and *"missing
artifact attestations"*. This is a direct consequence of the deliberate zero-build
design: there is no build to verify because the released file **is** the source. We
treat readable, unbundled source as the stronger guarantee and keep it that way on
purpose (see [`AGENTS.md`](AGENTS.md) → *Abweichungen von der Leitkonvention*).
