const TIMES = [
  { time: '10 min', resetKey: 'quick', resetLabel: 'Quick', emoji: '⚡' },
  { time: '15 min', resetKey: 'standard', resetLabel: 'Standard', emoji: '🌿' },
  { time: '20 min', resetKey: 'deep', resetLabel: 'Deep', emoji: '🌙' },
]

function TimeSelector({ onSelect }) {
  return (
    <div className="screen">
      <h2>How much time do you have?</h2>
      <p className="screen-subtitle">We'll shape your mission around it.</p>
      <div className="option-grid time-grid">
        {TIMES.map(({ time, resetKey, resetLabel, emoji }) => {
          const [value, unit] = time.split(' ')
          return (
            <button
              key={time}
              type="button"
              className="option-button"
              data-reset={resetKey}
              onClick={() => onSelect(time)}
            >
              <span className="option-emoji" aria-hidden="true">
                {emoji}
              </span>
              <span className="time-value">{value}</span>
              <span className="time-unit">{unit}</span>
              <span className="time-reset-hint">{resetLabel}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TimeSelector
