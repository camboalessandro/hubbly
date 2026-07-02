const os = require('os')
const path = require('path')
const fs = require('fs')
const { createStore } = require('../src/store/scheduledStore')
const { scheduleTelegramMessage } = require('../src/telegram/scheduler')
const { createTelegramService } = require('../src/telegram/telegramService')

function tmpStore() {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cc-')), 's.json')
  return createStore(file)
}

const now = new Date('2026-07-02T10:00:00Z')

function serviceWithFakeClient(store) {
  const fakeClient = {
    sent: [],
    async sendMessage(recipient, options) {
      this.sent.push({ recipient, options })
      return { id: 1 }
    },
  }
  const svc = createTelegramService({
    store,
    scheduler: scheduleTelegramMessage,
    now: () => now,
  })
  svc._setClientForTest(fakeClient)
  return { svc, fakeClient }
}

test('schedule validates, sends, and records in the store', async () => {
  const store = tmpStore()
  const { svc, fakeClient } = serviceWithFakeClient(store)
  const r = await svc.schedule({ recipient: '@marco', text: 'ciao', when: '2026-07-03T09:00:00Z' })

  expect(r.ok).toBe(true)
  expect(fakeClient.sent).toHaveLength(1)
  expect(store.list()).toHaveLength(1)
  expect(r.entry.recipient).toBe('@marco')
})

test('schedule rejects invalid input without sending', async () => {
  const store = tmpStore()
  const { svc, fakeClient } = serviceWithFakeClient(store)
  const r = await svc.schedule({ recipient: '', text: 'ciao', when: '2026-07-03T09:00:00Z' })

  expect(r.ok).toBe(false)
  expect(fakeClient.sent).toHaveLength(0)
  expect(store.list()).toHaveLength(0)
})
