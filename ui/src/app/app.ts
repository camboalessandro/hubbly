import { Component, NO_ERRORS_SCHEMA, OnInit, inject, signal } from '@angular/core'
import { ServicesStore } from './services.store'
import { ServiceEntry } from './crosschat.types'
import { Sidebar } from './sidebar'
import { SchedulerPanel } from './scheduler-panel'
import { Picker } from './picker'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Sidebar, SchedulerPanel, Picker],
  // <webview> is Electron's dash-less tag: CUSTOM_ELEMENTS_SCHEMA only covers
  // dashed custom elements, so NO_ERRORS_SCHEMA is required here.
  schemas: [NO_ERRORS_SCHEMA],
  host: { id: 'app' },
  template: `
    <app-sidebar id="sidebar" (open)="openService($event)" (addClicked)="pickerOpen.set(true)" />
    <main id="views">
      @for (svc of store.views(); track svc.id) {
        <webview
          [attr.data-view]="svc.id"
          [class.hidden]="store.activeView() !== svc.id"
          [attr.partition]="svc.partition"
          [attr.src]="store.startedUrls()[svc.id] ?? null"
          allowpopups
          (did-navigate)="onNavigate(svc.id, $event)"
        ></webview>
      }
      <app-scheduler-panel />
    </main>
    @if (pickerOpen()) {
      <app-picker (close)="pickerOpen.set(false)" />
    }
  `,
})
export class App implements OnInit {
  readonly store = inject(ServicesStore)
  readonly pickerOpen = signal(false)
  /** Last real URL each webview navigated to (the auth flow parks Gmail on a data: placeholder). */
  private lastUrls = new Map<string, string>()

  ngOnInit(): void { void this.store.init() }

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
