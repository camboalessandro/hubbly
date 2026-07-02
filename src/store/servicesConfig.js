const fs = require('fs')

function createServicesConfig(filePath, catalogIds, defaultEnabled) {
  const inCatalog = (id) => catalogIds.includes(id)

  function readRaw() {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      return Array.isArray(data.enabled) ? data.enabled : null
    } catch (e) {
      return null
    }
  }

  function write(enabled) {
    fs.writeFileSync(filePath, JSON.stringify({ enabled }, null, 2))
    return enabled
  }

  function clean(ids) {
    const seen = new Set()
    return ids.filter((id) => inCatalog(id) && !seen.has(id) && seen.add(id))
  }

  function getEnabled() {
    const raw = readRaw()
    return clean(raw === null ? defaultEnabled : raw)
  }

  return {
    getEnabled,
    add(id) {
      const enabled = getEnabled()
      if (!inCatalog(id) || enabled.includes(id)) return enabled
      return write([...enabled, id])
    },
    remove(id) {
      return write(getEnabled().filter((x) => x !== id))
    },
    setOrder(ids) {
      return write(clean(ids))
    },
  }
}

module.exports = { createServicesConfig }
