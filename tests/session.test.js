import os from 'os'
import path from 'path'
import fs from 'fs'
import { loadSessionString, saveSessionString } from '../src/telegram/session'

function tmpFile() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cc-')), 'tg.session')
}

test('loadSessionString returns empty string when file is missing', () => {
  expect(loadSessionString(path.join(os.tmpdir(), 'does-not-exist-xyz.session'))).toBe('')
})

test('saveSessionString then loadSessionString round-trips', () => {
  const file = tmpFile()
  saveSessionString(file, 'abc123')
  expect(loadSessionString(file)).toBe('abc123')
})
