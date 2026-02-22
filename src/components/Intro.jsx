import { forwardRef } from 'react'

/**
 * Intro — scroll-driven cinematic text overlay.
 * Parent controls scale / opacity / translateY via a GSAP proxy ref.
 * No self-playing animation — fully reversible with scrub: true.
 */
const Intro = forwardRef(function Intro(_, ref) {
  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      {/* Soft glow orb */}
      <div
        className="intro-glow"
        style={{
          position: 'absolute',
          width: 420,
          height: 420,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(90,180,207,0.12) 0%, rgba(56,189,248,0.04) 40%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Name */}
      <h1
        className="intro-name"
        style={{
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
          fontWeight: 200,
          letterSpacing: '0.35em',
          color: '#c8eaf5',
          textTransform: 'uppercase',
          textShadow:
            '0 0 40px rgba(90,180,207,0.5), 0 0 80px rgba(56,189,248,0.2)',
          marginBottom: 28,
          willChange: 'transform, opacity',
        }}
      >
        Soorya
      </h1>

      {/* Subtitle 1 */}
      <p
        className="intro-sub1"
        style={{
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          fontSize: 'clamp(0.85rem, 1.8vw, 1.15rem)',
          fontWeight: 300,
          letterSpacing: '0.12em',
          color: '#8ac4d8',
          textShadow: '0 0 20px rgba(90,180,207,0.3)',
          marginBottom: 10,
          willChange: 'transform, opacity',
        }}
      >
        Curious About How Systems Work Behind the Scenes
      </p>

      {/* Subtitle 2 */}
      <p
        className="intro-sub2"
        style={{
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          fontSize: 'clamp(0.8rem, 1.6vw, 1.05rem)',
          fontWeight: 300,
          letterSpacing: '0.1em',
          color: '#6aafca',
          textShadow: '0 0 16px rgba(56,189,248,0.25)',
          willChange: 'transform, opacity',
        }}
      >
        Exploring the Depth of Backend Systems
      </p>
    </div>
  )
})

export default Intro
