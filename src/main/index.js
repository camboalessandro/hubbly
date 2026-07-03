const { app, BrowserWindow, ipcMain, session } = require('electron')
const path = require('path')
const fs = require('fs')
const config = require('../config')
const { createStore } = require('../store/scheduledStore')
const { createTelegramService } = require('../telegram/telegramService')
const { scheduleTelegramMessage } = require('../telegram/scheduler')
const { createClient } = require('../telegram/client')
const { loadSessionString, saveSessionString } = require('../telegram/session')
const { createServicesConfig } = require('../store/servicesConfig')
const { createServicesController } = require('./servicesController')
const { SERVICES } = require('./serviceRegistry')

// Branding: the app is "Hubbly", but Electron derives its userData dir (where
// the persist: partitions live) from the app name — renaming would silently log
// the user out of every service. Pin userData to the original location.
app.setName('Hubbly')
app.setPath('userData', path.join(app.getPath('appData'), 'crosschat'))

fs.mkdirSync(config.dataDir, { recursive: true })
const store = createStore(config.storeFile)
const telegram = createTelegramService({ store, scheduler: scheduleTelegramMessage })

const servicesConfig = createServicesConfig(
  config.servicesFile,
  SERVICES.map((s) => s.id),
  ['whatsapp', 'telegram', 'teams', 'discord'],
)
const servicesController = createServicesController({ catalog: SERVICES, config: servicesConfig })

ipcMain.handle('svc:catalog', () => servicesController.getCatalog())
ipcMain.handle('svc:enabled', () => servicesController.getEnabled())
ipcMain.handle('svc:add', (_e, id) => servicesController.add(id))
ipcMain.handle('svc:remove', (_e, id) => servicesController.remove(id))
ipcMain.handle('svc:reorder', (_e, ids) => servicesController.reorder(ids))

ipcMain.handle('tg:schedule', (_e, input) => telegram.schedule(input))
ipcMain.handle('tg:list', () => telegram.listScheduled())

ipcMain.handle('tg:login', async (_e, phone) => {
  try {
    const input = require('input') // interactive terminal prompt (v1)
    const client = createClient({
      apiId: config.apiId,
      apiHash: config.apiHash,
      sessionString: loadSessionString(config.sessionFile),
    })
    await client.start({
      phoneNumber: async () => phone,
      phoneCode: async () => input.text('Codice ricevuto su Telegram: '),
      password: async () => input.text('Password 2FA (se attiva): '),
      onError: (err) => console.error(err),
    })
    saveSessionString(config.sessionFile, client.session.save())
    telegram.setClient(client)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e.message || e) }
  }
})

// How Ferdium/Franz get Google sign-in working in an Electron webview: do NOT
// fake a Chrome UA. A hardcoded UA (or faked Sec-CH-UA) mismatches Electron's
// real Client Hints, and that inconsistency is exactly what Google flags as
// "browser may not be secure". Instead take Electron's REAL user-agent and just
// strip the "Electron/x" and app-name tokens, leaving a genuine, self-consistent
// Chrome identity.
function cleanUserAgent(ua) {
  return ua
    .replace(/ Electron\/[\d.]+/i, '')
    .replace(/ crosschat\/[\d.]+/i, '') // package name token
    .replace(/ Hubbly\/[\d.]+/i, '') // product name token
    .replace(/\s{2,}/g, ' ')
    .trim()
}

let mainWindow = null
let authWindow = null

// Google blocks sign-in inside an Electron <webview> ("browser may not be
// secure") but allows it in a real BrowserWindow — verified: same Chromium,
// same UA, only the window type differs. So when a service webview tries to
// navigate to Google's sign-in, open it in a real child window that shares the
// service's session. After login it lands back on the service, and we close the
// window and reload the webview — now authenticated.
// The sign-in window presents itself as Firefox: Google's embedded-browser
// check targets Chromium wrappers via Client Hints, and Firefox has none, so
// its identity is self-consistent and gets the plain sign-in flow. (Widely
// used workaround for Electron apps.)
const FIREFOX_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:139.0) Gecko/20100101 Firefox/139.0'

// Firefox sends no Sec-CH-UA headers — strip the ones Chromium adds so the
// identity stays coherent on Google's sign-in origin. Registered once per session.
const chStrippedSessions = new WeakSet()
function stripClientHintsForGoogleAuth(sess) {
  if (chStrippedSessions.has(sess)) return
  chStrippedSessions.add(sess)
  sess.webRequest.onBeforeSendHeaders({ urls: ['https://accounts.google.com/*'] }, (details, callback) => {
    const h = details.requestHeaders
    for (const k of Object.keys(h)) {
      if (k.toLowerCase().startsWith('sec-ch-ua')) delete h[k]
    }
    callback({ requestHeaders: h })
  })
}

// Shown in the webview while the sign-in happens in the separate window.
const AUTH_PLACEHOLDER =
  'data:text/html;charset=utf-8,' +
  encodeURIComponent(`<!doctype html>
<html><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f6f9;font-family:system-ui,sans-serif;color:#171c28">
<div style="text-align:center;max-width:380px;padding:24px">
<h2 style="margin:0 0 8px;font-size:20px">Accesso a Google</h2>
<p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6">Completa il login nella finestra che si &egrave; aperta.<br>Se l'hai chiusa, clicca di nuovo l'icona di Gmail per riaprirla.</p>
</div></body></html>`)

