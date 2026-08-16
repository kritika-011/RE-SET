import { useState } from 'react'
import ScaleInput from './ScaleInput'

const MOODS = [
  { value: 'overwhelmed', label: 'Overwhelmed', emoji: '🌊' },
  { value: 'exhausted', label: 'Exhausted', emoji: '🔋' },
  { value: 'bored', label: 'Bored', emoji: '🌀' },
  { value: 'stuck', label: 'Stuck', emoji: '🧩' },
]

const GOALS = [
  { value: 'calm', label: 'Calm down' },
  { value: 'energized', label: 'Get energized' },
  { value: 'clear', label: 'Clear my head' },
  { value: 'focus', label: 'Focus' },
  { value: 'stop_procrastinating', label: 'Stop procrastinating' },
  { value: 'break', label: 'Take a break' },
]

const CONTEXTS = [
  { value: 'home', label: 'Home', emoji: '🏠' },
  { value: 'campus', label: 'Campus', emoji: '🏫' },
  { value: 'work', label: 'Work', emoji: '💻' },
  { value: 'outdoors', label: 'Outdoors', emoji: '🌳' },
]

const STUCK_ACTIVITIES = [
  { value: 'coding', label: 'Coding', emoji: '💻' },
  { value: 'studying', label: 'Studying', emoji: '📚' },
  { value: 'assignment', label: 'Assignment', emoji: '📝' },
  { value: 'work', label: 'Work', emoji: '💼' },
  { value: 'cant_start', label: "Can't start", emoji: '⏸️' },
  { value: 'overwhelmed', label: 'Everything feels overwhelming', emoji: '🌪️' },
]

function CheckIn({ initialMode, onComplete, onViewHistory, onViewInsights }) {
  const [mode, setMode] = useState(initialMode || 'checkin')
  const [mood, setMood] = useState(null)
  const [energy, setEnergy] = useState(3)
  const [stress, setStress] = useState(3)
  const [focus, setFocus] = useState(3)
  const [goal, setGoal] = useState(null)
  const [context, setContext] = useState(null)

  const canContinue = Boolean(mood && goal)

  const handleContinue = () => {
    if (!canContinue) return
    onComplete({ mood, energy, stress, focus, goal, context })
  }

  const handleStuckActivity = (stuckActivity) => {
    onComplete({
      mood: 'stuck',
      energy: 3,
      stress: 3,
      focus: 3,
      goal: null,
      context: null,
      stuckActivity,
    })
  }

  if (mode === 'stuck') {
    return (
      <div className="screen checkin-screen">
        <h2>Stuck happens.</h2>
        <p className="screen-subtitle">Let's break the loop. Tap what's going on.</p>
        <div className="option-grid">
          {STUCK_ACTIVITIES.map(({ value, label, emoji }) => (
            <button
              key={value}
              type="button"
              className="option-button"
              onClick={() => handleStuckActivity(value)}
            >
              <span className="option-emoji" aria-hidden="true">
                {emoji}
              </span>
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="link-button" onClick={() => setMode('checkin')}>
          ← Back
        </button>
      </div>
    )
  }

  return (
    <div className="screen checkin-screen">
      <h2>Quick check-in</h2>
      <p className="screen-subtitle">Takes about 20 seconds.</p>

      <div className="checkin-section">
        <span className="checkin-section-label">How are you feeling?</span>
        <div className="option-grid">
          {MOODS.map(({ value, label, emoji }) => (
            <button
              key={value}
              type="button"
              className={`option-button${mood === value ? ' selected' : ''}`}
              onClick={() => setMood(value)}
            >
              <span className="option-emoji" aria-hidden="true">
                {emoji}
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="checkin-scales">
        <ScaleInput label="Energy" value={energy} onChange={setEnergy} />
        <ScaleInput label="Stress" value={stress} onChange={setStress} />
        <ScaleInput label="Focus" value={focus} onChange={setFocus} />
      </div>

      <div className="checkin-section">
        <span className="checkin-section-label">What do you want right now?</span>
        <div className="pill-row">
          {GOALS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`pill${goal === value ? ' selected' : ''}`}
              onClick={() => setGoal(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="checkin-section">
        <span className="checkin-section-label">Where are you? (optional)</span>
        <div className="pill-row">
          {CONTEXTS.map(({ value, label, emoji }) => (
            <button
              key={value}
              type="button"
              className={`pill${context === value ? ' selected' : ''}`}
              onClick={() => setContext(context === value ? null : value)}
            >
              <span aria-hidden="true">{emoji}</span> {label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="primary-button"
        onClick={handleContinue}
        disabled={!canContinue}
      >
        Continue
      </button>

      <button type="button" className="link-button" onClick={() => setMode('stuck')}>
        I'm stuck instead →
      </button>

      <div className="checkin-footer-links">
        <button type="button" className="link-button" onClick={onViewHistory}>
          View my history
        </button>
        <button type="button" className="link-button" onClick={onViewInsights}>
          View my insights
        </button>
      </div>
    </div>
  )
}

export default CheckIn
