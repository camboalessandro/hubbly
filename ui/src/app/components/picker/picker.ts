import { Component, OnInit, inject, output, signal } from '@angular/core'
import { CrosschatService } from '../../crosschat.service'
import { ServicesStore } from '../../services.store'
import { ServiceEntry } from '../../crosschat.types'

@Component({
  selector: 'app-picker',
  standalone: true,
  templateUrl: './picker.html',
})
export class Picker implements OnInit {
  private api = inject(CrosschatService)
  private store = inject(ServicesStore)

  readonly close = output<void>()
  readonly available = signal<ServiceEntry[]>([])

  async ngOnInit(): Promise<void> {
    const catalog = await this.api.getCatalog()
    const enabled = new Set(this.store.sidebar().map((e) => e.id))
    this.available.set(catalog.filter((e) => !enabled.has(e.id)))
  }

  onOverlay(ev: MouseEvent): void {
    if ((ev.target as HTMLElement).classList.contains('picker-overlay')) this.close.emit()
  }

  async pick(entry: ServiceEntry): Promise<void> {
    await this.store.add(entry.id)
    this.close.emit()
  }
}
