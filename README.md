<p align="center">
  <img src="src/renderer/assets/hubbly.svg" width="120" alt="Hubbly logo" />
</p>

<h1 align="center">Hubbly</h1>

<p align="center"><b>All your chats in one place — with message scheduling where it's allowed.</b></p>

---

Hubbly is a desktop app (macOS / Windows / Linux) that gathers your messaging services into a single window:

- **WhatsApp · Telegram · Microsoft Teams · Discord · Slack · Messenger · Instagram · Gmail**
- **Scheduled Telegram messages** — delivered by Telegram's own servers at the time you choose, **even when your computer is off**
- **Customizable sidebar** — drag & drop to reorder, "+" to add a connector from the catalog, "−" on hover to remove it (your login is kept if you re-add it later)

## How it works (and why it's safe)

Hubbly is built on two strictly separated layers:

1. **The viewer layer** — every service is the *official web app* (`web.whatsapp.com`, `web.telegram.org`, `teams.microsoft.com`, …) loaded in its own isolated browser view with its own session. No unofficial APIs, no protocol reverse-engineering: using Hubbly is exactly like having those sites open in browser tabs.
2. **The automation layer** — talks **only to official APIs**. Today that means Telegram's MTProto API (via [GramJS](https://github.com/gram-js/gramjs)), used solely to schedule messages with Telegram's *native* server-side scheduling.

By design, **WhatsApp is view-only**: WhatsApp's terms forbid automation on personal accounts, so Hubbly never automates it — you just use the official WhatsApp Web inside the app.

> **Google sign-in note:** Google blocks sign-in inside embedded views, so when you open Gmail the login happens in a separate window. Complete it there once; the session is then kept inside the app.

## Install

### Download (recommended)

Download the latest build for your OS from the [**Releases**](../../releases) page:

| OS | File |
|---|---|
| macOS | `Hubbly-<version>.dmg` |
| Windows | `Hubbly-Setup-<version>.exe` |
| Linux | `Hubbly-<version>.AppImage` |

> **macOS: "Hubbly is damaged and can't be opened"** — it isn't damaged. The app
> is not notarized by Apple (that requires a paid developer certificate), so
> Gatekeeper quarantines anything downloaded from a browser and shows this
> misleading message. After dragging Hubbly to Applications, clear the
> quarantine flag once:
>
> ```bash
> xattr -cr /Applications/Hubbly.app
> ```
>
> Then open it normally. Windows shows a similar SmartScreen warning — click
> "More info" → "Run anyway".

### Run from source

Requires Node.js 20+.

```bash
git clone git@github.com:camboalessandro/hubbly.git
cd hubbly
npm install               # engine deps (Electron, GramJS, TypeScript)
npm install --prefix ui   # UI deps (Angular)
npm run ui:build          # build the Angular UI once
npm start                 # compiles the engine and launches
```

## Project structure & development

Hubbly is two programs in one box, the standard Electron shape:

| Folder | What | Built with |
|---|---|---|
| `src/` | the engine — Electron main process: windows, IPC, Telegram API, storage (TypeScript) | `tsc` → `dist-electron/` |
| `ui/` | the interface — Angular 20 (standalone components + signals) | `ng build` → `ui/dist/` |

They talk over Electron IPC through the `window.hubbly` preload bridge.

While developing, run two terminals:

```bash
npm run ui:watch   # rebuilds the Angular UI on save
npm start          # launches the app (Cmd/Ctrl+R in the window to reload the UI)
```

## Setting up Telegram scheduling (optional)

The viewer works with zero configuration. Scheduling needs free Telegram API credentials, once:

1. Go to [my.telegram.org](https://my.telegram.org) → **API development tools** and create an app (any name). You'll get an `api_id` and an `api_hash`.
2. Start Hubbly with them in the environment:

   ```bash
   TG_API_ID=123456 TG_API_HASH=your_hash npm start
   ```

3. Open the calendar icon (it appears under Telegram in the sidebar), then sign in to the automation layer once — the confirmation code is entered in the terminal for now.

Scheduled messages are stored on Telegram's servers, so they are sent on time even if Hubbly is closed and your machine is asleep or off.

## Troubleshooting the install

`npm install` failing is almost always one of these:

- **Node too old** — Hubbly requires **Node 20+** (`node -v` to check). Update via [nodejs.org](https://nodejs.org) or `nvm install 20`.
- **Electron binary download blocked** — installing Electron downloads a ~100 MB
  binary from GitHub. On flaky networks or behind a proxy this fails with
  `ECONNRESET` / `RequestError`. Retry on a stable connection, or set your proxy
  (`npm config set proxy ...`) / an [Electron mirror](https://www.electronjs.org/docs/latest/tutorial/installation#mirror).
- **"Electron failed to install correctly, please delete node_modules/electron…"**
  on `npm start` — the install finished but Electron's ~100 MB binary was never
  downloaded (its postinstall step was skipped or interrupted). Fix:

  ```bash
  rm -rf node_modules/electron && npm install
  # still failing? force the binary download:
  node node_modules/electron/install.js
  # and make sure this prints "false":
  npm config get ignore-scripts
  ```
- **`EACCES: permission denied` inside `node_modules`** — some files are owned
  by root, usually because a command was once run with `sudo`. Clean up and
  reinstall as your normal user (never run `npm install` with sudo):

  ```bash
  sudo rm -rf node_modules package-lock.json
  npm install
  ```
- Stale state — try `rm -rf node_modules package-lock.json && npm install` as a last resort.

## Development

```bash
npm test          # run the test suite (Vitest)
npm start         # launch the app
npm run dist      # build distributable packages locally (electron-builder)
```

Releases are built automatically by GitHub Actions when a `v*` tag is pushed.

## Legal

- **Telegram** automation uses the official MTProto API with your own credentials — supported by Telegram.
- **WhatsApp** (and every other service) is the unmodified official web app in a sandboxed view. No automation, no unofficial clients.
