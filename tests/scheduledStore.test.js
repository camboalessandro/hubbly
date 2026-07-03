import os from 'os'
import path from 'path'
import fs from 'fs'
import { createStore } from '../src/store/scheduledStore'

function tmpFile() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cc-')), 'scheduled.json')
}

test('add returns an entry with an id and persists it', () => {
  const file = tmpFile()
  const store = createStore(file)
  const e = store.add({ recipient: '@marco', text: 'ciao', when: new Date('2026-07-03T09:00:00Z') })
  expect(typeof e.id).toBe('string')
  expect(e.when).toBe('2026-07-03T09:00:00.000Z')
  const reopened = createStore(file)
  expect(reopened.list()).toHaveLength(1)
})

test('list is sorted by when ascending', () => {
  const store = createStore(tmpFile())
  store.add({ recipient: '@a', text: 'x', when: new Date('2026-07-05T09:00:00Z') })
  store.add({ recipient: '@b', text: 'y', when: new Date('2026-07-03T09:00:00Z') })
  const whens = store.list().map((e) => e.when)
  expect(whens).toEqual(['2026-07-03T09:00:00.000Z', '2026-07-05T09:00:00.000Z'])
})

test('remove deletes by id and returns true, false when missing', () => {
  const store = createStore(tmpFile())
  const e = store.add({ recipient: '@a', text: 'x', when: new Date('2026-07-05T09:00:00Z') })
  expect(store.remove(e.id)).toBe(true)
  expect(store.list()).toHaveLength(0)
  expect(store.remove('missing')).toBe(false)
})
