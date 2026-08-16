import { useState } from 'react'

const RESET_THEME = {
  'Quick Reset': { key: 'quick', emoji: '⚡' },
  'Standard Reset': { key: 'standard', emoji: '🌿' },
  'Deep Reset': { key: 'deep', emoji: '🌙' },
}

function ClueReveal({ mission, resetType, onComplete, onReroll }) {
  const [clueIndex, setClueIndex] = useState(0)
  const [isRerolling, setIsRerolling] = useState(false)
  const theme = RESET_THEME[resetType] || { key: 'standard', emoji: '🌿' }

  const handleDone = () => {
    if (clueIndex === mission.length - 1) {
      onComplete()
    } else {
      setClueIndex(clueIndex + 1)
    }
  }

  const handleReroll = async () => {
    setIsRerolling(true)
    await onReroll(clueIndex)
    setIsRerolling(false)
  }

  return (
    <div className="screen" data-reset={theme.key}>
      {resetType && (
        <span className="reset-type-badge">
          <span aria-hidden="true">{theme.emoji}</span> {resetType}
        </span>
      )}
      <span className="clue-step-label">
        Clue {clueIndex + 1} of {mission.length}
      </span>
      <div className="progress-dots">
        {mission.map((_, i) => (
          <span
            key={i}
            className={`progress-dot${i <= clueIndex ? ' filled' : ''}`}
          />
        ))}
      </div>
      <div className="clue-card" key={clueIndex}>
        <p className="clue-text">{mission[clueIndex].clue}</p>
      </div>
      <button
        type="button"
        className="link-button"
        onClick={handleReroll}
        disabled={isRerolling}
      >
        {isRerolling ? '✨ Finding another one...' : "↻ This doesn't work for me, give me another"}
      </button>
      <button type="button" className="primary-button" onClick={handleDone}>
        Done ✓
      </button>
    </div>
  )
}

export default ClueReveal
