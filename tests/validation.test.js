import { validateScheduleInput } from '../src/shared/validation'

const now = new Date('2026-07-02T10:00:00Z')
const future = '2026-07-03T09:00:00Z'

test('accepts a valid input and normalizes when to a Date', () => {
  const r = validateScheduleInput({ recipient: '@marco', text: 'ciao', when: future }, now)
  expect(r.ok).toBe(true)
  expect(r.value.when instanceof Date).toBe(true)
  expect(r.value.when.toISOString()).toBe('2026-07-03T09:00:00.000Z')
})

test('rejects empty recipient', () => {
  const r = validateScheduleInput({ recipient: '  ', text: 'ciao', when: future }, now)
  expect(r.ok).toBe(false)
  expect(r.error).toMatch(/recipient/i)
})

test('rejects empty text', () => {
  const r = validateScheduleInput({ recipient: '@marco', text: '', when: future }, now)
  expect(r.ok).toBe(false)
  expect(r.error).toMatch(/text/i)
})

test('rejects a time in the past', () => {
  const r = validateScheduleInput({ recipient: '@marco', text: 'ciao', when: '2026-07-01T09:00:00Z' }, now)
  expect(r.ok).toBe(false)
  expect(r.error).toMatch(/future/i)
})

test('rejects an unparseable date', () => {
  const r = validateScheduleInput({ recipient: '@marco', text: 'ciao', when: 'not-a-date' }, now)
  expect(r.ok).toBe(false)
  expect(r.error).toMatch(/date/i)
})
