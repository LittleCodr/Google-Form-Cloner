import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchFormById, fetchFormResponses, submitFormResponse } from '../services/forms'
import { evaluateQuizSubmission } from '../services/quizEvaluator'
import type { FormDefinition, FormField, FormResponse } from '../types/forms'

type LeaderboardEntry = {
  id: string
  name: string
  score: number
  maxScore: number
  submittedAt?: Date
}

type QuestionFeedback = {
  fieldId: string
  label: string
  isCorrect: boolean
  userAnswer?: string | string[]
  correctAnswer?: string | string[]
}

function collectAllFields(form: FormDefinition): FormField[] {
  const fields = [...form.fields]

  form.sections?.forEach((section) => {
    section.fields.forEach((field) => {
      fields.push(field)
    })
  })

  return fields
}

function extractDisplayName(
  answers: Record<string, unknown>,
  fields: FormField[],
): string {
  const preferredIds = [
    'participant_name',
    'student_name',
    'studentName',
    'participantName',
    'name',
    'full_name',
  ]

  for (const key of preferredIds) {
    const value = answers[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
  }

  const fallbackField = fields.find((field) => {
    const matchTarget = `${field.id} ${field.label ?? ''}`.toLowerCase()
    return matchTarget.includes('नाम') || matchTarget.includes('name')
  })

  if (fallbackField) {
    const value = answers[fallbackField.id]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
  }

  return 'प्रतिभागी'
}

function buildLeaderboard(responses: FormResponse[], form: FormDefinition): LeaderboardEntry[] {
  const fields = collectAllFields(form)

  const entries = responses
    .filter((response) => response.scoring && response.scoring.maxScore > 0)
    .map((response) => {
      const scoring = response.scoring!
      return {
        id: response.id,
        name: extractDisplayName(response.answers, fields),
        score: scoring.totalScore,
        maxScore: scoring.maxScore,
        submittedAt: response.submittedAt,
      }
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }

      const aTime = a.submittedAt ? a.submittedAt.getTime() : Number.MAX_SAFE_INTEGER
      const bTime = b.submittedAt ? b.submittedAt.getTime() : Number.MAX_SAFE_INTEGER
      return aTime - bTime
    })

  return entries.slice(0, 5)
}

function getInitialValue(field: FormField): string | string[] {
  if (field.type === 'checkbox') {
    return []
  }
  return ''
}

