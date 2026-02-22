import { useRef, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Loader from './components/Loader'
import Intro from './components/Intro'
import Overlay from './components/Overlay'
import OceanFloor from './components/OceanFloor'
import UnderwaterLighting from './components/UnderwaterLighting'
import Corals from './components/Corals'
import Bubbles from './components/Bubbles'
import Particles from './components/Particles'

gsap.registerPlugin(ScrollTrigger)

/* ─── Camera controller inside the Canvas ─── */
function CameraController({ proxy }) {
  const { camera } = useThree()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const p = proxy.current

    camera.position.set(
      p.x + Math.sin(t * 0.2) * 0.1,
      p.y + Math.sin(t * 0.35) * 0.05,
      p.z
    )

    // Look ahead in the direction of travel, slight downward angle
    const lookX = p.x + p.rotY * 25 + Math.sin(t * 0.15) * 0.08
    camera.lookAt(lookX, p.y - 4, p.z - 25)

    // Strong yaw tilt into turns — drone sweep feel
    camera.rotateY(p.rotY * 0.4)
  })

  return null
}

export default function App() {
  const proxy = useRef({ x: 0, y: 3.5, z: 0, rotY: 0 })
  const introRef = useRef()

  /* ── Lock scroll until loader finishes ── */
  useEffect(() => {
    document.body.style.overflow = 'hidden'
  }, [])

  useEffect(() => {
    const p = proxy.current

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#scroll-container',
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      })

      /* ── Phase 0 (0–1.0): Intro text scales UP + passes through camera ── */
      const introEl = introRef.current
      if (introEl) {
        const nameEl = introEl.querySelector('.intro-name')
        const sub1El = introEl.querySelector('.intro-sub1')
        const sub2El = introEl.querySelector('.intro-sub2')
        const glowEl = introEl.querySelector('.intro-glow')

        // Text scales up — small → medium → BIG → full screen → past camera
        tl.to(nameEl, { scale: 3.5, duration: 0.7, ease: 'power1.in' }, 0)
        tl.to(sub1El, { scale: 2.8, duration: 0.7, ease: 'power1.in' }, 0)
        tl.to(sub2El, { scale: 2.5, duration: 0.7, ease: 'power1.in' }, 0)
        tl.to(glowEl, { scale: 4, duration: 0.7, ease: 'power1.in' }, 0)

        // Continue scaling past camera — door pass-through
        tl.to(nameEl, { scale: 12, letterSpacing: '1.5em', duration: 0.3, ease: 'power2.in' }, 0.7)
        tl.to(sub1El, { scale: 8, duration: 0.3, ease: 'power2.in' }, 0.7)
        tl.to(sub2El, { scale: 7, duration: 0.3, ease: 'power2.in' }, 0.7)
        tl.to(glowEl, { scale: 12, duration: 0.3, ease: 'power2.in' }, 0.7)

        // Fade out as text crosses past the camera
        tl.to(nameEl, { opacity: 0, duration: 0.25, ease: 'power1.in' }, 0.75)
        tl.to(sub1El, { opacity: 0, duration: 0.2, ease: 'power1.in' }, 0.7)
        tl.to(sub2El, { opacity: 0, duration: 0.2, ease: 'power1.in' }, 0.65)
        tl.to(glowEl, { opacity: 0, duration: 0.2, ease: 'power1.in' }, 0.75)

        // Hide container after pass-through
        tl.set(introEl, { display: 'none' }, 1.0)
        tl.set(introEl, { display: 'flex' }, '<-1.0') // restore on reverse
      }

      /* ── Phase 1–6: Cinematic zigzag camera movement ── */
      tl.to(p, { x: -18, z: -8,  rotY: -0.12, duration: 1, ease: 'power1.inOut' }, 1.0)
        .to(p, { x:  20, z: -20, rotY:  0.12, duration: 1, ease: 'power1.inOut' })
        .to(p, { x: -15, z: -32, rotY: -0.10, duration: 1, ease: 'power1.inOut' })
        .to(p, { x:  18, z: -44, rotY:  0.11, duration: 1, ease: 'power1.inOut' })
        .to(p, { x: -12, z: -52, rotY: -0.08, duration: 1, ease: 'power1.inOut' })
        .to(p, { x:   0, z: -60, rotY:  0,    duration: 1, ease: 'power2.inOut' })
    })

    return () => ctx.revert()
  }, [])

  return (
    <>
      {/* ── Cinematic loader — unlocks scroll when done ── */}
      <Loader onFinished={() => {}} />

      {/* ── Intro text — driven by scroll timeline ── */}
      <Intro ref={introRef} />

      {/* Fixed full-screen canvas — always covers entire viewport */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Canvas
          camera={{ position: [0, 3.5, 0], fov: 60, near: 0.1, far: 200 }}
          shadows
          gl={{
            antialias: true,
            alpha: false,
            toneMapping: THREE.ACESFilmicToneMapping,
          }}
          onCreated={({ gl }) => {
            gl.toneMappingExposure = 1.1
            // Give the GPU a couple of frames to render, then dismiss loader
            setTimeout(() => window.__loaderDismiss?.(), 1800)
          }}
        >
          <color attach="background" args={['#062a3e']} />
          <UnderwaterLighting />
          <OceanFloor />
          <Corals />
          <Bubbles />
          <Particles />
          <CameraController proxy={proxy} />
        </Canvas>

        {/* Scroll hint */}
        <Overlay />
      </div>

      {/* Scroll spacer — provides scroll height for ScrollTrigger */}
      <div id="scroll-container" style={{ height: '400vh', pointerEvents: 'none' }} />
    </>
  )
}
