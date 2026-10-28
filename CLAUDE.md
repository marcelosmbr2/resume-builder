# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A desktop resume (CV) generator built on **Tauri 2 + Preact/htm** (no bundler, no npm). The UI is in Brazilian Portuguese (pt-BR) and is a port of the design mockup in `mockup/mockup.html` (see below). PDF export only works on Windows.

## Commands

There is no `package.json` and no JS toolchain. The frontend is served as-is, and the Tauri CLI is not installed globally. Run Tauri commands from the repo root (the CLI finds `src-tauri/` itself) with either:

```bash
npx @tauri-apps/cli@2 dev
```

```bash
npx @tauri-apps/cli@2 build
```

or install the Cargo subcommand once (`cargo install tauri-cli --version "^2"`) and use `cargo tauri dev` / `cargo tauri build`.

Rust-only checks run against `src-tauri/Cargo.toml`:

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

```bash
cargo clippy --manifest-path src-tauri/Cargo.toml
```

There are no tests yet (`cargo test --manifest-path src-tauri/Cargo.toml <name>` runs one once they exist), and nothing lints or tests the JS.

To inspect or script the running app, start it with `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9333` and attach to `http://127.0.0.1:9333` with any Chrome DevTools Protocol client.

## Architecture

- **No bundler.** `tauri.conf.json` sets `build.frontendDist` to `../src` with no `devUrl`, so the files in `src/` load directly as ES modules. Preact, its hooks and htm come from one vendored file, `src/vendor/preact-htm.js` (the `htm/preact/standalone` build). Components are written with htm tagged templates (`html\`...\``), not JSX. Any new dependency must also be vendored.
- **Tauri API via a global.** `app.withGlobalTauri: true` injects `window.__TAURI__`, used in place of `@tauri-apps/api` imports (e.g. `window.__TAURI__.core.invoke`, `.window.getCurrentWindow()`, `.dialog.open()`).
- **Frontend layout.**
  - `src/app.js`: the root `App` class. It holds all state and actions (ported from the mockup's `Component`). It edits the current resume through `upd(fn)`, which `structuredClone`s the data, so an undo just restores a snapshot.
  - `src/screens/*.js`: function components that receive `app` and read `app.state`.
  - `src/components/ResumePage.js`: renders the A4 sheet (794 × 1123 px) for the preview, the thumbnails, the export dialog and the print window.
  - `src/lib/constants.js`: the section `TYPES`, `CONTACT` fields and icon paths.
  - `src/styles.css`: the mockup's theme tokens (`[data-theme]`) plus classes that replace its inline hover styles.
- **Persistence.**
  - `src-tauri/src/storage.rs` keeps preferences (`theme`, `saveDir`) in `app_config_dir()/prefs.json`.
  - The resume library (`{ resumes, folders }`) lives in `<saveDir>/curriculos.json`, next to the exported PDFs. `App` saves it with a debounce and flushes it on window close.
  - Pointing settings at a folder that already holds a library opens it; otherwise the current library is written to that folder.
- **PDF export** (`src-tauri/src/pdf.rs`).
  1. `export_pdf` opens a hidden `print` window on the same `index.html`.
  2. `main.js` sees the window label, pulls the job with `print_job`, renders only `ResumePage` (`print` mode) and calls `print_ready` once fonts are loaded.
  3. Rust then calls WebView2's `ICoreWebView2_7::PrintToPdf` (A4, zero margins) and closes the window.
  - Page margins after page 1 come from the `@page` rules in `styles.css`. `webview2-com`/`windows-core` must stay on the same versions that `wry` uses.
- **Window.**
  - It has no native frame (`decorations: false`), so each screen header draws its own controls (`WinControls`) and is marked `data-tauri-drag-region`.
  - `dragDropEnabled: false` is required: without it, Tauri swallows HTML5 drag events, which the resume-to-folder drag needs.
- **Rust commands.** A new command needs `#[tauri::command]` and an entry in `generate_handler!` in `lib.rs`. JS `invoke` arguments are camelCase versions of the Rust parameter names. `main.rs` only calls `app_lib::run()` and must keep its `windows_subsystem` attribute.
- **Permissions.** `src-tauri/capabilities/default.json` covers the `main` and `print` windows. Window-control and plugin calls fail at runtime unless they are listed there. File opening and revealing go through the app's own `open_file` / `reveal_file` commands, so they need no opener scope.
- **CSP** is disabled (`security.csp: null`).

## Design mockup (`mockup/mockup.html`)

The mockup is the spec for this app. It is git-ignored and exists only in local checkouts that have a copy. It is a ~2.6 MB self-unpacking bundle, so don't read it whole.

- **Line 384:** the UI template and its component logic, as a JSON-encoded string. Decode that one line (JSON-parse it, then HTML-unescape it) and grep the result.
- **Line 372:** the bundled assets, base64 and gzip encoded where marked as compressed. Among them are the `ResumePage` sub-component (`./ResumePage.dc.html`) and the Inter and Alegreya fonts (copied into `src/fonts/`).

The port deliberately leaves out a few things from the mockup:

- the purple desktop backdrop and window frame;
- the sample "Marcelo Moreira" resume and the default folders (the app starts empty);
- the simulated folder pickers and export progress.
