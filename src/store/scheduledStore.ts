import fs from 'fs'
import crypto from 'crypto'
import { ScheduledEntry } from '../shared/ipc.types'

export interface ScheduledStore {
  add(input: { recipient: string; text: string; when: Date | string }): ScheduledEntry
  list(): ScheduledEntry[]
  remove(id: string): boolean
}

export function createStore(filePath: string): ScheduledStore {
  function read(): ScheduledEntry[] {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8')) as ScheduledEntry[]
    } catch {
      return []
    }
  }
  function write(entries: ScheduledEntry[]): void {
    fs.writeFileSync(filePath, JSON.stringify(entries, null, 2))
  }

  return {
    add({ recipient, text, when }) {
      const entries = read()
      const entry: ScheduledEntry = {
        id: crypto.randomUUID(),
        recipient,
        text,
        when: new Date(when).toISOString(),
        createdAt: new Date().toISOString(),
      }
      entries.push(entry)
      write(entries)
      return entry
    },
    list() {
      return read().sort((a, b) => a.when.localeCompare(b.when))
    },
    remove(id) {
      const entries = read()
      const next = entries.filter((e) => e.id !== id)
      write(next)
      return next.length !== entries.length
    },
  }
}
