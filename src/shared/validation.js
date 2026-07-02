function validateScheduleInput(input, now = new Date()) {
  const recipient = typeof input.recipient === 'string' ? input.recipient.trim() : ''
  const text = typeof input.text === 'string' ? input.text.trim() : ''

  if (!recipient) return { ok: false, error: 'recipient is required' }
  if (!text) return { ok: false, error: 'text is required' }

  const when = input.when instanceof Date ? input.when : new Date(input.when)
  if (isNaN(when.getTime())) return { ok: false, error: 'when must be a valid date' }
  if (when.getTime() <= now.getTime()) return { ok: false, error: 'when must be in the future' }

  return { ok: true, value: { recipient, text, when } }
}

module.exports = { validateScheduleInput }
