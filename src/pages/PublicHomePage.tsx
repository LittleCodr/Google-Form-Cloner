import { useEffect, useState } from 'react'
import { FormTile } from '../components/FormTile'
import { fetchForms } from '../services/forms'
import type { FormDefinition } from '../types/forms'

export function PublicHomePage() {
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
      .catch((fetchError) => {
        console.error('Failed to load forms from Firestore', fetchError)
        if (isMounted) {
          setError('फ़ॉर्म लोड नहीं हो पा रहे हैं। बाद में फिर कोशिश करें।')
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
      <header className="page__header">
        <h1 className="page__title">उपलब्ध फ़ॉर्म</h1>
        <p className="page__subtitle">अपना वर्ग चुनें और फ़ॉर्म भरें</p>
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
                to={`/form/${form.id}`}
              />
            ))
          ) : (
            <p className="message">अभी कोई फ़ॉर्म उपलब्ध नहीं है।</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
