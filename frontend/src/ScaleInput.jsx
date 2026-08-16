function ScaleInput({ label, value, onChange }) {
  const fillPercent = ((value - 1) / 4) * 100

  return (
    <div className="scale-input">
      <div className="scale-input-header">
        <span className="scale-label">{label}</span>
        <span className="scale-value">{value}/5</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="scale-range"
        style={{ '--fill-percent': `${fillPercent}%` }}
        aria-label={`${label}: ${value} out of 5`}
      />
      <div className="scale-endpoints">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  )
}

export default ScaleInput
