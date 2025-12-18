import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchFormById, fetchFormResponses } from '../services/forms'
import type { FormDefinition, FormResponse } from '../types/forms'

const formatter = new Intl.DateTimeFormat('hi-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function AdminFormResponsesPage() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const [formDefinition, setFormDefinition] = useState<FormDefinition | null>(null)
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!formId) {
      setError('फ़ॉर्म नहीं मिला।')
      setLoading(false)
      return
    }

    let isMounted = true

    Promise.all([fetchFormById(formId), fetchFormResponses(formId)])
      .then(([form, formResponses]) => {
        if (!isMounted) {
          return
        }

        if (!form) {
          setError('फ़ॉर्म उपलब्ध नहीं है।')
          setLoading(false)
          return
        }

        setFormDefinition(form)
        setResponses(formResponses)
        setLoading(false)
      })
      .catch(() => {
        if (isMounted) {
          setError('जवाब लोड नहीं हो पा रहे हैं।')
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [formId])

  const columns = useMemo(() => formDefinition?.fields ?? [], [formDefinition])

  const renderAnswer = (answer: unknown): string => {
    if (Array.isArray(answer)) {
      return answer.join(', ')
    }

    if (typeof answer === 'string' || typeof answer === 'number') {
      return String(answer)
    }

    if (answer === null || answer === undefined) {
      return ''
    }

    return JSON.stringify(answer)
  }

  if (loading) {
    return (
      <div className="page">
        <p className="message">डेटा लोड हो रहा है…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <p className="message message--error">{error}</p>
        <button className="button" onClick={() => navigate('/admin/dashboard')}>डैशबोर्ड पर वापस जाएँ</button>
      </div>
    )
  }

  if (!formDefinition) {
    return (
      <div className="page">
        <p className="message message--error">यह फ़ॉर्म उपलब्ध नहीं है।</p>
        <button className="button" onClick={() => navigate('/admin/dashboard')}>डैशबोर्ड पर वापस जाएँ</button>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page__header page__header--row">
        <div>
          <h1 className="page__title">{formDefinition.title}</h1>
          <p className="page__subtitle">कुल जवाब: {responses.length}</p>
        </div>
        <button className="button button--secondary" onClick={() => navigate('/admin/dashboard')}>
          सभी फ़ॉर्म
        </button>
      </header>

      {responses.length === 0 ? (
        <p className="message">अभी तक कोई जवाब नहीं मिला है।</p>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>जमा समय</th>
                {columns.map((field) => (
                  <th key={field.id}>{field.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {responses.map((response) => (
                <tr key={response.id}>
                  <td>{response.submittedAt ? formatter.format(response.submittedAt) : '—'}</td>
                  {columns.map((field) => (
                    <td key={field.id}>{renderAnswer(response.answers[field.id]) || '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
