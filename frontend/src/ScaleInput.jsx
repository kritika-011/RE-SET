function ScaleInput({ label, value, onChange }) {
  const fillPercent = ((value - 1) / 4) * 100

  return (
    <div className="scale-input">
      <div className="scale-input-header">
        <span className="scale-label">{label}</span>
        <span className="scale-value">{value}/5</span>
      </div>
      <div className="scale-track-wrap">
        <div className="scale-track">
          <div className="scale-track-fill" style={{ width: `${fillPercent}%` }} />
        </div>
        <div className="scale-nodes">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`scale-node${value === n ? ' selected' : ''}`}
              onClick={() => onChange(n)}
              aria-label={`${label}: ${n} out of 5`}
            />
          ))}
        </div>
      </div>
      <div className="scale-endpoints">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  )
}

export default ScaleInput
