import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CrosschatService } from './crosschat.service'
import { ServicesStore } from './services.store'
import { ScheduledEntry } from './crosschat.types'

@Component({
  selector: 'app-scheduler-panel',
  standalone: true,
  imports: [FormsModule],
  host: {
    class: 'panel scheduler',
    'data-view': 'scheduler',
    '[class.hidden]': "store.activeView() !== 'scheduler'",
  },
  template: `
    <div class="sched-wrap">
      <header class="sched-head">
        <span class="eyebrow">Telegram · automazione</span>
        <h1>Programma un messaggio</h1>
        <p class="sched-sub">Parte dai server di Telegram all'ora scelta, anche a computer spento.</p>
      </header>

      <form id="sched-form" class="compose" novalidate (submit)="submit($event)">
        <div class="field">
          <label class="field-label" for="f-recipient">Destinatario</label>
          <input id="f-recipient" class="control" placeholder="@username, numero o ID chat" required [(ngModel)]="recipient" name="recipient" />
        </div>
        <div class="field">
          <label class="field-label" for="f-text">Messaggio</label>
          <textarea id="f-text" class="control" rows="4" placeholder="Scrivi il messaggio…" required [(ngModel)]="text" name="text"></textarea>
        </div>
        <div class="field">
          <label class="field-label" for="f-when">Invio</label>
          <input id="f-when" class="control" type="datetime-local" required [(ngModel)]="when" name="when" />
        </div>
        <p id="sched-error" class="error" role="alert">{{ error() }}</p>
        <button type="submit" class="send" [disabled]="sending()">Programma l'invio</button>
      </form>

      <section class="queue">
        <div class="queue-head">
          <h2>In coda</h2>
          <span id="queue-count" class="count">{{ items().length }}</span>
        </div>
        <ul id="sched-list" class="queue-list">
          @if (!items().length) {
            <li class="queue-empty">Nessun messaggio in coda. Programmane uno qui sopra.</li>
          }
          @for (e of items(); track e.id) {
            <li class="queue-item">
              <div class="qi-time">
                <span class="qi-date">{{ fmtDate(e.when) }}</span>
                <span class="qi-clock">{{ fmtTime(e.when) }}</span>
              </div>
              <div class="qi-body">
                <span class="qi-to">{{ e.recipient }}</span>
                <span class="qi-text">{{ e.text }}</span>
              </div>
            </li>
          }
        </ul>
      </section>
    </div>
  `,
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
