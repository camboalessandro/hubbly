import { Injectable, computed, inject, signal } from '@angular/core'
import { CrosschatService } from './crosschat.service'
import { ServiceEntry } from './crosschat.types'

@Injectable({ providedIn: 'root' })
export class ServicesStore {
  private api = inject(CrosschatService)

  /** Sidebar order — what the user sees and drags. */
  readonly sidebar = signal<ServiceEntry[]>([])
  /** Webview hosts. Append-only except explicit removal — NEVER reordered:
   *  moving webview DOM nodes reloads the guest pages. */
  readonly views = signal<ServiceEntry[]>([])
  readonly activeView = signal<string>('')
  /** src attribute per service id; lazy services stay undefined until opened. */
  readonly startedUrls = signal<Record<string, string>>({})

  readonly schedulerVisible = computed(() => {
    const a = this.activeView()
    return a === 'telegram' || a === 'scheduler'
  })

  async init(): Promise<void> {
    const entries = await this.api.getEnabledServices()
    this.sidebar.set(entries)
    this.views.set(entries)
    const started: Record<string, string> = {}
    for (const e of entries) if (!e.lazy) started[e.id] = e.url
    this.startedUrls.set(started)
    this.activeView.set(entries[0]?.id ?? 'scheduler')
  }

  show(id: string): void { this.activeView.set(id) }

  /** Give a (lazy) service its URL on first open. */
  start(entry: ServiceEntry): void {
    if (!this.startedUrls()[entry.id]) {
      this.startedUrls.update((m) => ({ ...m, [entry.id]: entry.url }))
    }
  }

  async add(id: string): Promise<void> {
    const updated = await this.api.addService(id)
    const added = updated.find((e) => e.id === id)
    if (!added) return
    this.sidebar.update((s) => (s.some((e) => e.id === id) ? s : [...s, added]))
    this.views.update((v) => (v.some((e) => e.id === id) ? v : [...v, added]))
    this.show(id)
    this.start(added)
  }

  async remove(id: string): Promise<void> {
    const wasActive = this.activeView() === id
    await this.api.removeService(id)
    this.sidebar.update((s) => s.filter((e) => e.id !== id))
    this.views.update((v) => v.filter((e) => e.id !== id))
    if (wasActive) this.show(this.sidebar()[0]?.id ?? 'scheduler')
  }

  /** Reorder the sidebar signal only (during drag). */
  reorderLocal(ids: string[]): void {
    const byId = new Map(this.sidebar().map((e) => [e.id, e]))
    this.sidebar.set(ids.map((i) => byId.get(i)).filter((e): e is ServiceEntry => !!e))
  }

  /** Persist the current sidebar order (on drop). */
  persistOrder(): void {
    void this.api.reorderServices(this.sidebar().map((e) => e.id))
  }
}
