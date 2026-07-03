// The IPC contract between the main process and the UI. Single source of truth
// for the shapes that cross the preload bridge.

export interface ServiceEntry {
  id: string
  name: string
  url: string
  partition: string
  automation: boolean
  icon: string
  /** Load the webview only when the user opens the service (e.g. Gmail: its
   *  sign-in opens a separate window, which must not appear at startup). */
  lazy?: boolean
}

export interface ScheduledEntry {
  id: string
  recipient: string
  text: string
  /** ISO timestamp */
  when: string
  /** ISO timestamp */
  createdAt: string
}

export interface ScheduleInput {
  recipient: string
  text: string
  when: Date | string
}

export type ScheduleResult =
  | { ok: true; entry: ScheduledEntry }
  | { ok: false; error: string }
