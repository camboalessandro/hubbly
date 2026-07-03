import { ServiceEntry } from '../shared/ipc.types'
import { ServicesConfig } from '../store/servicesConfig'

export interface ServicesController {
  getCatalog(): ServiceEntry[]
  getEnabled(): ServiceEntry[]
  add(id: string): ServiceEntry[]
  remove(id: string): ServiceEntry[]
  reorder(ids: string[]): ServiceEntry[]
}

export function createServicesController({
  catalog,
  config,
}: {
  catalog: ServiceEntry[]
  config: ServicesConfig
}): ServicesController {
  const byId = (id: string): ServiceEntry | undefined => catalog.find((s) => s.id === id)
  const toEntries = (ids: string[]): ServiceEntry[] =>
    ids.map(byId).filter((e): e is ServiceEntry => !!e)

  return {
    getCatalog: () => catalog,
    getEnabled: () => toEntries(config.getEnabled()),
    add: (id) => toEntries(config.add(id)),
    remove: (id) => toEntries(config.remove(id)),
    reorder: (ids) => toEntries(config.setOrder(ids)),
  }
}
