import { Component, ElementRef, computed, inject, output, signal } from '@angular/core'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'
import { ServicesStore } from '../../services.store'
import { ServiceEntry } from '../../crosschat.types'

const CALENDAR_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9H21M7 3V5M17 3V5M10 14L12 12M12 12L14 14M12 12V18M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z"/></svg>'

@Component({
  selector: 'app-sidebar',
  standalone: true,
  host: { '(dragover)': 'onDragOver($event)' },
  templateUrl: './sidebar.html',
})
export class Sidebar {
  readonly store = inject(ServicesStore)
  private host = inject(ElementRef<HTMLElement>)
  private sanitizer = inject(DomSanitizer)

  readonly open = output<ServiceEntry>()
  readonly addClicked = output<void>()
  readonly draggingId = signal<string | null>(null)
  readonly calendarIcon: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(CALENDAR_SVG)
  readonly hasTelegram = computed(() => this.store.sidebar().some((e) => e.id === 'telegram'))

  async onRemove(svc: ServiceEntry, ev: Event): Promise<void> {
    ev.stopPropagation()
    await this.store.remove(svc.id)
  }

  onDragStart(id: string, ev: DragEvent): void {
    this.draggingId.set(id)
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move'
  }

  onDragOver(ev: DragEvent): void {
    ev.preventDefault()
    const dragging = this.draggingId()
    if (!dragging) return
    // Same rule as the vanilla renderer: insert the dragged icon before the
    // first (other) service button whose vertical midpoint is below the cursor.
    const buttons = Array.from(
      this.host.nativeElement.querySelectorAll('button.svc-btn:not(.dragging)'),
    ) as HTMLElement[]
    const after = buttons.find((b) => ev.clientY <= b.getBoundingClientRect().top + b.offsetHeight / 2)
    const ids = this.store.sidebar().map((e) => e.id).filter((i) => i !== dragging)
    const idx = after ? ids.indexOf(after.dataset['id'] as string) : ids.length
    ids.splice(idx < 0 ? ids.length : idx, 0, dragging)
    const current = this.store.sidebar().map((e) => e.id)
    if (ids.join('|') !== current.join('|')) this.store.reorderLocal(ids)
  }

  onDragEnd(): void {
    this.draggingId.set(null)
    this.store.persistOrder()
  }
}
