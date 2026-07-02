async function scheduleTelegramMessage(client, { recipient, text, when }) {
  return client.sendMessage(recipient, { message: text, schedule: when })
}

module.exports = { scheduleTelegramMessage }
