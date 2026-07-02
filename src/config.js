const os = require('os')
const path = require('path')

const dataDir = path.join(os.homedir(), '.crosschat')

module.exports = {
  dataDir,
  sessionFile: path.join(dataDir, 'telegram.session'),
  storeFile: path.join(dataDir, 'scheduled.json'),
  servicesFile: path.join(dataDir, 'services.json'),
  apiId: Number(process.env.TG_API_ID || 0),
  apiHash: process.env.TG_API_HASH || '',
}
