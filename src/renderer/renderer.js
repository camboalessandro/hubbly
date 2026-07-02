const sidebar = document.getElementById('sidebar')
const views = document.getElementById('views')

// id -> <webview>, so we can add/remove services without a full rebuild.
const webviewsById = {}

const CALENDAR_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9H21M7 3V5M17 3V5M10 14L12 12M12 12L14 14M12 12V18M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z"/></svg>'

let schedBtn // sidebar calendar button, created in buildScheduler()
let addBtn // the "+" button, always the last item in the sidebar

// The calendar is a Telegram feature, so it always sits directly under the
// Telegram icon (and follows it when the sidebar is reordered).
function positionSchedButton() {
  const tg = sidebar.querySelector('button.svc-btn[data-id="telegram"]')
  if (tg) sidebar.insertBefore(schedBtn, tg.nextSibling)
  else if (addBtn) sidebar.insertBefore(schedBtn, addBtn)
}

function show(id) {
  document.querySelectorAll('#views webview, #views .panel').forEach((el) => {
    el.classList.toggle('hidden', el.dataset.view !== id)
  })
  document.querySelectorAll('#sidebar button').forEach((b) => {
    b.classList.toggle('active', b.dataset.id === id)
  })
  schedBtn.classList.toggle('hidden', !(id === 'telegram' || id === 'scheduler'))
}

function makeServiceButton(entry) {
  const btn = document.createElement('button')
  btn.className = 'svc-btn'
  btn.dataset.id = entry.id
  btn.title = entry.name
  btn.innerHTML = `<img class="svc-icon" src="${entry.icon}" alt="${entry.name}" />`
  btn.addEventListener('click', () => {
    show(entry.id)
    ensureLoaded(entry)
  })

  btn.draggable = true
  btn.addEventListener('dragstart', (ev) => {
    btn.classList.add('dragging')
    ev.dataTransfer.effectAllowed = 'move'
  })
  btn.addEventListener('dragend', () => {
    btn.classList.remove('dragging')
    positionSchedButton() // keep the calendar under Telegram after a move
    persistOrder()
  })

  const remove = document.createElement('span')
  remove.className = 'remove-badge'
  remove.textContent = '−'
  remove.title = `Rimuovi ${entry.name}`
  remove.addEventListener('click', async (ev) => {
    ev.stopPropagation()
    const wasActive = btn.classList.contains('active')
    await window.crosschat.removeService(entry.id)
    removeServiceFromSidebar(entry.id)
    if (wasActive) show(firstServiceId())
  })
  btn.appendChild(remove)
  return btn
}

function addServiceToSidebar(entry) {
  if (webviewsById[entry.id]) return
  sidebar.insertBefore(makeServiceButton(entry), addBtn) // services stay above the "+"
  const wv = document.createElement('webview')
  wv.dataset.view = entry.id
  // Lazy services (Gmail: its sign-in opens a separate window) load on first open,
  // not at startup.
  if (!entry.lazy) wv.setAttribute('src', entry.url)
  wv.setAttribute('partition', entry.partition)
  wv.setAttribute('allowpopups', '')
  wv.classList.add('hidden')
  // Track where the webview is, so ensureLoaded() can offer a sign-in retry.
  wv.addEventListener('did-navigate', (ev) => {
    wv.dataset.lastUrl = ev.url
  })
  views.appendChild(wv)
  webviewsById[entry.id] = wv
}

// Load a lazy service on first open; if its sign-in was interrupted (the
// webview sits on the local placeholder page), reload the service URL — this
// re-triggers the auth-window flow in the main process.
function ensureLoaded(entry) {
  const wv = webviewsById[entry.id]
  if (!wv) return
  const last = wv.dataset.lastUrl || ''
  try {
    if (!wv.getAttribute('src')) wv.setAttribute('src', entry.url)
    else if (last.startsWith('data:')) wv.loadURL(entry.url)
  } catch (e) {
    /* webview not attached yet — next click will retry */
  }
}

function removeServiceFromSidebar(id) {
  const btn = sidebar.querySelector(`button[data-id="${id}"]`)
  if (btn) btn.remove()
  if (webviewsById[id]) {
    webviewsById[id].remove()
    delete webviewsById[id]
  }
  positionSchedButton()
}

function firstServiceId() {
  const btn = sidebar.querySelector('button.svc-btn')
  return btn ? btn.dataset.id : 'scheduler'
}

