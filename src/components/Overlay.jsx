/**
 * Overlay — fixed HTML text on top of the pinned 3D scene.
 * Since the scene is pinned (pin:true), this overlay sits on top
 * and stays visible. Text fades in/out based on scroll can be added later.
 */
export default function Overlay() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <h1
        style={{
          fontSize: 'clamp(2rem, 5vw, 4.5rem)',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.8)',
          letterSpacing: '-0.02em',
          textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          textAlign: 'center',
        }}
      >
        Underwater Portfolio
      </h1>
    </div>
  )
}
