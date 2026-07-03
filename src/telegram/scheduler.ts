/** Minimal shape of the client we need — the real GramJS client satisfies it
 *  structurally; tests inject a fake. Using our own interface keeps the
 *  scheduler decoupled from GramJS's (stricter) typings. */
export interface SchedulingClient {
  sendMessage(recipient: string, options: { message: string; schedule: Date }): Promise<unknown>
}

export async function scheduleTelegramMessage(
  client: SchedulingClient,
  { recipient, text, when }: { recipient: string; text: string; when: Date },
): Promise<unknown> {
  return client.sendMessage(recipient, { message: text, schedule: when })
}
