import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAdmin } from '../contexts/AdminContext'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login } = useAdmin()
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const success = login(passcode)

    if (success) {
      const redirectTo = (location.state as { from?: string } | undefined)?.from ?? '/admin/dashboard'
      navigate(redirectTo, { replace: true })
      return
    }

    setError('पासकोड गलत है। दोबारा प्रयास करें।')
  }

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">एडमिन लॉगिन</h1>
        <p className="page__subtitle">कृपया पासकोड दर्ज करें</p>
      </header>

      <form className="card" onSubmit={handleSubmit}>
        <div className="stack stack--gap-md">
          <label className="field__label" htmlFor="passcode">
            पासकोड
          </label>
          <input
            id="passcode"
            type="password"
            className="field__input"
            value={passcode}
            onChange={(event) => {
              setPasscode(event.target.value)
              setError(null)
            }}
            autoComplete="one-time-code"
            inputMode="numeric"
            placeholder="पासकोड"
            required
          />
          {error ? <p className="field__error">{error}</p> : null}
        </div>

        <button className="button" type="submit">
          डैशबोर्ड खोलें
        </button>
      </form>
    </div>
  )
}
