const LOOP_STEPS = ['Check in', 'Get a reset', 'Move', 'Feel', 'Learn']

function LandingPage({ onGetStarted, onImStuck }) {
  return (
    <div className="landing">
      <div className="landing-bg" aria-hidden="true">
        <div className="blob blob-coral" />
        <div className="blob blob-lavender" />
        <span className="spark spark-a">✦</span>
        <span className="spark spark-b">✦</span>
        <span className="spark spark-c">✦</span>
        <span className="spark spark-d">✦</span>
      </div>

      <div className="landing-content">
        <span className="landing-brand">
          <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden="true">
            <path
              d="M9 12a7.5 7.5 0 1 1 1.2 7.4"
              fill="none"
              stroke="#FFD166"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M9 7v5.4H14.2"
              fill="none"
              stroke="#FFD166"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          RESET
        </span>

        <h1 className="landing-headline">
          You don't need to fix everything.
          <br />
          You just need a <span className="text-gradient">reset</span>.
        </h1>

        <p className="landing-copy">
          A tiny AI-powered reset for when your brain needs a break.
        </p>

        <div className="hero-scene" aria-hidden="true">
          <div className="hero-card">
            <span className="hero-card-emoji">🌿</span>
            <span className="hero-card-title">RESET</span>
            <span className="hero-card-sub">10 minutes</span>
          </div>
          <span className="hero-sun">☀</span>
          <svg className="hero-walker" width="36" height="52" viewBox="0 0 40 56" fill="none">
            <circle cx="20" cy="8" r="6" fill="#FFF8F3" />
            <path d="M20 14 L20 32" stroke="#FFF8F3" strokeWidth="3" strokeLinecap="round" />
            <path d="M20 20 L10 26" stroke="#FFF8F3" strokeWidth="3" strokeLinecap="round" />
            <path d="M20 20 L30 16" stroke="#FFF8F3" strokeWidth="3" strokeLinecap="round" />
            <path d="M20 32 L12 48" stroke="#FFF8F3" strokeWidth="3" strokeLinecap="round" />
            <path d="M20 32 L28 44" stroke="#FFF8F3" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div className="hero-dots">
            <span />
            <span />
            <span />
          </div>
          <span className="hero-spark hs-1">✦</span>
          <span className="hero-spark hs-2">✦</span>
          <span className="hero-spark hs-3">✦</span>
        </div>

        <div className="landing-ctas">
          <button type="button" className="primary-button landing-cta" onClick={onGetStarted}>
            <span className="sparkle-icon" aria-hidden="true">
              ✦
            </span>{' '}
            Take a reset
          </button>
          <button type="button" className="secondary-button" onClick={onImStuck}>
            I'm stuck
          </button>
        </div>

        <div className="landing-loop">
          {LOOP_STEPS.map((step, i) => (
            <span key={step} className="landing-loop-step">
              {step}
              {i < LOOP_STEPS.length - 1 && (
                <span className="landing-loop-arrow" aria-hidden="true">
                  →
                </span>
              )}
            </span>
          ))}
        </div>

        <p className="landing-disclaimer">
          RESET is a lightweight tool for everyday moments — not medical or
          mental-health advice.
        </p>
      </div>
    </div>
  )
}

export default LandingPage
