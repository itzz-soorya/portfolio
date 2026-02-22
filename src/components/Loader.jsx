import { useState, useEffect, useCallback } from 'react'

export default function Loader({ onFinished }) {
  const [dots, setDots] = useState('')
  const [fadeOut, setFadeOut] = useState(false)
  const [hidden, setHidden] = useState(false)

  /* ── animated dots ── */
  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'))
    }, 400)
    return () => clearInterval(id)
  }, [])

  /* ── called once scene is ready ── */
  const dismiss = useCallback(() => {
    setFadeOut(true)
    setTimeout(() => {
      setHidden(true)
      document.body.style.overflow = ''   // re-enable scroll
      onFinished?.()
    }, 1200) // matches CSS transition duration
  }, [onFinished])

  /* expose dismiss so parent can call it */
  useEffect(() => {
    // store on window so Canvas onCreated can trigger it after first render
    window.__loaderDismiss = dismiss
    return () => { delete window.__loaderDismiss }
  }, [dismiss])

  if (hidden) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #0a3044 0%, #041825 60%, #010d14 100%)',
        transition: 'opacity 1.2s ease',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      {/* subtle pulsing glow behind text */}
      <div
        style={{
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)',
          animation: 'loaderPulse 3s ease-in-out infinite',
        }}
      />

      <h1
        style={{
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          fontSize: '1.6rem',
          fontWeight: 300,
          letterSpacing: '0.25em',
          color: '#94d5e8',
          textTransform: 'uppercase',
          marginBottom: 24,
          position: 'relative',
        }}
      >
        Loading Portfolio
      </h1>

      {/* animated dots */}
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '1.4rem',
          color: '#5ab4cf',
          letterSpacing: '0.3em',
          minWidth: 60,
          textAlign: 'left',
        }}
      >
        {dots || '\u00A0'}
      </span>

      {/* thin animated progress bar */}
      <div
        style={{
          marginTop: 32,
          width: 180,
          height: 2,
          background: 'rgba(148,213,232,0.15)',
          borderRadius: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            height: '100%',
            width: 60,
            background: 'linear-gradient(90deg, transparent, #5ab4cf, transparent)',
            animation: 'loaderBar 1.6s ease-in-out infinite',
          }}
        />
      </div>

      {/* keyframes injected inline */}
      <style>{`
        @keyframes loaderPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50%      { transform: scale(1.15); opacity: 1; }
        }
        @keyframes loaderBar {
          0%   { left: -60px; }
          100% { left: 180px; }
        }
      `}</style>
    </div>
  )
}
