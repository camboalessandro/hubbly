import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'

export function createClient({
  apiId,
  apiHash,
  sessionString,
}: {
  apiId: number
  apiHash: string
  sessionString: string
}): TelegramClient {
  const session = new StringSession(sessionString || '')
  return new TelegramClient(session, apiId, apiHash, { connectionRetries: 5 })
}
