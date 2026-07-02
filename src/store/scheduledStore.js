const fs = require('fs')
const crypto = require('crypto')

function createStore(filePath) {
  function read() {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch (e) {
      return []
    }
  }
  function write(entries) {
    fs.writeFileSync(filePath, JSON.stringify(entries, null, 2))
  }

  return {
    add({ recipient, text, when }) {
      const entries = read()
      const entry = {
        id: crypto.randomUUID(),
        recipient,
        text,
        when: new Date(when).toISOString(),
        createdAt: new Date().toISOString(),
      }
      entries.push(entry)
      write(entries)
      return entry
    },
    list() {
      return read().sort((a, b) => a.when.localeCompare(b.when))
    },
    remove(id) {
      const entries = read()
      const next = entries.filter((e) => e.id !== id)
      write(next)
      return next.length !== entries.length
    },
  }
}

module.exports = { createStore }
