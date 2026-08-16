function TimeSelector({ onSelect }) {
  const times = ['10 min', '15 min', '20 min']

  return (
    <div>
      <h2>How much time do you have?</h2>
      {times.map((time) => (
        <button key={time} type="button" onClick={() => onSelect(time)}>
          {time}
        </button>
      ))}
    </div>
  )
}

export default TimeSelector
