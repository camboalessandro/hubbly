import fs from 'fs'

export function loadSessionString(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch {
    return ''
  }
}

export function saveSessionString(filePath: string, str: string): void {
  fs.writeFileSync(filePath, str)
}
