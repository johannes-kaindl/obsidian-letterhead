# Security Policy

> 🇬🇧 English · [🇩🇪 Deutsch](SECURITY.de.md)

## Supported versions
The most recently published version receives security updates.

## Reporting a vulnerability
Please do **not** report security issues publicly as an issue. Email **code@jkaindl.de**
(PGP welcome). You will get a prompt acknowledgement and be kept informed about the fix.

## Auditability & supply chain
Letterhead is built so you can verify what it does by reading it:

- **Readable source, reproducibly built.** The plugin is TypeScript in `src/`,
  bundled to `main.js` via `esbuild`. `main.js` is a build artifact — it is
  gitignored and not committed — so there is no byte-identical "source = output"
  file to point at; instead every release is built fresh from the tagged source by
  GitHub Actions and cryptographically attested (see *Verifying a release* below).
  The source itself stays fully readable, unminified, and dependency-light.
- **No network, no telemetry.** No `fetch`/`XMLHttpRequest`, no remote endpoints, no
  tracking. Everything happens locally in your vault.
- **No dynamic code execution.** No `eval`, no `new Function`, no dynamic `import()`.
  The only third-party runtime dependency is Obsidian's own API.
- **External assets only as `data:` URLs.** The single `btoa()` call
  (`src/core/frontmatter.ts`) embeds your configured logo (a local vault file) into
  the letter as a `data:` URL — nothing is fetched from the web.
- **Minimal vault access.** Reads notes via the Obsidian API and writes only the
  exported letter (HTML or the generated PDF) into a dedicated export folder
  (the mobile export path).
- **Own PDF engine, no runtime dependency.** The mobile vector-PDF export is produced
  by a dependency-free PDF writer (the vendored `obsidian-kit` PDF engine under
  `src/vendor/kit/pdf/`) — no third-party PDF library, no `fetch`. The finished file
  is handed to the OS via the system share sheet.

### A note on the community scorecard
Earlier versions of Letterhead were zero-build Vanilla JS, and the directory
scorecard's *"build verification not available"* note reflected that there was no
build to verify — the released file *was* the source. Since the plugin adopted a
TypeScript + esbuild build (to share the PDF engine with other plugins via a vendored
kit — see [`AGENTS.md`](AGENTS.md) → *Abweichungen von der Leitkonvention*), that note
no longer applies in the same way: `main.js` is now genuinely built. Provenance now
comes from the reproducible-build attestation described below, not from source/output
byte-identity.

Releases carry a **GitHub artifact attestation** (Sigstore/SLSA build provenance): the
release workflow checks out the tagged commit, runs `npm ci` + `npm run gate` (which
includes the build), and signs the resulting `main.js`, `manifest.json` and
`styles.css` — the exact bytes it just built, tied by OIDC to the GitHub Actions
workflow run and the tagged commit. You get both: open, readable TypeScript source you
can audit, and cryptographic proof that the shipped build came from that source.

### Verifying a release
Every release is published through GitHub Actions, which builds `main.js` from the
tagged source and signs it with a Sigstore/SLSA build-provenance attestation. You can
confirm that the `main.js` you run was built by this repository's release workflow
from the tagged source:

```sh
gh attestation verify main.js --repo johannes-kaindl/obsidian-letterhead
```

This does not mean the shipped `main.js` is byte-identical to any file in the
repository (there is none — it is build output); it means the attested bytes were
produced by a verifiable build of the tagged commit, not substituted afterwards.
