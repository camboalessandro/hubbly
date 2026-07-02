const fs = require('fs')

function loadSessionString(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch (e) {
    return ''
  }
}

function saveSessionString(filePath, str) {
  fs.writeFileSync(filePath, str)
}

module.exports = { loadSessionString, saveSessionString }
