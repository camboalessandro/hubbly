const os = require('os')
const path = require('path')
const fs = require('fs')
const { createServicesConfig } = require('../src/store/servicesConfig')

const CATALOG = ['whatsapp', 'telegram', 'teams', 'discord', 'slack']
const DEFAULT = ['whatsapp', 'telegram', 'teams', 'discord']

function tmpFile() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cc-')), 'services.json')
}

test('getEnabled returns defaultEnabled when no file exists', () => {
  const cfg = createServicesConfig(tmpFile(), CATALOG, DEFAULT)
  expect(cfg.getEnabled()).toEqual(DEFAULT)
})

test('add appends a catalog id and persists', () => {
  const file = tmpFile()
  const cfg = createServicesConfig(file, CATALOG, DEFAULT)
  expect(cfg.add('slack')).toEqual(['whatsapp', 'telegram', 'teams', 'discord', 'slack'])
  const reopened = createServicesConfig(file, CATALOG, DEFAULT)
  expect(reopened.getEnabled()).toEqual(['whatsapp', 'telegram', 'teams', 'discord', 'slack'])
})

test('add is a no-op for unknown or already-enabled ids', () => {
  const cfg = createServicesConfig(tmpFile(), CATALOG, DEFAULT)
  expect(cfg.add('whatsapp')).toEqual(DEFAULT)
  expect(cfg.add('nope')).toEqual(DEFAULT)
})

test('remove drops an id and persists', () => {
  const cfg = createServicesConfig(tmpFile(), CATALOG, DEFAULT)
  expect(cfg.remove('teams')).toEqual(['whatsapp', 'telegram', 'discord'])
})

test('setOrder keeps only valid ids, de-duplicated, in order', () => {
  const cfg = createServicesConfig(tmpFile(), CATALOG, DEFAULT)
  expect(cfg.setOrder(['slack', 'telegram', 'nope', 'slack', 'whatsapp'])).toEqual(['slack', 'telegram', 'whatsapp'])
})

test('getEnabled filters out ids no longer in the catalog', () => {
  const file = tmpFile()
  fs.writeFileSync(file, JSON.stringify({ enabled: ['telegram', 'ghost', 'slack'] }))
  const cfg = createServicesConfig(file, CATALOG, DEFAULT)
  expect(cfg.getEnabled()).toEqual(['telegram', 'slack'])
})
