import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CrosschatService } from '../../crosschat.service'
import { ServicesStore } from '../../services.store'
import { ScheduledEntry } from '../../crosschat.types'

@Component({
  selector: 'app-scheduler-panel',
  standalone: true,
  imports: [FormsModule],
  host: {
    class: 'panel scheduler',
    'data-view': 'scheduler',
    '[class.hidden]': "store.activeView() !== 'scheduler'",
  },
  templateUrl: './scheduler-panel.html',
})
export class SchedulerPanel implements OnInit {
  private api = inject(CrosschatService)
  readonly store = inject(ServicesStore)

  recipient = ''
  text = ''
  when = ''
  readonly error = signal('')
  readonly sending = signal(false)
  readonly items = signal<ScheduledEntry[]>([])

  async ngOnInit(): Promise<void> { await this.refresh() }

  async refresh(): Promise<void> { this.items.set(await this.api.listScheduled()) }

  async submit(ev: Event): Promise<void> {
    ev.preventDefault()
    this.error.set('')
    this.sending.set(true)
    const res = await this.api.scheduleMessage({
      recipient: this.recipient,
      text: this.text,
      when: new Date(this.when),
    })
    this.sending.set(false)
    if (!res.ok) {
      this.error.set(res.error ?? 'Errore sconosciuto')
      return
    }
    this.recipient = this.text = this.when = ''
    await this.refresh()
  }

  fmtDate(w: string): string {
    return new Date(w).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
  }
  fmtTime(w: string): string {
    return new Date(w).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  }
}
