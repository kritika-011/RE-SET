import { useState } from 'react'
import ScaleInput from './ScaleInput'

const REACTIONS = [
  { value: 'much_better', emoji: '😌', label: 'Much better' },
  { value: 'a_little_better', emoji: '🙂', label: 'A little better' },
  { value: 'about_the_same', emoji: '😐', label: 'About the same' },
  { value: 'not_really', emoji: '😕', label: 'Not really' },
]

function Feedback({ userId, checkIn, selectedTime, resetType, onComplete }) {
  const [reaction, setReaction] = useState(null)
  const [stressAfter, setStressAfter] = useState(3)
  const [energyAfter, setEnergyAfter] = useState(3)
  const [focusAfter, setFocusAfter] = useState(3)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reaction || submitting) return
    setSubmitting(true)

    const minutes = parseInt(selectedTime, 10)
    let deltas = null
    try {
      const res = await fetch('http://localhost:8000/missions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(userId),
          mood: checkIn.mood,
          minutes,
          resetType,
          energy_before: checkIn.energy,
          stress_before: checkIn.stress,
          focus_before: checkIn.focus,
          goal: checkIn.goal,
          context: checkIn.context,
          feedback: reaction,
          energy_after: energyAfter,
          stress_after: stressAfter,
          focus_after: focusAfter,
        }),
      })
      if (res.ok) {
        deltas = await res.json()
      }
    } catch (err) {
      // best-effort — the user still gets a completion screen either way
    } finally {
      onComplete({
        reaction,
        stressAfter,
        energyAfter,
        focusAfter,
        stress_change: deltas?.stress_change ?? null,
        energy_change: deltas?.energy_change ?? null,
        focus_change: deltas?.focus_change ?? null,
      })
    }
  }

  return (
    <div className="screen feedback-screen">
      <h2>Did that help?</h2>
      <p className="screen-subtitle">A quick check before we wrap up.</p>

      <div className="reaction-row">
        {REACTIONS.map(({ value, emoji, label }) => (
          <button
            key={value}
            type="button"
            className={`reaction-button${reaction === value ? ' selected' : ''}`}
            onClick={() => setReaction(value)}
          >
            <span className="reaction-emoji" aria-hidden="true">
              {emoji}
            </span>
            <span className="reaction-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="checkin-scales">
        <ScaleInput label="Stress now" value={stressAfter} onChange={setStressAfter} />
        <ScaleInput label="Energy now" value={energyAfter} onChange={setEnergyAfter} />
        <ScaleInput label="Focus now" value={focusAfter} onChange={setFocusAfter} />
      </div>

      <button
        type="button"
        className="primary-button"
        onClick={handleSubmit}
        disabled={!reaction || submitting}
      >
        {submitting ? 'Saving...' : 'Continue'}
      </button>
    </div>
  )
}

export default Feedback
