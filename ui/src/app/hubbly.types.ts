export interface ServiceEntry {
  id: string
  name: string
  url: string
  partition: string
  automation: boolean
  icon: string
  lazy?: boolean
}

export interface ScheduledEntry {
  id: string
  recipient: string
  text: string
  when: string
  createdAt: string
}

export interface ScheduleResult {
  ok: boolean
  error?: string
  entry?: ScheduledEntry
}

declare global {
  interface Window {
    hubbly: {
      getCatalog(): Promise<ServiceEntry[]>
      getEnabledServices(): Promise<ServiceEntry[]>
      addService(id: string): Promise<ServiceEntry[]>
      removeService(id: string): Promise<ServiceEntry[]>
      reorderServices(ids: string[]): Promise<ServiceEntry[]>
      getWebviewPreloadPath(): Promise<string>
      setBadge(total: number): Promise<void>
      focusWindow(): Promise<void>
      scheduleMessage(input: { recipient: string; text: string; when: Date }): Promise<ScheduleResult>
      listScheduled(): Promise<ScheduledEntry[]>
      loginTelegram(phone: string): Promise<{ ok: boolean; error?: string }>
    }
  }
}
