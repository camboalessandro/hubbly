function createServicesController({ catalog, config }) {
  const byId = (id) => catalog.find((s) => s.id === id)
  const toEntries = (ids) => ids.map(byId).filter(Boolean)

  return {
    getCatalog: () => catalog,
    getEnabled: () => toEntries(config.getEnabled()),
    add: (id) => toEntries(config.add(id)),
    remove: (id) => toEntries(config.remove(id)),
    reorder: (ids) => toEntries(config.setOrder(ids)),
  }
}

module.exports = { createServicesController }
