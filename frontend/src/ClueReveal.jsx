import { useState } from 'react'

function ClueReveal({ mission, onComplete }) {
  const [clueIndex, setClueIndex] = useState(0)

  const handleDone = () => {
    if (clueIndex === mission.length - 1) {
      onComplete()
    } else {
      setClueIndex(clueIndex + 1)
    }
  }

  return (
    <div>
      <h2>
        Clue {clueIndex + 1} of {mission.length}
      </h2>
      <p>{mission[clueIndex].clue}</p>
      <button type="button" onClick={handleDone}>
        Done
      </button>
    </div>
  )
}

export default ClueReveal
