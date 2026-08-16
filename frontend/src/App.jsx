import { useState } from 'react'
import LandingPage from './LandingPage'
import Auth from './Auth'
import CheckIn from './CheckIn'
import TimeSelector from './TimeSelector'
import ClueReveal from './ClueReveal'
import Feedback from './Feedback'
import Completion from './Completion'
import HistoryPage from './HistoryPage'
import InsightsPage from './InsightsPage'
import { API_BASE_URL } from './config'
import './App.css'

const USER_ID_KEY = 'resetapp_user_id'

function App() {
  const [currentScreen, setCurrentScreen] = useState('landing')
  const [userId, setUserId] = useState(() => localStorage.getItem(USER_ID_KEY))
  const [checkIn, setCheckIn] = useState(null)
  const [checkinInitialMode, setCheckinInitialMode] = useState('checkin')
  const [selectedTime, setSelectedTime] = useState(null)
  const [mission, setMission] = useState(null)
  const [resetType, setResetType] = useState(null)
  const [feedbackResult, setFeedbackResult] = useState(null)
  const [error, setError] = useState(null)

  const fetchMission = async (checkInData, time) => {
    setCurrentScreen('loading')
    setError(null)
    try {
      const minutes = parseInt(time, 10)
      const res = await fetch(`${API_BASE_URL}/generate-mission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: checkInData.mood,
          minutes,
          energy: checkInData.energy,
          stress: checkInData.stress,
          focus: checkInData.focus,
          goal: checkInData.goal,
          context: checkInData.context,
          stuckActivity: checkInData.stuckActivity,
        }),
      })
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }
      const data = await res.json()
      setMission(data.steps)
      setResetType(data.resetType)
      setCurrentScreen('clues')
    } catch (err) {
      setError(err.message)
      setCurrentScreen('error')
    }
  }

  const handleGetStarted = () => {
    setCheckinInitialMode('checkin')
    if (userId) {
      setCurrentScreen('checkin')
    } else {
      setCurrentScreen('auth')
    }
  }

  const handleImStuck = () => {
    setCheckinInitialMode('stuck')
    if (userId) {
      setCurrentScreen('checkin')
    } else {
      setCurrentScreen('auth')
    }
  }

  const handleAuthComplete = (newUserId) => {
    localStorage.setItem(USER_ID_KEY, newUserId)
    setUserId(newUserId)
    setCurrentScreen('checkin')
  }

  const handleCheckInComplete = (checkInData) => {
    setCheckIn(checkInData)
    setCurrentScreen('time')
  }

  const handleTimeSelect = (time) => {
    setSelectedTime(time)
    fetchMission(checkIn, time)
  }

  const handleRetry = () => {
    fetchMission(checkIn, selectedTime)
  }

  const handleRerollClue = async (index) => {
    const originalClue = mission[index].clue
    try {
      const res = await fetch(`${API_BASE_URL}/generate-mission/reroll-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: checkIn.mood, originalClue }),
      })
      if (!res.ok) return
      const data = await res.json()
      setMission((prev) => {
        const updated = [...prev]
        updated[index] = { clue: data.clue }
        return updated
      })
    } catch (err) {
      // best-effort — leave the original clue in place on failure
    }
  }

  const handleMissionComplete = () => {
    setCurrentScreen('feedback')
  }

  const handleFeedbackComplete = (result) => {
    setFeedbackResult(result)
    setCurrentScreen('completion')
  }

  const handleStartOver = () => {
    setCheckIn(null)
    setSelectedTime(null)
    setMission(null)
    setResetType(null)
    setFeedbackResult(null)
    setError(null)
    setCheckinInitialMode('checkin')
    setCurrentScreen('checkin')
  }

  const handleViewHistory = () => {
    setCurrentScreen('history')
  }

  const handleViewInsights = () => {
    setCurrentScreen('insights')
  }

  if (currentScreen === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} onImStuck={handleImStuck} />
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="brand">
          <svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true">
            <path
              d="M9 12a7.5 7.5 0 1 1 1.2 7.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M9 7v5.4H14.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          RESET
        </span>
      </header>

      {currentScreen === 'auth' && <Auth onAuthComplete={handleAuthComplete} />}
      {currentScreen === 'checkin' && (
        <CheckIn
          initialMode={checkinInitialMode}
          onComplete={handleCheckInComplete}
          onViewHistory={handleViewHistory}
          onViewInsights={handleViewInsights}
        />
      )}
      {currentScreen === 'history' && (
        <HistoryPage userId={userId} onBack={() => setCurrentScreen('checkin')} />
      )}
      {currentScreen === 'insights' && (
        <InsightsPage userId={userId} onBack={() => setCurrentScreen('checkin')} />
      )}
      {currentScreen === 'time' && <TimeSelector onSelect={handleTimeSelect} />}
      {currentScreen === 'loading' && (
        <div className="screen loading-screen">
          <div className="loading-orb">
            <span className="loading-orb-ring" />
            <span className="loading-orb-core" />
            <span className="loading-spark ls-1">✦</span>
            <span className="loading-spark ls-2">✦</span>
            <span className="loading-spark ls-3">✦</span>
          </div>
          <h2 className="loading-headline">
            Your reset is
            <br />
            taking shape...
          </h2>
          <div className="loading-dots" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="screen-subtitle">Finding something that fits your day.</p>
        </div>
      )}
      {currentScreen === 'error' && (
        <div className="screen">
          <div className="error-card">
            <p className="error-title">Backend not reachable</p>
            <p className="error-detail">{error}</p>
          </div>
          <button type="button" className="primary-button" onClick={handleRetry}>
            Try Again
          </button>
        </div>
      )}
      {currentScreen === 'clues' && (
        <ClueReveal
          mission={mission}
          resetType={resetType}
          onComplete={handleMissionComplete}
          onReroll={handleRerollClue}
        />
      )}
      {currentScreen === 'feedback' && (
        <Feedback
          userId={userId}
          checkIn={checkIn}
          selectedTime={selectedTime}
          resetType={resetType}
          onComplete={handleFeedbackComplete}
        />
      )}
      {currentScreen === 'completion' && (
        <Completion
          userId={userId}
          checkIn={checkIn}
          feedbackResult={feedbackResult}
          selectedTime={selectedTime}
          totalClues={mission.length}
          onStartOver={handleStartOver}
          onViewInsights={handleViewInsights}
        />
      )}
    </div>
  )
}

export default App
