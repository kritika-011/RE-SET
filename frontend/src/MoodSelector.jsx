function MoodSelector({ onSelect }) {
  const moods = ['Overwhelmed', 'Exhausted', 'Bored', 'Stuck']

  return (
    <div>
      <h2>How are you feeling?</h2>
      {moods.map((mood) => (
        <button key={mood} type="button" onClick={() => onSelect(mood)}>
          {mood}
        </button>
      ))}
    </div>
  )
}

export default MoodSelector
