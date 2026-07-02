const { validateScheduleInput } = require('../shared/validation')

function createTelegramService({ store, scheduler, now = () => new Date() }) {
  let client = null

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

module.exports = { createTelegramService }
