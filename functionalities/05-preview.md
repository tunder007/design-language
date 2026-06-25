# Functionality 05 — `preview` (live-reload server for `design.html`)

**Verb:** preview · **Writes:** nothing (a read-only HTTP server) · **Idempotent:** N/A (long-running) · **Order:** the human half of the side-by-side loop

## Purpose
Serve `design.html` over HTTP with **live reload** so the human can watch the design language update
in a browser while the coding agent edits it in the terminal — the "Claude design + preview"
side-by-side workflow. Save the file (via `design create`/`edit`, or the in-page **Export tokens** →
`design edit --from-export`) and the browser reloads automatically. Because `design.html` paints its
own page background with `var(--bg)`, the preview literally matches the app the language empowers.

## Inputs
```
design preview [<design.html>] [--port <n>]
```
- `<design.html>` — path to the page to serve (default `<out>/design.html`, i.e. `./design.html`).
  Must exist.
- `--port <n>` — port to listen on (default `4321`).

## Expected project structure
```
design.html     # served; watched for changes (must exist before starting)
```

## How it works (deterministic)
1. Resolve the file and start a zero-dep `node:http` server (`scripts/preview.mjs`).
2. On each page request, read `design.html` fresh from disk and inject a tiny live-reload client
   before `</body>` — an `EventSource('/__reload')` that calls `location.reload()` on each message.
3. The `/__reload` route is a **Server-Sent Events** stream; connected browsers are tracked.
4. `fs.watch` on the file fires a debounced (≈80ms) `reload` event to every connected client, so a
   save triggers a single browser refresh.
5. Print the URL (`http://localhost:<port>`); the server runs until Ctrl+C.

## Output
A running live-reload server and its URL on stdout. No files are written.

## Safety
- **Read-only.** Serves and watches a file; never modifies anything.
- **Zero dependencies** — plain `node:http` + SSE + `fs.watch` (Node ≥18).
- Resilient to a not-yet-existing file: the watcher is wrapped so the server still serves once the
  file appears (a missing file returns 404 until then).

## Failure modes it prevents
- **Stale manual refresh** — every save reloads the browser, so the preview never lags the tokens.
- **Heavyweight tooling** — no bundler/dev-server dependency just to view a single HTML file.
- **Broken side-by-side loop** — keeps the browser in lockstep with the agent's edits in the terminal.
