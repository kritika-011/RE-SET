import { useEffect, useState } from 'react'
import { API_BASE_URL } from './config'

const MOOD_EMOJI = {
  overwhelmed: '🌊',
  exhausted: '🔋',
  bored: '🌀',
  stuck: '🧩',
}

const RESET_EMOJI = {
  'Quick Reset': '⚡',
  'Standard Reset': '🌿',
  'Deep Reset': '🌙',
}

const FEEDBACK_EMOJI = {
  much_better: '😌',
  a_little_better: '🙂',
  about_the_same: '😐',
  not_really: '😕',
}

function groupByDay(history) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const order = []
  const map = new Map()

  for (const item of history) {
    const d = new Date(item.completed_at)
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    let label
    if (dayStart.getTime() === today.getTime()) label = 'Today'
    else if (dayStart.getTime() === yesterday.getTime()) label = 'Yesterday'
    else label = dayStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

    if (!map.has(label)) {
      map.set(label, [])
      order.push(label)
    }
    map.get(label).push(item)
  }

  return order.map((label) => [label, map.get(label)])
}

function HistoryPage({ userId, onBack }) {
  const [history, setHistory] = useState([])
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [historyRes, streakRes] = await Promise.all([
          fetch(`${API_BASE_URL}/missions/history/${userId}`),
          fetch(`${API_BASE_URL}/missions/streak/${userId}`),
        ])
        if (!historyRes.ok || !streakRes.ok) {
          throw new Error('Could not load history')
        }
        const historyData = await historyRes.json()
        const streakData = await streakRes.json()
        if (!cancelled) {
          setHistory(historyData)
          setStreak(streakData.streak)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  const grouped = groupByDay(history)

  return (
    <div className="screen history-screen">
      <h2>Your history</h2>
      <p className="streak-count">
        🔥 {streak} day{streak === 1 ? '' : 's'} streak
      </p>

      {loading && <p className="screen-subtitle">Loading...</p>}
      {error && <p className="error-detail">{error}</p>}

      {!loading && !error && history.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            ✦
          </span>
          <p className="empty-state-title">Your reset story starts here.</p>
          <p className="screen-subtitle">
            Complete your first reset and you'll start seeing patterns.
          </p>
        </div>
      )}

      {!loading && !error && history.length > 0 && (
        <div className="timeline">
          {grouped.map(([dayLabel, items]) => (
            <div key={dayLabel} className="timeline-day">
              <span className="timeline-day-label">{dayLabel}</span>
              <ul className="timeline-list">
                {items.map((item) => (
                  <li key={item.id} className="timeline-item">
                    <span className="timeline-dot" aria-hidden="true" />
                    <div className="timeline-content">
                      <span className="timeline-title">
                        {RESET_EMOJI[item.resetType] || '✦'} {item.resetType}
                      </span>
                      <span className="timeline-meta">
                        {MOOD_EMOJI[item.mood] || ''} {item.mood} · {item.minutes} min
                        {item.feedback && ` · ${FEEDBACK_EMOJI[item.feedback] || ''}`}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="primary-button" onClick={onBack}>
        Back
      </button>
    </div>
  )
}

export default HistoryPage
