const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('crosschat', {
  getCatalog: () => ipcRenderer.invoke('svc:catalog'),
  getEnabledServices: () => ipcRenderer.invoke('svc:enabled'),
  addService: (id) => ipcRenderer.invoke('svc:add', id),
  removeService: (id) => ipcRenderer.invoke('svc:remove', id),
  reorderServices: (ids) => ipcRenderer.invoke('svc:reorder', ids),
  scheduleMessage: (input) => ipcRenderer.invoke('tg:schedule', input),
  listScheduled: () => ipcRenderer.invoke('tg:list'),
  loginTelegram: (phone) => ipcRenderer.invoke('tg:login', phone),
})