async function openGoogleAuth(contents, url) {
  if (authWindow && !authWindow.isDestroyed()) {
    authWindow.focus()
    return
  }
  const sess = contents.session
  stripClientHintsForGoogleAuth(sess)

  // Past blocked attempts (fake UA, old Chrome) may have left "insecure
  // browser" flags in this partition's cookies; we only get here when the
  // user is NOT signed in, so starting from a clean slate is safe.
  try {
    await sess.clearStorageData()
  } catch (e) {
    /* best effort */
  }

  authWindow = new BrowserWindow({
    width: 520,
    height: 660,
    parent: mainWindow || undefined,
    title: 'Accedi a Google',
    autoHideMenuBar: true,
    webPreferences: { session: sess },
  })
  authWindow.webContents.setUserAgent(FIREFOX_UA)
  authWindow.loadURL(url)
  contents.loadURL(AUTH_PLACEHOLDER) // tell the user where the login went

  const backToService = (u) => {
    if (u.includes('mail.google.com') && !u.includes('accounts.')) {
      if (authWindow && !authWindow.isDestroyed()) authWindow.close()
      contents.loadURL('https://mail.google.com/mail/u/0/')
    }
  }
  authWindow.webContents.on('did-navigate', (_e, u) => backToService(u))
  authWindow.webContents.on('will-redirect', (_e, u) => backToService(u))
  authWindow.on('closed', () => {
    authWindow = null
  })
}

app.on('web-contents-created', (_e, contents) => {
  if (contents.getType() !== 'webview') return

  contents.setWindowOpenHandler(({ url }) => {
    if (url.includes('accounts.google.com')) {
      openGoogleAuth(contents, url)
      return { action: 'deny' }
    }
    // Other popups (media, etc.) open as a child window sharing the session.
    return {
      action: 'allow',
      overrideBrowserWindowOptions: { webPreferences: { session: contents.session } },
    }
  })

  const routeGoogleAuth = (event, url) => {
    if (url.includes('accounts.google.com')) {
      event.preventDefault()
      openGoogleAuth(contents, url)
    }
  }
  contents.on('will-navigate', routeGoogleAuth)
  contents.on('will-redirect', routeGoogleAuth)
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Hubbly',
    icon: path.join(__dirname, '..', '..', 'ui', 'dist', 'ui', 'browser', 'assets', 'icon.png'), // win/linux; macOS uses the dock icon below
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // allow the trusted local preload to require app modules
      webviewTag: true,
    },
  })
  mainWindow = win
  win.loadFile(path.join(__dirname, '..', '..', 'ui', 'dist', 'ui', 'browser', 'index.html'))

  if (process.env.CC_DIAG) {
    win.webContents.on('preload-error', (_e, p, err) =>
      console.error('[DIAG preload-error]', p, err && err.stack ? err.stack : err))
    win.webContents.on('console-message', (_e, level, message, line, source) =>
      console.error('[DIAG renderer]', `${source}:${line}`, message))
    win.webContents.on('did-finish-load', async () => {
      if (process.env.CC_UACHECK) {
        const { webContents } = require('electron')
        await new Promise((r) => setTimeout(r, 2500)) // let guest pages start
        for (const g of webContents.getAllWebContents()) {
          if (g.getType() !== 'webview') continue
          try {
            const info = await g.executeJavaScript(
              '({ua: navigator.userAgent, brands: (navigator.userAgentData && navigator.userAgentData.brands) || null, webdriver: navigator.webdriver})')
            console.error('[DIAG guest]', g.getURL().slice(0, 45), JSON.stringify(info))
          } catch (e) {
            console.error('[DIAG guest]', g.getURL().slice(0, 45), 'exec-failed', String(e.message || e))
          }
        }
        await new Promise((r) => setTimeout(r, 2500)) // let the auth window load
        for (const g of webContents.getAllWebContents()) {
          if (g.getType() === 'webview') continue
          const u = g.getURL()
          if (!u.includes('accounts.google.com')) continue
          const txt = await g.executeJavaScript('document.body.innerText').catch(() => '')
          const blocked = /non sicur|not be secure|Impossibile eseguire/i.test(txt)
          console.error('[DIAG authwin]', u.slice(0, 45), 'blocked=', blocked, '::', txt.replace(/\s+/g, ' ').slice(0, 70))
        }
      }
      if (process.env.CC_SHOT) {
        // Angular applies class bindings asynchronously: wait a tick after each
        // click before reading classList (the vanilla renderer was synchronous).
        const state = await win.webContents.executeJavaScript(`
          (async () => {
            const tick = () => new Promise((r) => setTimeout(r, 50));
            const q = (id) => document.querySelector('#sidebar button[data-id="'+id+'"]');
            const sched = () => document.querySelector('.sched-btn');
            q('whatsapp').click(); await tick(); const wa = sched().classList.contains('hidden');
            q('telegram').click(); await tick(); const tg = sched().classList.contains('hidden');
            sched().click(); await tick(); const sc = sched().classList.contains('hidden');
            q('telegram').click(); await tick(); // leave the sidebar on Telegram for the screenshot
            return JSON.stringify({ hidden_onWhatsApp: wa, hidden_onTelegram: tg, hidden_onScheduler: sc });
          })()
        `)
        console.error('[DIAG sched-visibility]', state)
        await new Promise((r) => setTimeout(r, 300))
        const img = await win.webContents.capturePage()
        fs.writeFileSync('/tmp/crosschat-telegram.png', img.toPNG())
      }
      setTimeout(() => app.quit(), 200)
    })
  }
}

app.whenReady().then(() => {
  // Present a real, self-consistent Chrome UA (Electron/app tokens removed) to
  // every service — this is what lets Google sign-in succeed.
  app.userAgentFallback = cleanUserAgent(session.defaultSession.getUserAgent())
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(path.join(__dirname, '..', '..', 'ui', 'dist', 'ui', 'browser', 'assets', 'icon.png'))
  }
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
