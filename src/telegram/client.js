const { TelegramClient } = require('telegram')
const { StringSession } = require('telegram/sessions')

function createClient({ apiId, apiHash, sessionString }) {
  const session = new StringSession(sessionString || '')
  return new TelegramClient(session, apiId, apiHash, { connectionRetries: 5 })
}

module.exports = { createClient }
