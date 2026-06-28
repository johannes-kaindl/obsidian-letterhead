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
  exported letter (HTML or the generated PDF) into a dedicated export folder
  (the mobile export path).
- **Own PDF engine, no new dependency.** The mobile vector-PDF export is produced by
  a small, dependency-free PDF writer inside `main.js` — no library, no `fetch`, no
  build step. The finished file is handed to the OS via the system share sheet. The
  zero-build *source = output* guarantee is unchanged.

### A note on the community scorecard
The directory scorecard's *"build verification not available"* note is a direct
consequence of the deliberate zero-build design: there is no build to verify because
the released file **is** the source. We treat readable, unbundled source as the
stronger guarantee and keep it that way on purpose (see [`AGENTS.md`](AGENTS.md) →
*Abweichungen von der Leitkonvention*).

On top of that readable source, releases carry a **GitHub artifact attestation**
(Sigstore/SLSA build provenance): the release workflow signs the exact committed
`main.js`, `manifest.json` and `styles.css` bytes — it builds nothing, so the attested
subject is byte-for-byte identical to the source you can read. You get both: open
source you can audit by eye, and cryptographic proof of where the released bytes came
from.

### Verifying a release
Every release is published through GitHub Actions, which signs the files with a
Sigstore/SLSA build-provenance attestation. You can confirm that the `main.js` you run
came from this repository's tagged source:

```sh
gh attestation verify main.js --repo johannes-kaindl/obsidian-letterhead
```

The attested digest matches the committed, unbundled `main.js` byte-for-byte.
