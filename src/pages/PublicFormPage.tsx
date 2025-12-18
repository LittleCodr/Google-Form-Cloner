import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchFormById, submitFormResponse } from '../services/forms'
import type { FormDefinition, FormField } from '../types/forms'

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

      await submitFormResponse(formId, payload)
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
    return (
      <div className="page">
        <header className="page__header">
          <h1 className="page__title">धन्यवाद!</h1>
          <p className="page__subtitle">आपकी प्रतिक्रिया रिकॉर्ड कर ली गई है।</p>
        </header>
        <div className="stack stack--gap-lg">
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
                  {field.label}
                  {field.required ? <span className="field__required">*</span> : null}
                </label>
                {field.helperText ? <p className="field__helper">{field.helperText}</p> : null}

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
