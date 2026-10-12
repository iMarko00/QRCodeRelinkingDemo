import DemoBanner from '../components/DemoBanner.jsx'

const HIGHLIGHTS = [
  { time: '18:00', title: 'Doors & drinks', text: 'Walk the studio floor and meet the team.' },
  { time: '18:45', title: 'Live teardown', text: 'We rebuild a real brand identity on stage in 30 minutes.' },
  { time: '19:30', title: 'Print lab', text: 'Pull your own riso poster to take home.' },
  { time: '20:15', title: 'Open table', text: 'Bring a project. Get honest feedback.' },
]

export default function Event() {
  return (
    <>
      <DemoBanner />
      <article className="flyer">
        <header className="flyer-hero">
          <p className="flyer-kicker">Acme Studio presents</p>
          <h1 className="flyer-title">
            Open
            <br />
            Studio
            <br />
            Night
          </h1>
          <dl className="flyer-meta">
            <div>
              <dt>When</dt>
              <dd>Thu 19 Nov · 18:00–21:30</dd>
            </div>
            <div>
              <dt>Where</dt>
              <dd>Acme Studio, Unit 4, Canal Works</dd>
            </div>
            <div>
              <dt>Entry</dt>
              <dd>Free · RSVP required</dd>
            </div>
          </dl>
        </header>

        <section className="flyer-body" aria-labelledby="programme">
          <h2 id="programme">The programme</h2>
          <ol className="programme">
            {HIGHLIGHTS.map((h) => (
              <li key={h.time}>
                <span className="programme-time">{h.time}</span>
                <div>
                  <h3>{h.title}</h3>
                  <p>{h.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <footer className="flyer-cta">
          <p>Spots are limited to 80 guests.</p>
          <a className="button flyer-button" href="#/book">
            Reserve your spot
          </a>
        </footer>
      </article>
    </>
  )
}
