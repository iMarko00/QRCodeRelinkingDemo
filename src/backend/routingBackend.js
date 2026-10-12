// Fake routing backend. All relink logic lives here, behind an async API
// shaped like a real one, so it can be swapped for a fetch() later.
// UI code must not touch localStorage directly.

const CONFIG_KEY = 'qr-relink:config'
const SCANS_KEY = 'qr-relink:scans'
const MAX_SCANS = 25

export const PRESETS = [
  { id: 'book', label: 'Booking page', route: '/book' },
  { id: 'event', label: 'Event flyer', route: '/event' },
]

export const CUSTOM_ID = 'custom'

const DEFAULT_CONFIG = { activeId: PRESETS[0].id, customUrl: '' }

const listeners = new Set()

export function isValidHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: the demo keeps working in memory for this view.
  }
  listeners.forEach((cb) => cb())
}

function readConfig() {
  const stored = readJson(CONFIG_KEY, DEFAULT_CONFIG)
  const knownIds = [...PRESETS.map((p) => p.id), CUSTOM_ID]
  return {
    activeId: knownIds.includes(stored.activeId) ? stored.activeId : DEFAULT_CONFIG.activeId,
    customUrl: typeof stored.customUrl === 'string' ? stored.customUrl : '',
  }
}

/** Admin: current routing config. */
export async function getConfig() {
  return readConfig()
}

/** Admin: update routing config. Rejects invalid custom URLs. */
export async function setConfig(patch) {
  const next = { ...readConfig(), ...patch }
  if (next.customUrl) next.customUrl = next.customUrl.trim()
  if ('customUrl' in patch && patch.customUrl && !isValidHttpUrl(patch.customUrl)) {
    throw new Error('Custom URL must start with http:// or https://')
  }
  if (next.activeId === CUSTOM_ID && !isValidHttpUrl(next.customUrl)) {
    throw new Error('Save a valid http(s) custom URL before activating it')
  }
  writeJson(CONFIG_KEY, next)
  return next
}

/** Describe a destination without resolving it. */
export function describeTarget(config) {
  if (config.activeId === CUSTOM_ID && isValidHttpUrl(config.customUrl)) {
    return { id: CUSTOM_ID, label: 'Custom URL', external: true, url: config.customUrl }
  }
  const preset = PRESETS.find((p) => p.id === config.activeId) ?? PRESETS[0]
  return { id: preset.id, label: preset.label, external: false, route: preset.route }
}

/**
 * Called by #/go on every scan. Always returns a usable target:
 * an invalid custom URL falls back to the first preset.
 */
export async function resolveScan() {
  return describeTarget(readConfig())
}

export async function logScan(target) {
  const scans = readJson(SCANS_KEY, [])
  const entry = { at: new Date().toISOString(), id: target.id, label: target.label }
  writeJson(SCANS_KEY, [entry, ...scans].slice(0, MAX_SCANS))
  return entry
}

export async function getScans() {
  const scans = readJson(SCANS_KEY, [])
  return Array.isArray(scans) ? scans : []
}

export async function clearScans() {
  writeJson(SCANS_KEY, [])
}

/** Notify on changes from this tab or from other tabs. Returns an unsubscribe fn. */
export function subscribe(cb) {
  const onStorage = (e) => {
    if (e.key === CONFIG_KEY || e.key === SCANS_KEY) cb()
  }
  listeners.add(cb)
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', onStorage)
  }
}
