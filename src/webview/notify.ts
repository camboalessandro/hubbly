// Injected into every service webview (Electron <webview preload>). Runs inside
// the guest page. MUST stay self-contained: sandboxed preloads can only
// require('electron') — no local imports.

export function parseUnreadFromTitle(title: string): number | null {
  const m = /\((\d+)\)/.exec(title)
  return m ? Number(m[1]) : null
}

function init(): void {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ipcRenderer } = require('electron') as typeof import('electron')

  let badgingApiUsed = false
  const report = (count: number): void => {
    ipcRenderer.sendToHost('hubbly:unread', count)
  }

  // Primary channel: the page announces its own unread count (WhatsApp Web,
  // Telegram Web use the Badging API). We capture it here instead of letting
  // every service overwrite the single global dock badge.
  const nav = navigator as Navigator & {
    setAppBadge?: (n?: number) => Promise<void>
    clearAppBadge?: () => Promise<void>
  }
  nav.setAppBadge = (n?: number) => {
    badgingApiUsed = true
    report(typeof n === 'number' ? n : 0)
    return Promise.resolve()
  }
  nav.clearAppBadge = () => {
    badgingApiUsed = true
    report(0)
    return Promise.resolve()
  }

  // Fallback: many services put "(N)" in the tab title instead.
  const reportFromTitle = (): void => {
    if (badgingApiUsed) return
    report(parseUnreadFromTitle(document.title) ?? 0)
  }
  window.addEventListener('DOMContentLoaded', () => {
    const el = document.querySelector('title')
    if (el) new MutationObserver(reportFromTitle).observe(el, { childList: true })
    reportFromTitle()
  })

  // Notification click → tell the host which service was clicked (the host
  // knows: one preload instance per webview). Native notification still shows.
  const debug = (what: string): void => {
    ipcRenderer.sendToHost('hubbly:notif-debug', what)
  }
  const NativeNotification = window.Notification
  if (NativeNotification) {
    const Wrapped = function (title: string, options?: NotificationOptions) {
      debug('constructor-created')
      const n = new NativeNotification(title, options)
      n.addEventListener('click', () => {
        debug('constructor-clicked')
        ipcRenderer.sendToHost('hubbly:notification-click')
      })
      return n
    } as unknown as typeof Notification
    Wrapped.prototype = NativeNotification.prototype
    Object.defineProperty(Wrapped, 'permission', { get: () => NativeNotification.permission })
    Wrapped.requestPermission = NativeNotification.requestPermission.bind(NativeNotification)
    window.Notification = Wrapped
  }

  // Detection only: some services show notifications through their Service
  // Worker registration instead of the constructor. Clicks on those are NOT
  // interceptable from the page — this tells us if that's the path in use.
  const swProto = (window as { ServiceWorkerRegistration?: { prototype: object } }).ServiceWorkerRegistration?.prototype as
    | { showNotification?: (...a: unknown[]) => Promise<void> }
    | undefined
  if (swProto?.showNotification) {
    const orig = swProto.showNotification
    swProto.showNotification = function (...a: unknown[]) {
      debug('sw-shown')
      return orig.apply(this, a)
    }
  }
}

// Guarded: importing this file in unit tests (Node env) must be inert.
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  init()
}
