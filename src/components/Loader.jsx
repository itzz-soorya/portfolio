import { useState, useEffect, useCallback, useRef } from 'react'

export default function Loader({ onFinished }) {
  const [dots, setDots] = useState('')
  const [fadeOut, setFadeOut] = useState(false)
  const [hidden, setHidden] = useState(false)
  const readyFlags = useRef({ document: false, scene: false, content: false })
  const dismissed = useRef(false)

  /* ── animated dots ── */
  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'))
    }, 400)
    return () => clearInterval(id)
  }, [])

  /* ── try to dismiss when all flags are true ── */
  const tryDismiss = useCallback(() => {
    const f = readyFlags.current
    if (dismissed.current) return
    if (!f.document || !f.scene || !f.content) return
    dismissed.current = true

    // Small extra delay to ensure paint is settled
    setTimeout(() => {
      setFadeOut(true)
      setTimeout(() => {
        setHidden(true)
        document.body.style.overflow = ''
        onFinished?.()
      }, 1200)
    }, 300)
  }, [onFinished])

  /* ── Signal: document fully loaded (fonts, styles, images) ── */
  useEffect(() => {
    const markDocReady = () => {
      readyFlags.current.document = true
      tryDismiss()
    }
    if (document.readyState === 'complete') {
      markDocReady()
    } else {
      window.addEventListener('load', markDocReady)
      return () => window.removeEventListener('load', markDocReady)
    }
  }, [tryDismiss])

  /* ── Expose signal functions so other components can report ready ── */
  useEffect(() => {
    window.__loaderSignalScene = () => {
      readyFlags.current.scene = true
      tryDismiss()
    }
    window.__loaderSignalContent = () => {
      readyFlags.current.content = true
      tryDismiss()
    }
    // Fallback: if everything takes too long, dismiss after 8s
    const fallbackId = setTimeout(() => {
      readyFlags.current.document = true
      readyFlags.current.scene = true
      readyFlags.current.content = true
      tryDismiss()
    }, 8000)
    return () => {
      clearTimeout(fallbackId)
      delete window.__loaderSignalScene
      delete window.__loaderSignalContent
    }
  }, [tryDismiss])

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
