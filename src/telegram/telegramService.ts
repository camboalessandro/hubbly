import { validateScheduleInput } from '../shared/validation'
import { ScheduleResult } from '../shared/ipc.types'
import { ScheduledStore } from '../store/scheduledStore'
import { SchedulingClient, scheduleTelegramMessage } from './scheduler'

export interface TelegramService {
  /** Test hook: inject a fake client. */
  _setClientForTest(fake: SchedulingClient): void
  setClient(c: SchedulingClient): void
  schedule(input: { recipient?: unknown; text?: unknown; when?: unknown }): Promise<ScheduleResult>
  listScheduled(): ReturnType<ScheduledStore['list']>
}

export function createTelegramService({
  store,
  scheduler,
  now = () => new Date(),
}: {
  store: ScheduledStore
  scheduler: typeof scheduleTelegramMessage
  now?: () => Date
}): TelegramService {
  let client: SchedulingClient | null = null

  return {
    _setClientForTest(fake) {
      client = fake
    },
    setClient(c) {
      client = c
    },
    async schedule(input) {
      const v = validateScheduleInput(input, now())
      if (!v.ok) return { ok: false, error: v.error }
      if (!client) return { ok: false, error: 'telegram not connected' }

      await scheduler(client, v.value)
      const entry = store.add(v.value)
      return { ok: true, entry }
    },
    listScheduled() {
      return store.list()
    },
  }
}
