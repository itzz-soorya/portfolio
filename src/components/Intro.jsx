import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'

/**
 * Cinematic intro — plays after loader, before scroll is enabled.
 * Text zooms from deep/small to normal, glows, pauses, then fades out.
 */
export default function Intro({ onComplete }) {
  const containerRef = useRef()
  const nameRef = useRef()
  const sub1Ref = useRef()
  const sub2Ref = useRef()
  const glowRef = useRef()
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          // fade entire container out, then unmount & enable scroll
          gsap.to(containerRef.current, {
            opacity: 0,
            duration: 1.2,
            ease: 'power2.inOut',
            onComplete: () => {
              setHidden(true)
              document.body.style.overflow = ''
              onComplete?.()
            },
          })
        },
      })

      // ── Name: starts tiny & blurred, zooms forward ──
      tl.fromTo(
        nameRef.current,
        { scale: 0.3, opacity: 0, filter: 'blur(12px)' },
        { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 2.4, ease: 'power2.out' },
        0
      )

      // ── Glow pulse behind name ──
      tl.fromTo(
        glowRef.current,
        { scale: 0.5, opacity: 0 },
        { scale: 1.2, opacity: 1, duration: 2.0, ease: 'power2.out' },
        0.3
      )

      // ── Subtitle 1: fade up slightly after name ──
      tl.fromTo(
        sub1Ref.current,
        { y: 30, opacity: 0, filter: 'blur(6px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.6, ease: 'power2.out' },
        1.4
      )

      // ── Subtitle 2: fade up after sub1 ──
      tl.fromTo(
        sub2Ref.current,
        { y: 20, opacity: 0, filter: 'blur(4px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.4, ease: 'power2.out' },
        2.2
      )

      // ── Hold / pause for 1.5s so user can read ──
      tl.to({}, { duration: 1.5 })
    })

    return () => ctx.revert()
  }, [onComplete])

  if (hidden) return null

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        /* no background — scene is visible behind */
      }}
    >
      {/* Soft glow orb */}
      <div
        ref={glowRef}
        style={{
          position: 'absolute',
          width: 420,
          height: 420,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(90,180,207,0.12) 0%, rgba(56,189,248,0.04) 40%, transparent 70%)',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Name */}
      <h1
        ref={nameRef}
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
          opacity: 0,
          willChange: 'transform, opacity, filter',
        }}
      >
        Soorya
      </h1>

      {/* Subtitle 1 */}
      <p
        ref={sub1Ref}
        style={{
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          fontSize: 'clamp(0.85rem, 1.8vw, 1.15rem)',
          fontWeight: 300,
          letterSpacing: '0.12em',
          color: '#8ac4d8',
          textShadow: '0 0 20px rgba(90,180,207,0.3)',
          marginBottom: 10,
          opacity: 0,
          willChange: 'transform, opacity, filter',
        }}
      >
        Curious About How Systems Work Behind the Scenes
      </p>

      {/* Subtitle 2 */}
      <p
        ref={sub2Ref}
        style={{
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          fontSize: 'clamp(0.8rem, 1.6vw, 1.05rem)',
          fontWeight: 300,
          letterSpacing: '0.1em',
          color: '#6aafca',
          textShadow: '0 0 16px rgba(56,189,248,0.25)',
          opacity: 0,
          willChange: 'transform, opacity, filter',
        }}
      >
        Exploring the Depth of Backend Systems
      </p>
    </div>
  )
}
