import { Link } from 'react-router-dom'

type FormTileProps = {
  title: string
  description?: string
  to: string
  cta?: string
}

export function FormTile({ title, description, to, cta = 'खोलें' }: FormTileProps) {
  return (
    <Link className="tile" to={to} aria-label={`${title} फ़ॉर्म खोलें`}>
      <div className="tile__content">
        <h2 className="tile__title">{title}</h2>
        {description ? <p className="tile__description">{description}</p> : null}
      </div>
      <span className="tile__cta">{cta}</span>
    </Link>
  )
}