export function PublicFormPage() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const [formDefinition, setFormDefinition] = useState<FormDefinition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string | string[]>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [scoreSummary, setScoreSummary] = useState<{ total: number; max: number } | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null)
  const [scoreUnavailable, setScoreUnavailable] = useState(false)
  const [questionFeedback, setQuestionFeedback] = useState<QuestionFeedback[]>([])

  const allFields = useMemo(() => {
    if (!formDefinition) {
      return [] as FormField[]
    }
    return collectAllFields(formDefinition)
  }, [formDefinition])

  const renderRichText = (text?: string) => {
    if (!text) {
      return null
    }

    const hasMarkup = /<\w+/.test(text)

    if (hasMarkup) {
      return <span dangerouslySetInnerHTML={{ __html: text }} />
    }

    return text
  }

  useEffect(() => {
    if (!formId) {
      setError('फ़ॉर्म नहीं मिला।')
      setLoading(false)
      return
    }

    let isMounted = true

    fetchFormById(formId)
      .then((form) => {
        if (!isMounted) {
          return
        }

        if (!form) {
          setError('फ़ॉर्म उपलब्ध नहीं है।')
          setLoading(false)
          return
        }

        setFormDefinition(form)
        const initialValues: Record<string, string | string[]> = {}
        form.fields.forEach((field) => {
          initialValues[field.id] = getInitialValue(field)
        })
        setFormValues(initialValues)
        setLoading(false)
      })
      .catch(() => {
        if (isMounted) {
          setError('फ़ॉर्म लोड करने में समस्या आ रही है।')
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [formId])

  const pageTitle = useMemo(() => {
    if (!formDefinition) {
      return 'फ़ॉर्म'
    }
    return formDefinition.title
  }, [formDefinition])

  const handleTextChange = (fieldId: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  const handleRadioChange = (fieldId: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  const handleCheckboxChange = (fieldId: string, optionValue: string) => {
    setFormValues((prev) => {
      const current = Array.isArray(prev[fieldId]) ? (prev[fieldId] as string[]) : []
      const next = current.includes(optionValue)
        ? current.filter((value) => value !== optionValue)
        : [...current, optionValue]

      return {
        ...prev,
        [fieldId]: next,
      }
    })
  }

  const validate = (): boolean => {
    if (!formDefinition) {
      return false
    }

    const errors: Record<string, string> = {}

    formDefinition.fields.forEach((field) => {
      if (!field.required) {
        return
      }

      const value = formValues[field.id]

      if (field.type === 'checkbox') {
        const selections = Array.isArray(value) ? value : []
        if (selections.length === 0) {
          errors[field.id] = 'यह आवश्यक है।'
        }
      } else {
        if (!value || typeof value !== 'string' || value.trim() === '') {
          errors[field.id] = 'यह आवश्यक है।'
        }
      }
    })

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)

    if (!formDefinition || !formId) {
      setSubmitError('फ़ॉर्म उपलब्ध नहीं है।')
      return
    }

    const isValid = validate()

    if (!isValid) {
      return
    }

    setIsSubmitting(true)

    try {
      const payload: Record<string, unknown> = {}

      formDefinition.fields.forEach((field) => {
        const value = formValues[field.id]
        if (field.type === 'checkbox') {
          payload[field.id] = Array.isArray(value) ? value : []
        } else {
          payload[field.id] = typeof value === 'string' ? value.trim() : ''
        }
      })

      const scoring = await evaluateQuizSubmission(formDefinition, payload)
      await submitFormResponse(formId, payload, scoring)

      if (scoring.maxScore > 0) {
        setScoreSummary({ total: scoring.totalScore, max: scoring.maxScore })
        setScoreUnavailable(false)
      } else {
        setScoreSummary(null)
        setScoreUnavailable(true)
      }

      if (scoring.evaluations.length > 0) {
        const fieldMap = new Map(allFields.map((field) => [field.id, field]))
        setQuestionFeedback(
          scoring.evaluations.map((evaluation) => {
            const field = fieldMap.get(evaluation.fieldId)
            return {
              fieldId: evaluation.fieldId,
              label: field?.label ?? evaluation.fieldId,
              isCorrect: evaluation.isCorrect,
              userAnswer: evaluation.userAnswer,
              correctAnswer: evaluation.correctAnswer,
            }
          }),
        )
      } else {
        setQuestionFeedback([])
      }

      try {
        const responses = await fetchFormResponses(formId)
        setLeaderboard(buildLeaderboard(responses, formDefinition))
        setLeaderboardError(null)
      } catch (leaderboardErr) {
        console.error(leaderboardErr)
        setLeaderboard([])
        setLeaderboardError('लीडरबोर्ड अभी उपलब्ध नहीं है।')
      }

      setHasSubmitted(true)
    } catch (submitErr) {
      console.error(submitErr)
      setSubmitError('सबमिट करते समय समस्या हुई। बाद में पुनः प्रयास करें।')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    if (!formDefinition) {
      return
    }

    const resetValues: Record<string, string | string[]> = {}
    formDefinition.fields.forEach((field) => {
      resetValues[field.id] = getInitialValue(field)
    })
    setFormValues(resetValues)
    setFieldErrors({})
    setHasSubmitted(false)
    setSubmitError(null)
    setScoreSummary(null)
    setLeaderboard([])
    setLeaderboardError(null)
    setScoreUnavailable(false)
    setQuestionFeedback([])
  }

  if (loading) {
    return (
      <div className="page">
        <p className="message">लोड हो रहा है…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <p className="message message--error">{error}</p>
        <button className="button" onClick={() => navigate(-1)}>
          वापस जाएँ
        </button>
      </div>
    )
  }

  if (!formDefinition) {
    return (
      <div className="page">
        <p className="message message--error">यह फ़ॉर्म उपलब्ध नहीं है।</p>
        <button className="button" onClick={() => navigate('/')}>सभी फ़ॉर्म देखें</button>
      </div>
    )
  }

  if (hasSubmitted) {
    const formatAnswer = (answer?: string | string[]): string => {
      if (!answer) {
        return '—'
      }

      if (Array.isArray(answer)) {
        if (answer.length === 0) {
          return '—'
        }
        return answer.join(', ')
      }

      return answer
    }

    return (
      <div className="page">
        <header className="page__header">
          <h1 className="page__title">धन्यवाद!</h1>
          <p className="page__subtitle">आपकी प्रतिक्रिया रिकॉर्ड कर ली गई है।</p>
        </header>
        <div className="stack stack--gap-lg">
          <div className="card">
            <div className="stack stack--gap-sm">
              <h2>आपका स्कोर</h2>
              {scoreSummary ? (
                <p>
                  आपने {scoreSummary.total} में से {scoreSummary.max} अंक प्राप्त किए।
                </p>
              ) : scoreUnavailable ? (
                <p>इस फ़ॉर्म के लिए स्वचालित स्कोरिंग उपलब्ध नहीं है।</p>
              ) : (
                <p>स्कोर का निर्धारण नहीं हो सका।</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="stack stack--gap-sm">
              <h2>आपके जवाब</h2>
              {scoreUnavailable || questionFeedback.length === 0 ? (
                <p>इस फ़ॉर्म के लिए विस्तृत प्रतिक्रिया उपलब्ध नहीं है।</p>
              ) : (
                <ol className="stack stack--gap-sm">
                  {questionFeedback.map((item, index) => (
                    <li key={item.fieldId} className="leaderboard__item">
                      <div className="stack stack--gap-xs">
                        <div style={{ fontWeight: 600 }}>
                          <span>{index + 1}. </span>
                          {renderRichText(item.label)}
                        </div>
                        <div>
                          {item.isCorrect ? '✅' : '❌'} आपका उत्तर: {formatAnswer(item.userAnswer)}
                        </div>
                        {!item.isCorrect ? (
                          <div>सही उत्तर: {formatAnswer(item.correctAnswer)}</div>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          <div className="card">
            <div className="stack stack--gap-sm">
              <h2>लीडरबोर्ड</h2>
              {leaderboard.length > 0 ? (
                <ol className="stack stack--gap-sm">
                  {leaderboard.map((entry, index) => (
                    <li key={entry.id} className="leaderboard__item">
                      <div className="leaderboard__row" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                        <span>{index + 1}. {entry.name}</span>
                        <span>{entry.score} / {entry.maxScore}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p>{leaderboardError ?? 'अब तक स्कोर उपलब्ध नहीं है।'}</p>
              )}
            </div>
          </div>

          <button className="button" onClick={() => navigate('/')}>अन्य फ़ॉर्म देखें</button>
          <button className="button button--secondary" onClick={handleReset}>फिर से भरें</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">{pageTitle}</h1>
        {formDefinition.description ? (
          <p className="page__subtitle">{formDefinition.description}</p>
        ) : null}
      </header>

      <form className="card" onSubmit={handleSubmit} noValidate>
        <div className="stack stack--gap-lg">
          {formDefinition.fields.map((field) => {
            const value = formValues[field.id]
            const errorText = fieldErrors[field.id]

            return (
              <div key={field.id} className="field">
                <label className="field__label" htmlFor={field.id} id={`${field.id}-label`}>
                  {renderRichText(field.label)}
                  {field.required ? <span className="field__required">*</span> : null}
                </label>
                {field.helperText ? (
                  <p className="field__helper">{renderRichText(field.helperText)}</p>
                ) : null}

                {field.type === 'short_text' ? (
                  <input
                    id={field.id}
                    name={field.id}
                    className="field__input"
                    type="text"
                    value={typeof value === 'string' ? value : ''}
                    onChange={(event) => handleTextChange(field.id, event.target.value)}
                    aria-invalid={Boolean(errorText)}
                    required={field.required}
                  />
                ) : null}

                {field.type === 'long_text' ? (
                  <textarea
                    id={field.id}
                    name={field.id}
                    className="field__textarea"
                    value={typeof value === 'string' ? value : ''}
                    onChange={(event) => handleTextChange(field.id, event.target.value)}
                    aria-invalid={Boolean(errorText)}
                    required={field.required}
                    rows={4}
                  />
                ) : null}

                {field.type === 'radio' && field.options ? (
                  <div className="choice-group" role="radiogroup" aria-labelledby={`${field.id}-label`}>
                    {field.options.map((option) => (
                      <label key={option.id} className="choice">
                        <input
                          type="radio"
                          name={field.id}
                          value={option.value}
                          checked={value === option.value}
                          onChange={() => handleRadioChange(field.id, option.value)}
                          required={field.required}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                ) : null}

                {field.type === 'dropdown' && field.options ? (
                  <select
                    id={field.id}
                    name={field.id}
                    className="field__input"
                    value={typeof value === 'string' ? value : ''}
                    onChange={(event) => handleRadioChange(field.id, event.target.value)}
                    aria-invalid={Boolean(errorText)}
                    required={field.required}
                  >
                    <option value="" disabled>
                      विकल्प चुनें
                    </option>
                    {field.options.map((option) => (
                      <option key={option.id} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : null}

                {field.type === 'checkbox' && field.options ? (
                  <div className="choice-group" role="group" aria-labelledby={`${field.id}-label`}>
                    {field.options.map((option) => {
                      const selections = Array.isArray(value) ? value : []
                      const checked = selections.includes(option.value)

                      return (
                        <label key={option.id} className="choice">
                          <input
                            type="checkbox"
                            name={`${field.id}[]`}
                            value={option.value}
                            checked={checked}
                            onChange={() => handleCheckboxChange(field.id, option.value)}
                          />
                          <span>{option.label}</span>
                        </label>
                      )
                    })}
                  </div>
                ) : null}

                {errorText ? <p className="field__error">{errorText}</p> : null}
              </div>
            )
          })}
        </div>

        {submitError ? <p className="message message--error">{submitError}</p> : null}

        <div className="form-actions">
          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'सबमिट हो रहा है…' : 'सबमिट करें'}
          </button>
          <button className="button button--secondary" type="button" onClick={() => navigate(-1)}>
            वापस जाएँ
          </button>
        </div>
      </form>
    </div>
  )
}
