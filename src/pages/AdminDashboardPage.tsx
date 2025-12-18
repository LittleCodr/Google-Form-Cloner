import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormTile } from '../components/FormTile'
import { useAdmin } from '../contexts/AdminContext'
import { fetchForms } from '../services/forms'
import type { FormDefinition } from '../types/forms'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { logout } = useAdmin()
  const [forms, setForms] = useState<FormDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    fetchForms()
      .then((data) => {
        if (isMounted) {
          setForms(data)
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('फ़ॉर्म सूची लोड नहीं हो पा रही है।')
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="page">
      <header className="page__header page__header--row">
        <div>
          <h1 className="page__title">एडमिन डैशबोर्ड</h1>
          <p className="page__subtitle">प्रत्येक फ़ॉर्म के जवाब देखें</p>
        </div>
        <button
          className="button button--secondary"
          onClick={() => {
            logout()
            navigate('/')
          }}
        >
          लॉगआउट
        </button>
      </header>

      {loading ? <p className="message">लोड हो रहा है…</p> : null}
      {error ? <p className="message message--error">{error}</p> : null}

      {!loading && !error ? (
        <div className="grid">
          {forms.length > 0 ? (
            forms.map((form) => (
              <FormTile
                key={form.id}
                title={form.title}
                description={form.description}
                to={`/admin/form/${form.id}`}
                cta="जवाब"
              />
            ))
          ) : (
            <p className="message">अभी तक किसी फ़ॉर्म पर जवाब नहीं आए हैं।</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
