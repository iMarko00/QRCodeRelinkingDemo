import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logScan, resolveScan } from '../backend/routingBackend.js'

const REDIRECT_DELAY_MS = 1200

export default function Go() {
  const navigate = useNavigate()
  const [target, setTarget] = useState(null)
  const started = useRef(false)
  const timer = useRef(null)

  function go(t) {
    clearTimeout(timer.current)
    if (t.external) window.location.replace(t.url)
    else navigate(t.route, { replace: true })
  }

  useEffect(() => {
    // Guard against StrictMode's double effect so each scan logs once.
    if (!started.current) {
      started.current = true
      resolveScan().then((t) => {
        setTarget(t)
        logScan(t)
        timer.current = setTimeout(() => go(t), REDIRECT_DELAY_MS)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <main className="go-page" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      {target ? (
        <>
          <p className="go-title">Taking you to {target.label}…</p>
          <button type="button" className="link-button" onClick={() => go(target)}>
            Go now
          </button>
        </>
      ) : (
        <p className="go-title">Finding your destination…</p>
      )}
    </main>
  )
}
