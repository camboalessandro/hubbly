const { SERVICES, getService } = require('../src/main/serviceRegistry')

test('registry contains WhatsApp as vetrina-only', () => {
  const wa = getService('whatsapp')
  expect(wa.url).toBe('https://web.whatsapp.com')
  expect(wa.automation).toBe(false)
})

test('registry contains Telegram with automation enabled', () => {
  const tg = getService('telegram')
  expect(tg.url).toBe('https://web.telegram.org/k/')
  expect(tg.automation).toBe(true)
})

test('each service has an isolated persistent partition', () => {
  const parts = SERVICES.map((s) => s.partition)
  expect(new Set(parts).size).toBe(SERVICES.length)
  parts.forEach((p) => expect(p.startsWith('persist:')).toBe(true))
})

test('getService returns undefined for unknown id', () => {
  expect(getService('nope')).toBeUndefined()
})

test('each service points at an icon asset file', () => {
  SERVICES.forEach((s) => {
    expect(typeof s.icon).toBe('string')
    expect(s.icon).toMatch(/^assets\/.+\.(svg|png)$/)
  })
})

test('catalog exposes the full connector set with required fields', () => {
  const ids = SERVICES.map((s) => s.id)
  expect(ids).toEqual(
    expect.arrayContaining(['whatsapp', 'telegram', 'teams', 'discord', 'slack', 'messenger', 'instagram', 'spotify']),
  )
  SERVICES.forEach((s) => {
    expect(typeof s.id).toBe('string')
    expect(typeof s.name).toBe('string')
    expect(s.url).toMatch(/^https:\/\//)
    expect(s.partition).toMatch(/^persist:/)
    expect(typeof s.automation).toBe('boolean')
    expect(s.icon).toMatch(/^assets\/.+\.svg$/)
  })
})

test('only telegram has automation enabled', () => {
  const withAutomation = SERVICES.filter((s) => s.automation).map((s) => s.id)
  expect(withAutomation).toEqual(['telegram'])
})

test('gmail is in the catalog as a lazy vetrina service', () => {
  const gmail = getService('gmail')
  expect(gmail.automation).toBe(false)
  expect(gmail.lazy).toBe(true)
  expect(gmail.url).toBe('https://mail.google.com/mail/u/0/')
})
