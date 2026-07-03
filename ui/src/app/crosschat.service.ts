import { Injectable } from '@angular/core'
import { ScheduledEntry, ScheduleResult, ServiceEntry } from './crosschat.types'

@Injectable({ providedIn: 'root' })
export class CrosschatService {
  getCatalog(): Promise<ServiceEntry[]> { return window.crosschat.getCatalog() }
  getEnabledServices(): Promise<ServiceEntry[]> { return window.crosschat.getEnabledServices() }
  addService(id: string): Promise<ServiceEntry[]> { return window.crosschat.addService(id) }
  removeService(id: string): Promise<ServiceEntry[]> { return window.crosschat.removeService(id) }
  reorderServices(ids: string[]): Promise<ServiceEntry[]> { return window.crosschat.reorderServices(ids) }
  scheduleMessage(input: { recipient: string; text: string; when: Date }): Promise<ScheduleResult> {
    return window.crosschat.scheduleMessage(input)
  }
  listScheduled(): Promise<ScheduledEntry[]> { return window.crosschat.listScheduled() }
}
