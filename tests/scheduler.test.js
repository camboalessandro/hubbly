const { scheduleTelegramMessage } = require('../src/telegram/scheduler')

test('calls sendMessage with the native schedule option', async () => {
  const calls = []
  const fakeClient = {
    async sendMessage(recipient, options) {
      calls.push({ recipient, options })
      return { id: 42 }
    },
  }
  const when = new Date('2026-07-03T09:00:00Z')
  const res = await scheduleTelegramMessage(fakeClient, { recipient: '@marco', text: 'ciao', when })

  expect(res).toEqual({ id: 42 })
  expect(calls).toHaveLength(1)
  expect(calls[0].recipient).toBe('@marco')
  expect(calls[0].options.message).toBe('ciao')
  expect(calls[0].options.schedule).toBe(when)
})
