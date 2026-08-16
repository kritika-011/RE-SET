function Completion({ selectedTime, totalClues, onStartOver }) {
  return (
    <div>
      <h2>Nice work!</h2>
      <p>
        You moved for {selectedTime}. You completed {totalClues}/{totalClues} challenges.
      </p>
      <button type="button" onClick={onStartOver}>
        Start Over
      </button>
    </div>
  )
}

export default Completion
