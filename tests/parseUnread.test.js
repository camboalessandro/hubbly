import { parseUnreadFromTitle } from '../src/webview/notify'

test('extracts the count from "(N) Title"', () => {
  expect(parseUnreadFromTitle('(3) WhatsApp')).toBe(3)
})

test('returns null when no count is present', () => {
  expect(parseUnreadFromTitle('WhatsApp')).toBeNull()
})

test('uses the first parenthesized number', () => {
  expect(parseUnreadFromTitle('(12) chat (1)')).toBe(12)
})

test('supports zero', () => {
  expect(parseUnreadFromTitle('(0) Inbox')).toBe(0)
})
