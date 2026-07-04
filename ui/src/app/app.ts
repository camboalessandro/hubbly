import { Component, NO_ERRORS_SCHEMA, OnInit, effect, inject, signal } from '@angular/core'
import { ServicesStore } from './services.store'
import { ServiceEntry } from './hubbly.types'
import { Sidebar } from './components/sidebar/sidebar'
import { SchedulerPanel } from './components/scheduler-panel/scheduler-panel'
import { Picker } from './components/picker/picker'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Sidebar, SchedulerPanel, Picker],
  // <webview> is Electron's dash-less tag: CUSTOM_ELEMENTS_SCHEMA only covers
  // dashed custom elements, so NO_ERRORS_SCHEMA is required here.
  schemas: [NO_ERRORS_SCHEMA],
  host: { id: 'app' },
  templateUrl: './app.html',
})
export class App implements OnInit {
  readonly store = inject(ServicesStore)
  readonly pickerOpen = signal(false)
  /** Last real URL each webview navigated to (the auth flow parks Gmail on a data: placeholder). */
  private lastUrls = new Map<string, string>()

  constructor() {
    // Keep the dock badge in sync with the true total across all services
    // (fixes each service overwriting the global badge with its own count).
    effect(() => {
      void window.hubbly.setBadge(this.store.totalUnread())
    })
  }

  ngOnInit(): void { void this.store.init() }

  onGuestMessage(id: string, ev: Event): void {
    const msg = ev as unknown as { channel: string; args: unknown[] }
    if (msg.channel === 'hubbly:unread') {
      this.store.setUnread(id, Number(msg.args?.[0]) || 0)
    } else if (msg.channel === 'hubbly:notification-click') {
      this.store.show(id)
      void window.hubbly.focusWindow()
    }
  }

  onNavigate(id: string, ev: Event): void {
    const url = (ev as unknown as { url?: string }).url
    if (url) this.lastUrls.set(id, url)
  }

  openService(entry: ServiceEntry): void {
    this.store.show(entry.id)
    this.store.start(entry)
    // Sign-in retry: if the webview sits on the local placeholder (the user
    // closed the auth window), reload the service URL — main re-intercepts it.
    const last = this.lastUrls.get(entry.id) ?? ''
    if (last.startsWith('data:')) {
      const el = document.querySelector(`webview[data-view="${entry.id}"]`) as { loadURL?: (u: string) => void } | null
      el?.loadURL?.(entry.url)
    }
  }
}