function buildScheduler() {
  schedBtn = document.createElement('button')
  schedBtn.className = 'sched-btn hidden'
  schedBtn.innerHTML = CALENDAR_ICON
  schedBtn.title = 'Messaggi programmati'
  schedBtn.dataset.id = 'scheduler'
  schedBtn.addEventListener('click', () => show('scheduler'))
  sidebar.appendChild(schedBtn)

  const panel = document.createElement('div')
  panel.className = 'panel scheduler hidden'
  panel.dataset.view = 'scheduler'
  panel.innerHTML = `
    <div class="sched-wrap">
      <header class="sched-head">
        <span class="eyebrow">Telegram · automazione</span>
        <h1>Programma un messaggio</h1>
        <p class="sched-sub">Parte dai server di Telegram all'ora scelta, anche a computer spento.</p>
      </header>
      <form id="sched-form" class="compose" novalidate>
        <div class="field">
          <label class="field-label" for="f-recipient">Destinatario</label>
          <input id="f-recipient" class="control" placeholder="@username, numero o ID chat" required />
        </div>
        <div class="field">
          <label class="field-label" for="f-text">Messaggio</label>
          <textarea id="f-text" class="control" rows="4" placeholder="Scrivi il messaggio…" required></textarea>
        </div>
        <div class="field">
          <label class="field-label" for="f-when">Invio</label>
          <input id="f-when" class="control" type="datetime-local" required />
        </div>
        <p id="sched-error" class="error" role="alert"></p>
        <button type="submit" class="send">Programma l'invio</button>
      </form>
      <section class="queue">
        <div class="queue-head">
          <h2>In coda</h2>
          <span id="queue-count" class="count">0</span>
        </div>
        <ul id="sched-list" class="queue-list"></ul>
      </section>
    </div>
  `
  views.appendChild(panel)

  async function refreshList() {
    const items = await window.crosschat.listScheduled()
    const ul = panel.querySelector('#sched-list')
    const count = panel.querySelector('#queue-count')
    ul.innerHTML = ''
    count.textContent = String(items.length)
    if (!items.length) {
      const empty = document.createElement('li')
      empty.className = 'queue-empty'
      empty.textContent = 'Nessun messaggio in coda. Programmane uno qui sopra.'
      ul.appendChild(empty)
      return
    }
    items.forEach((e) => {
      const when = new Date(e.when)
      const li = document.createElement('li')
      li.className = 'queue-item'
      const time = document.createElement('div')
      time.className = 'qi-time'
      const date = document.createElement('span')
      date.className = 'qi-date'
      date.textContent = when.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
      const clock = document.createElement('span')
      clock.className = 'qi-clock'
      clock.textContent = when.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
      time.append(date, clock)
      const body = document.createElement('div')
      body.className = 'qi-body'
      const to = document.createElement('span')
      to.className = 'qi-to'
      to.textContent = e.recipient
      const text = document.createElement('span')
      text.className = 'qi-text'
      text.textContent = e.text
      body.append(to, text)
      li.append(time, body)
      ul.appendChild(li)
    })
  }

  const schedForm = panel.querySelector('#sched-form')
  schedForm.addEventListener('submit', async (ev) => {
    ev.preventDefault()
    const err = panel.querySelector('#sched-error')
    const sendBtn = schedForm.querySelector('.send')
    err.textContent = ''
    sendBtn.disabled = true
    const input = {
      recipient: panel.querySelector('#f-recipient').value,
      text: panel.querySelector('#f-text').value,
      when: new Date(panel.querySelector('#f-when').value),
    }
    const res = await window.crosschat.scheduleMessage(input)
    sendBtn.disabled = false
    if (!res.ok) {
      err.textContent = res.error
      return
    }
    schedForm.reset()
    refreshList()
  })

  refreshList()
}

function currentOrderIds() {
  return [...sidebar.querySelectorAll('button.svc-btn')].map((b) => b.dataset.id)
}

function persistOrder() {
  window.crosschat.reorderServices(currentOrderIds())
}

// Reorder within the sidebar while dragging: move the dragged button before the
// first service button whose vertical midpoint is below the cursor.
sidebar.addEventListener('dragover', (ev) => {
  ev.preventDefault()
  const dragging = sidebar.querySelector('button.svc-btn.dragging')
  if (!dragging) return
  const siblings = [...sidebar.querySelectorAll('button.svc-btn:not(.dragging)')]
  const after = siblings.find((b) => ev.clientY <= b.getBoundingClientRect().top + b.offsetHeight / 2)
  if (after) sidebar.insertBefore(dragging, after)
  else sidebar.insertBefore(dragging, addBtn) // past the last service, keep above the "+"
})

async function openPicker() {
  const [catalog, enabled] = await Promise.all([
    window.crosschat.getCatalog(),
    window.crosschat.getEnabledServices(),
  ])
  const enabledIds = new Set(enabled.map((e) => e.id))
  const available = catalog.filter((e) => !enabledIds.has(e.id))

  const overlay = document.createElement('div')
  overlay.className = 'picker-overlay'
  overlay.addEventListener('click', (ev) => {
    if (ev.target === overlay) overlay.remove()
  })

  const box = document.createElement('div')
  box.className = 'picker'
  box.innerHTML = '<h2>Aggiungi un connettore</h2>'
  if (!available.length) {
    const p = document.createElement('p')
    p.className = 'picker-empty'
    p.textContent = 'Hai già aggiunto tutti i connettori disponibili.'
    box.appendChild(p)
  }
  available.forEach((entry) => {
    const item = document.createElement('button')
    item.className = 'picker-item'
    item.innerHTML = `<img src="${entry.icon}" alt="${entry.name}" /><span>${entry.name}</span>`
    item.addEventListener('click', async () => {
      const updated = await window.crosschat.addService(entry.id)
      const added = updated.find((e) => e.id === entry.id)
      if (added) {
        addServiceToSidebar(added)
        show(added.id)
        ensureLoaded(added) // lazy services load now that the user opened them
      }
      overlay.remove()
    })
    box.appendChild(item)
  })

  overlay.appendChild(box)
  document.body.appendChild(overlay)
}

async function init() {
  buildScheduler()

  addBtn = document.createElement('button')
  addBtn.className = 'add-btn'
  addBtn.textContent = '+'
  addBtn.title = 'Aggiungi connettore'
  addBtn.addEventListener('click', openPicker)
  sidebar.appendChild(addBtn)

  const entries = await window.crosschat.getEnabledServices()
  entries.forEach(addServiceToSidebar)
  positionSchedButton() // anchor the calendar directly under Telegram
  show(firstServiceId())
}

init()
