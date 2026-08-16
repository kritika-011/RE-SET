import { useEffect, useState } from 'react'

const REACTION_LABELS = {
  much_better: { emoji: '😌', label: 'Much better' },
  a_little_better: { emoji: '🙂', label: 'A little better' },
  about_the_same: { emoji: '😐', label: 'About the same' },
  not_really: { emoji: '😕', label: 'Not really' },
}

function BarRow({ label, value, changeValue }) {
  let fillClass = 'ba-fill'
  if (typeof changeValue === 'number') {
    fillClass += changeValue > 0 ? ' improved' : changeValue < 0 ? ' declined' : ''
  }
  return (
    <div className="ba-row">
      <span className="ba-row-label">{label}</span>
      <div className="ba-track">
        <div className={fillClass} style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className="ba-value">{value}/5</span>
    </div>
  )
}

function changeSentence(change) {
  if (change === null || change === undefined) return null
  if (change > 0) {
    return `Your reported stress decreased by ${change} point${change === 1 ? '' : 's'}.`
  }
  if (change < 0) {
    const abs = Math.abs(change)
    return `Your reported stress increased by ${abs} point${abs === 1 ? '' : 's'}.`
  }
  return 'Your reported stress stayed about the same.'
}

function Completion({
  userId,
  checkIn,
  feedbackResult,
  selectedTime,
  totalClues,
  onStartOver,
  onViewInsights,
}) {
  const [streak, setStreak] = useState(null)
  const hasBeforeAfter = Boolean(checkIn && feedbackResult)
  const reactionInfo = feedbackResult ? REACTION_LABELS[feedbackResult.reaction] : null

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    fetch(`http://localhost:8000/missions/streak/${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setStreak(data.streak)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [userId])

  return (
    <div className="screen completion-screen">
      <div className="celebration" aria-hidden="true">
        <span className="celebration-ring ring-1" />
        <span className="celebration-ring ring-2" />
        <span className="celebration-star star-1">✦</span>
        <span className="celebration-star star-2">✦</span>
        <span className="celebration-star star-3">✦</span>
        <span className="celebration-core">✨</span>
      </div>

      <h2 className="completion-headline">You reset.</h2>
      <p className="completion-subline">You showed up for yourself.</p>

      <p className="completion-stats">
        <strong>{selectedTime}</strong> complete ·{' '}
        <strong>
          {totalClues}/{totalClues}
        </strong>{' '}
        challenges
      </p>

      {reactionInfo && (
        <p className="reaction-summary">
          <span aria-hidden="true">{reactionInfo.emoji}</span> {reactionInfo.label}
        </p>
      )}

      {streak !== null && streak > 0 && (
        <p className="completion-streak">
          🔥 {streak} day{streak === 1 ? '' : 's'}
        </p>
      )}

      {hasBeforeAfter && (
        <div className="before-after">
          <div className="ba-block">
            <span className="ba-block-label">Before</span>
            <BarRow label="Stress" value={checkIn.stress} />
            <BarRow label="Energy" value={checkIn.energy} />
            <BarRow label="Focus" value={checkIn.focus} />
          </div>
          <span className="ba-arrow" aria-hidden="true">
            ↓
          </span>
          <div className="ba-block">
            <span className="ba-block-label">After</span>
            <BarRow
              label="Stress"
              value={feedbackResult.stressAfter}
              changeValue={feedbackResult.stress_change}
            />
            <BarRow
              label="Energy"
              value={feedbackResult.energyAfter}
              changeValue={feedbackResult.energy_change}
            />
            <BarRow
              label="Focus"
              value={feedbackResult.focusAfter}
              changeValue={feedbackResult.focus_change}
            />
          </div>
          {feedbackResult.stress_change > 0 && <p className="ba-shift-tag">✨ Nice shift.</p>}
          {changeSentence(feedbackResult.stress_change) && (
            <p className="ba-summary">{changeSentence(feedbackResult.stress_change)}</p>
          )}
        </div>
      )}

      <div className="completion-actions">
        {onViewInsights && (
          <button type="button" className="secondary-button" onClick={onViewInsights}>
            See your progress
          </button>
        )}
        <button type="button" className="primary-button" onClick={onStartOver}>
          Start Over
        </button>
      </div>
    </div>
  )
}

export default Completion
