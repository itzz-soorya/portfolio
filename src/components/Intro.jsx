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
      {/* Soft glow orb — underwater light caustic */}
      <div
        className="intro-glow"
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(92,214,255,0.14) 0%, rgba(92,214,255,0.05) 30%, rgba(56,189,248,0.02) 55%, transparent 75%)',
          pointerEvents: 'none',
          filter: 'blur(2px)',
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
          color: '#9FE7FF',
          textTransform: 'uppercase',
          textShadow: [
            '0 0 10px rgba(92,214,255,0.8)',
            '0 0 30px rgba(92,214,255,0.5)',
            '0 0 60px rgba(92,214,255,0.25)',
            '0 0 100px rgba(56,189,248,0.12)',
          ].join(', '),
          marginBottom: 28,
          willChange: 'transform, opacity',
          animation: 'introLightReveal 2.5s ease-out forwards',
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
          color: '#C8F6FF',
          opacity: 0.85,
          textShadow: '0 0 8px rgba(92,214,255,0.45), 0 0 20px rgba(92,214,255,0.15)',
          marginBottom: 10,
          background: 'linear-gradient(to bottom, rgba(4,44,58,0) 0%, rgba(4,44,58,0.3) 50%, rgba(4,44,58,0) 100%)',
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
          color: '#C8F6FF',
          opacity: 0.85,
          textShadow: '0 0 8px rgba(92,214,255,0.45), 0 0 20px rgba(92,214,255,0.15)',
          background: 'linear-gradient(to bottom, rgba(4,44,58,0) 0%, rgba(4,44,58,0.3) 50%, rgba(4,44,58,0) 100%)',
          padding: '10px 24px',
          borderRadius: 8,
          willChange: 'transform, opacity',
        }}
      >
        Exploring the Depth of Backend Systems
      </p>

      {/* Light-ray reveal keyframes */}
      <style>{`
        @keyframes introLightReveal {
          0%   { opacity: 0.15; filter: brightness(0.3) blur(2px); }
          30%  { opacity: 0.5;  filter: brightness(0.7) blur(1px); }
          60%  { opacity: 0.85; filter: brightness(1.2) blur(0px); }
          80%  { opacity: 1;    filter: brightness(1.4) blur(0px); }
          100% { opacity: 1;    filter: brightness(1)   blur(0px); }
        }
      `}</style>
    </div>
  )
})

export default Intro
