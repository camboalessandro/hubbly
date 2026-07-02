const { createServicesController } = require('../src/main/servicesController')

const CATALOG = [
  { id: 'whatsapp', name: 'WhatsApp', url: 'https://web.whatsapp.com', partition: 'persist:whatsapp', automation: false, icon: 'assets/whatsapp.svg' },
  { id: 'telegram', name: 'Telegram', url: 'https://web.telegram.org/k/', partition: 'persist:telegram', automation: true, icon: 'assets/telegram.svg' },
  { id: 'slack', name: 'Slack', url: 'https://app.slack.com/client', partition: 'persist:slack', automation: false, icon: 'assets/slack.svg' },
]

function fakeConfig(initial) {
  let enabled = [...initial]
  return {
    getEnabled: () => enabled,
    add: (id) => { if (!enabled.includes(id)) enabled = [...enabled, id]; return enabled },
    remove: (id) => { enabled = enabled.filter((x) => x !== id); return enabled },
    setOrder: (ids) => { enabled = ids; return enabled },
  }
}

test('getEnabled maps ids to full catalog entries in order', () => {
  const ctrl = createServicesController({ catalog: CATALOG, config: fakeConfig(['telegram', 'whatsapp']) })
  expect(ctrl.getEnabled().map((e) => e.id)).toEqual(['telegram', 'whatsapp'])
  expect(ctrl.getEnabled()[0].icon).toBe('assets/telegram.svg')
})

test('add returns the new enabled entries', () => {
  const ctrl = createServicesController({ catalog: CATALOG, config: fakeConfig(['whatsapp']) })
  expect(ctrl.add('slack').map((e) => e.id)).toEqual(['whatsapp', 'slack'])
})

test('remove returns the new enabled entries', () => {
  const ctrl = createServicesController({ catalog: CATALOG, config: fakeConfig(['whatsapp', 'slack']) })
  expect(ctrl.remove('whatsapp').map((e) => e.id)).toEqual(['slack'])
})

test('reorder returns entries in the new order', () => {
  const ctrl = createServicesController({ catalog: CATALOG, config: fakeConfig(['whatsapp', 'telegram']) })
  expect(ctrl.reorder(['telegram', 'whatsapp']).map((e) => e.id)).toEqual(['telegram', 'whatsapp'])
})

test('getCatalog returns the full catalog', () => {
  const ctrl = createServicesController({ catalog: CATALOG, config: fakeConfig([]) })
  expect(ctrl.getCatalog().map((e) => e.id)).toEqual(['whatsapp', 'telegram', 'slack'])
})
