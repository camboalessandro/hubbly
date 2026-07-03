import os from 'os'
import path from 'path'

const dataDir = path.join(os.homedir(), '.crosschat')

const config = {
  dataDir,
  sessionFile: path.join(dataDir, 'telegram.session'),
  storeFile: path.join(dataDir, 'scheduled.json'),
  servicesFile: path.join(dataDir, 'services.json'),
  apiId: Number(process.env['TG_API_ID'] || 0),
  apiHash: process.env['TG_API_HASH'] || '',
}

export default config
