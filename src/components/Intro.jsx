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
      {/* Subtle underwater caustic halo */}
      <div
        className="intro-glow"
        style={{
          position: 'absolute',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(80,180,200,0.06) 0%, rgba(40,120,140,0.03) 40%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      {/* Name */}
      <h1
        className="intro-name"
        style={{
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
          fontWeight: 500,
          letterSpacing: '12px',
          color: '#AEE9F5',
          textTransform: 'uppercase',
          textShadow:
            '0 0 6px rgba(120,220,255,0.25), 0 0 12px rgba(120,220,255,0.15), 0 2px 8px rgba(0,0,0,0.4)',
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
          letterSpacing: '0.14em',
          color: 'rgba(210,240,255,0.75)',
          textShadow: '0 1px 6px rgba(0,0,0,0.35)',
          marginBottom: 10,
          background: 'rgba(20,40,50,0.35)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          padding: '10px 24px',
          borderRadius: 8,
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
          color: 'rgba(210,240,255,0.75)',
          textShadow: '0 1px 6px rgba(0,0,0,0.35)',
          background: 'rgba(20,40,50,0.35)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          padding: '10px 24px',
          borderRadius: 8,
          willChange: 'transform, opacity',
        }}
      >
        Exploring the Depth of Backend Systems
      </p>
    </div>
  )
})

export default Intro
