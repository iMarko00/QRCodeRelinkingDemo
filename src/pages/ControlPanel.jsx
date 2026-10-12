import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  CUSTOM_ID,
  PRESETS,
  clearScans,
  describeTarget,
  getConfig,
  getScans,
  isValidHttpUrl,
  setConfig,
  subscribe,
} from '../backend/routingBackend.js'

function relinkUrl() {
  return new URL('#/go', window.location.href.split('#')[0]).toString()
}

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })

export default function ControlPanel() {
  const [config, setLocalConfig] = useState(null)
  const [scans, setScans] = useState([])
  const [customDraft, setCustomDraft] = useState('')
  const [customError, setCustomError] = useState('')
  const [copied, setCopied] = useState(false)
  const customInputRef = useRef(null)
  const qrUrl = useMemo(relinkUrl, [])

  const refresh = useCallback(async () => {
    const [cfg, log] = await Promise.all([getConfig(), getScans()])
    setLocalConfig(cfg)
    setScans(log)
  }, [])

  useEffect(() => {
    refresh().then(() => getConfig().then((cfg) => setCustomDraft(cfg.customUrl)))
    return subscribe(refresh)
  }, [refresh])

  if (!config) return null

  const active = describeTarget(config)

  async function choose(id) {
    setCustomError('')
    if (id === CUSTOM_ID && !isValidHttpUrl(config.customUrl)) {
      setCustomError('Enter a valid http(s) URL and press “Use this URL” first.')
      customInputRef.current?.focus()
      return
    }
    await setConfig({ activeId: id })
  }

  async function saveCustom(e) {
    e.preventDefault()
    if (!isValidHttpUrl(customDraft)) {
      setCustomError('Only http:// or https:// links are allowed.')
      customInputRef.current?.focus()
      return
    }
    try {
      await setConfig({ customUrl: customDraft, activeId: CUSTOM_ID })
      setCustomError('')
    } catch (err) {
      setCustomError(err.message)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(qrUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.prompt('Copy this link:', qrUrl)
    }
  }

  const options = [...PRESETS.map((p) => ({ id: p.id, label: p.label })), { id: CUSTOM_ID, label: 'Custom URL' }]

  return (
    <div className="panel-page">
      <header className="panel-header">
        <p className="eyebrow">Acme Studio · Proof of concept</p>
        <h1>QR code relinking</h1>
        <p className="lede">
          Print this code once. Change where it leads below — the code itself never changes.
        </p>
      </header>

      <main className="panel-grid">
        <section className="card qr-card" aria-labelledby="qr-heading">
          <h2 id="qr-heading">Your QR code</h2>
          <div className="qr-frame">
            <QRCodeSVG value={qrUrl} size={224} level="M" marginSize={2} title="QR code for the relink URL" />
          </div>
          <p className="qr-url">
            <code>{qrUrl}</code>
          </p>
          <div className="button-row">
            <button type="button" onClick={copyLink}>
              {copied ? 'Copied' : 'Copy link'}
            </button>
            <a className="button primary" href={qrUrl} target="_blank" rel="noopener">
              Simulate scan ↗
            </a>
          </div>
        </section>

        <section className="card" aria-labelledby="dest-heading">
          <h2 id="dest-heading">Destination</h2>

          <p className="status" aria-live="polite">
            Currently active: <strong>{active.label}</strong>
            {active.external && <span className="status-url">{active.url}</span>}
          </p>

          <fieldset className="choices">
            <legend className="visually-hidden">Choose where the QR code leads</legend>
            {options.map((opt) => (
              <label key={opt.id} className={`choice${config.activeId === opt.id ? ' is-active' : ''}`}>
                <input
                  type="radio"
                  name="destination"
                  value={opt.id}
                  checked={config.activeId === opt.id}
                  onChange={() => choose(opt.id)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </fieldset>

          <form className="custom-form" onSubmit={saveCustom} noValidate>
            <label htmlFor="custom-url">Custom URL</label>
            <div className="custom-row">
              <input
                ref={customInputRef}
                id="custom-url"
                type="url"
                inputMode="url"
                placeholder="https://example.com/landing"
                value={customDraft}
                onChange={(e) => {
                  setCustomDraft(e.target.value)
                  if (customError) setCustomError('')
                }}
                aria-invalid={customError ? 'true' : 'false'}
                aria-describedby="custom-hint"
              />
              <button type="submit">Use this URL</button>
            </div>
            <p id="custom-hint" className={customError ? 'hint error' : 'hint'} role={customError ? 'alert' : undefined}>
              {customError || 'http:// or https:// only.'}
            </p>
          </form>
        </section>

        <section className="card log-card" aria-labelledby="log-heading">
          <div className="log-head">
            <h2 id="log-heading">Scan log</h2>
            {scans.length > 0 && (
              <button type="button" className="link-button" onClick={clearScans}>
                Clear
              </button>
            )}
          </div>
          {scans.length === 0 ? (
            <p className="muted">No scans yet. Press “Simulate scan” to try it.</p>
          ) : (
            <ol className="log">
              {scans.map((s) => (
                <li key={s.at}>
                  <time dateTime={s.at}>{timeFormat.format(new Date(s.at))}</time>
                  <span>{s.label}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>

      <footer className="panel-footer">
        <p>
          <strong>POC limitation:</strong> the destination setting is stored in this browser (localStorage). A phone
          scanning the code won’t see what you set on this laptop — open the code in this browser, or use “Simulate
          scan”. A real deployment moves this setting to a small backend.
        </p>
      </footer>
    </div>
  )
}
