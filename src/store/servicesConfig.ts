import fs from 'fs'

export interface ServicesConfig {
  getEnabled(): string[]
  add(id: string): string[]
  remove(id: string): string[]
  setOrder(ids: string[]): string[]
}

export function createServicesConfig(
  filePath: string,
  catalogIds: string[],
  defaultEnabled: string[],
): ServicesConfig {
  const inCatalog = (id: string): boolean => catalogIds.includes(id)

  function readRaw(): string[] | null {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { enabled?: unknown }
      return Array.isArray(data.enabled) ? (data.enabled as string[]) : null
    } catch {
      return null
    }
  }

  function write(enabled: string[]): string[] {
    fs.writeFileSync(filePath, JSON.stringify({ enabled }, null, 2))
    return enabled
  }

  function clean(ids: string[]): string[] {
    const seen = new Set<string>()
    return ids.filter((id) => inCatalog(id) && !seen.has(id) && !!seen.add(id))
  }

  function getEnabled(): string[] {
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
