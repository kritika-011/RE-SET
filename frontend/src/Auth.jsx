import { useState } from 'react'
import { API_BASE_URL } from './config'

function Auth({ onAuthComplete }) {
  const [mode, setMode] = useState('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const isSignup = mode === 'signup'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const endpoint = isSignup ? 'signup' : 'login'
      const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'Something went wrong. Please try again.')
      }
      const data = await res.json()
      onAuthComplete(data.user_id)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleMode = () => {
    setMode(isSignup ? 'login' : 'signup')
    setError(null)
  }

  return (
    <div className="screen">
      <h2>{isSignup ? 'Create your account' : 'Welcome back'}</h2>
      <p className="screen-subtitle">
        {isSignup
          ? 'Just an email and password to track your resets and streaks.'
          : 'Log in to pick up your streak.'}
      </p>
      <form className="signup-form" onSubmit={handleSubmit}>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="text-input"
        />
        <input
          type="password"
          required
          minLength={isSignup ? 6 : undefined}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="text-input"
        />
        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? 'Please wait...' : isSignup ? 'Sign up' : 'Log in'}
        </button>
      </form>
      {error && <p className="error-detail">{error}</p>}
      <button type="button" className="link-button" onClick={toggleMode}>
        {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
      </button>
    </div>
  )
}

export default Auth
