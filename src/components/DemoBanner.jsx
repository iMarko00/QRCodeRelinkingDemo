import { Link } from 'react-router-dom'

export default function DemoBanner() {
  return (
    <div className="demo-banner" role="note">
      Demo page · <Link to="/">Back to control panel</Link>
    </div>
  )
}
