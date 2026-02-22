/**
 * Overlay — shows a scroll hint after the intro completes.
 * Fades in smoothly when mounted.
 */
export default function Overlay() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 40,
        left: 0,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 10,
        animation: 'overlayFadeIn 1.5s ease forwards',
      }}
    >
      <p
        style={{
          fontSize: '0.85rem',
          fontWeight: 300,
          letterSpacing: '4px',
          color: 'rgba(160,220,240,0.6)',
          textTransform: 'uppercase',
          textShadow: '0 1px 4px rgba(0,0,0,0.3)',
          animation: 'overlayBounce 2.5s ease-in-out infinite',
        }}
      >
        Scroll to explore ↓
      </p>

      <style>{`
        @keyframes overlayFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes overlayBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(6px); }
        }
      `}</style>
    </div>
  )
}
