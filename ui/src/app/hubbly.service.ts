import { Injectable } from '@angular/core'
import { ScheduledEntry, ScheduleResult, ServiceEntry } from './hubbly.types'

@Injectable({ providedIn: 'root' })
export class HubblyService {
  getCatalog(): Promise<ServiceEntry[]> { return window.hubbly.getCatalog() }
  getEnabledServices(): Promise<ServiceEntry[]> { return window.hubbly.getEnabledServices() }
  addService(id: string): Promise<ServiceEntry[]> { return window.hubbly.addService(id) }
  removeService(id: string): Promise<ServiceEntry[]> { return window.hubbly.removeService(id) }
  reorderServices(ids: string[]): Promise<ServiceEntry[]> { return window.hubbly.reorderServices(ids) }
  getWebviewPreloadPath(): Promise<string> { return window.hubbly.getWebviewPreloadPath() }
  setBadge(total: number): Promise<void> { return window.hubbly.setBadge(total) }
  focusWindow(): Promise<void> { return window.hubbly.focusWindow() }
  scheduleMessage(input: { recipient: string; text: string; when: Date }): Promise<ScheduleResult> {
    return window.hubbly.scheduleMessage(input)
  }
  listScheduled(): Promise<ScheduledEntry[]> { return window.hubbly.listScheduled() }
}
