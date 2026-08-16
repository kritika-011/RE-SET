import { useState } from 'react'
import MoodSelector from './MoodSelector'
import TimeSelector from './TimeSelector'
import ClueReveal from './ClueReveal'
import Completion from './Completion'

const MISSION = [
  { clue: 'Walk toward something green.' },
  { clue: 'Turn onto the quieter road.' },
  { clue: 'Find somewhere to sit for 60 seconds.' },
  { clue: 'Walk home a different way.' },
]

function App() {
  const [currentScreen, setCurrentScreen] = useState('mood')
  const [selectedMood, setSelectedMood] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [mission] = useState(MISSION)

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood)
    setCurrentScreen('time')
  }

  const handleTimeSelect = (time) => {
    setSelectedTime(time)
    setCurrentScreen('clues')
  }

  const handleMissionComplete = () => {
    setCurrentScreen('completion')
  }

  const handleStartOver = () => {
    setSelectedMood(null)
    setSelectedTime(null)
    setCurrentScreen('mood')
  }

  return (
    <div>
      {currentScreen === 'mood' && <MoodSelector onSelect={handleMoodSelect} />}
      {currentScreen === 'time' && <TimeSelector onSelect={handleTimeSelect} />}
      {currentScreen === 'clues' && (
        <ClueReveal mission={mission} onComplete={handleMissionComplete} />
      )}
      {currentScreen === 'completion' && (
        <Completion
          selectedTime={selectedTime}
          totalClues={mission.length}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  )
}

export default App
