import { useEffect, useState } from 'react'
import { API_BASE_URL } from './config'

const MOOD_LABELS = {
  overwhelmed: '🌊 Overwhelmed',
  exhausted: '🔋 Exhausted',
  bored: '🌀 Bored',
  stuck: '🧩 Stuck',
}

function InsightsPage({ userId, onBack }) {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/missions/insights/${userId}`)
        if (!res.ok) throw new Error('Could not load insights')
        const data = await res.json()
        if (!cancelled) setInsights(data)
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

  const remainingForPattern = insights ? Math.max(0, 3 - insights.totalResets) : 0

  return (
    <div className="screen insights-screen">
      <h2>Your reset pattern</h2>

      {loading && <p className="screen-subtitle">Loading...</p>}
      {error && <p className="error-detail">{error}</p>}

      {!loading && !error && insights && insights.totalResets === 0 && (
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

      {!loading && !error && insights && insights.totalResets > 0 && (
        <>
          <div className="insight-stat-row">
            <div className="insight-stat stat-coral">
              <span className="insight-stat-icon" aria-hidden="true">
                ✦
              </span>
              <span className="insight-stat-value">{insights.totalResets}</span>
              <span className="insight-stat-label">Resets</span>
            </div>
            <div className="insight-stat stat-yellow">
              <span className="insight-stat-icon" aria-hidden="true">
                🔥
              </span>
              <span className="insight-stat-value">{insights.currentStreak}</span>
              <span className="insight-stat-label">Day streak</span>
            </div>
          </div>

          {insights.mostCommonMood && (
            <p className="insight-line">
              Most common state:{' '}
              <strong>{MOOD_LABELS[insights.mostCommonMood] || insights.mostCommonMood}</strong>
            </p>
          )}

          {!insights.hasEnoughData && (
            <p className="screen-subtitle">
              Complete {remainingForPattern} more reset{remainingForPattern === 1 ? '' : 's'} to
              unlock personal patterns.
            </p>
          )}

          {insights.hasEnoughData && (
            <>
              {insights.bestResetType && (
                <p className="insight-line">
                  Most effective: <strong>{insights.bestResetType.resetType}</strong> (avg
                  stress change {insights.bestResetType.avgStressChange > 0 ? '+' : ''}
                  {insights.bestResetType.avgStressChange})
                </p>
              )}
              {insights.bestDuration && (
                <p className="insight-line">
                  Best duration: <strong>{insights.bestDuration.minutes} min</strong>
                </p>
              )}
              {insights.patternInsight && (
                <div className="ai-insight-card">
                  <span className="ai-insight-header">
                    <span aria-hidden="true">✦</span> A little observation
                  </span>
                  <p>{insights.patternInsight}</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      <button type="button" className="primary-button" onClick={onBack}>
        Back
      </button>
    </div>
  )
}

export default InsightsPage
