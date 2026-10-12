import { useMemo, useState } from 'react'
import DemoBanner from '../components/DemoBanner.jsx'

const SLOTS = ['09:00', '09:30', '10:00', '11:00', '11:30', '13:00', '14:00', '14:30', '15:30', '16:00']

function nextWeekdays(count) {
  const days = []
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  while (days.length < count) {
    d.setDate(d.getDate() + 1)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) days.push(new Date(d))
  }
  return days
}

// Deterministic "already booked" slots so the picker looks lived-in.
function isTaken(day, slot) {
  return (day.getDate() * 7 + SLOTS.indexOf(slot) * 3) % 5 === 0
}

const dayLabel = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
const dateLabel = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })
const longDate = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

export default function Book() {
  const days = useMemo(() => nextWeekdays(6), [])
  const [dayIndex, setDayIndex] = useState(0)
  const [slot, setSlot] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [confirmed, setConfirmed] = useState(null)

  const day = days[dayIndex]

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!slot) next.slot = 'Pick a time.'
    if (!name.trim()) next.name = 'Enter your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email address.'
    setErrors(next)
    if (Object.keys(next).length === 0) setConfirmed({ day, slot, name: name.trim(), email: email.trim() })
  }

  return (
    <>
      <DemoBanner />
      <div className="book-page">
        <header className="book-header">
          <p className="eyebrow">Acme Studio</p>
          <h1>Book a 30-minute intro call</h1>
          <p className="lede">Tell us about your project. Free, no obligation, on video.</p>
        </header>

        {confirmed ? (
          <section className="card confirm" aria-live="polite">
            <div className="check" aria-hidden="true">✓</div>
            <h2>You’re booked, {confirmed.name.split(' ')[0]}</h2>
            <p>
              {longDate.format(confirmed.day)} at <strong>{confirmed.slot}</strong>
            </p>
            <p className="muted">
              A confirmation would go to {confirmed.email}. (Demo only — nothing was sent.)
            </p>
            <button
              type="button"
              onClick={() => {
                setConfirmed(null)
                setSlot('')
              }}
            >
              Book another time
            </button>
          </section>
        ) : (
          <form className="card book-form" onSubmit={submit} noValidate>
            <fieldset>
              <legend>1. Pick a day</legend>
              <div className="day-strip">
                {days.map((d, i) => (
                  <label key={d.toISOString()} className={`day${i === dayIndex ? ' is-active' : ''}`}>
                    <input
                      type="radio"
                      name="day"
                      checked={i === dayIndex}
                      onChange={() => {
                        setDayIndex(i)
                        setSlot('')
                      }}
                    />
                    <span className="day-name">{dayLabel.format(d)}</span>
                    <span className="day-date">{dateLabel.format(d)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset aria-describedby={errors.slot ? 'slot-error' : undefined}>
              <legend>2. Pick a time</legend>
              <div className="slot-grid">
                {SLOTS.map((s) => {
                  const taken = isTaken(day, s)
                  return (
                    <label key={s} className={`slot${slot === s ? ' is-active' : ''}${taken ? ' is-taken' : ''}`}>
                      <input
                        type="radio"
                        name="slot"
                        value={s}
                        disabled={taken}
                        checked={slot === s}
                        onChange={() => setSlot(s)}
                      />
                      <span>{s}</span>
                    </label>
                  )
                })}
              </div>
              {errors.slot && (
                <p id="slot-error" className="hint error">
                  {errors.slot}
                </p>
              )}
            </fieldset>

            <fieldset>
              <legend>3. Your details</legend>
              <div className="field">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="hint error">
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="hint error">
                    {errors.email}
                  </p>
                )}
              </div>
            </fieldset>

            <button type="submit" className="primary block">
              {slot ? `Confirm ${dayLabel.format(day)} ${slot}` : 'Confirm booking'}
            </button>
          </form>
        )}
      </div>
    </>
  )
}
