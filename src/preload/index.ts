import { contextBridge, ipcRenderer } from 'electron'
import { ScheduleInput } from '../shared/ipc.types'

contextBridge.exposeInMainWorld('hubbly', {
  getCatalog: () => ipcRenderer.invoke('svc:catalog'),
  getEnabledServices: () => ipcRenderer.invoke('svc:enabled'),
  addService: (id: string) => ipcRenderer.invoke('svc:add', id),
  removeService: (id: string) => ipcRenderer.invoke('svc:remove', id),
  reorderServices: (ids: string[]) => ipcRenderer.invoke('svc:reorder', ids),
  scheduleMessage: (input: ScheduleInput) => ipcRenderer.invoke('tg:schedule', input),
  listScheduled: () => ipcRenderer.invoke('tg:list'),
  loginTelegram: (phone: string) => ipcRenderer.invoke('tg:login', phone),
})
