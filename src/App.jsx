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

  /* ── Lock scroll until loader finishes + reset to top on reload ── */
  useEffect(() => {
    window.scrollTo(0, 0)
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
          scrub: 1.2,   // smooth interpolation — 1.2s catch-up for buttery feel
        },
      })

      /* ── Phase 0 (0–0.9): Intro pass-through + camera begins moving simultaneously ── */
      const introEl = introRef.current
      if (introEl) {
        const nameEl = introEl.querySelector('.intro-name')
        const sub1El = introEl.querySelector('.intro-sub1')
        const sub2El = introEl.querySelector('.intro-sub2')
        const glowEl = introEl.querySelector('.intro-glow')

        // Phase A (0–0.4): Gentle scale up — text approaches, camera starts drifting left
        tl.to(nameEl, { scale: 1.8, duration: 0.4, ease: 'power1.in' }, 0)
        tl.to(sub1El, { scale: 1.5, duration: 0.4, ease: 'power1.in' }, 0)
        tl.to(sub2El, { scale: 1.4, duration: 0.4, ease: 'power1.in' }, 0)
        tl.to(glowEl, { scale: 2, duration: 0.4, ease: 'power1.in' }, 0)

        // Camera starts moving during intro — continuous feel, no break
        tl.to(p, { x: -6, z: -3, rotY: -0.04, duration: 0.5, ease: 'power1.in' }, 0.2)

        // Phase B (0.4–0.7): Scale to max 2.8x + blur — passing through
        tl.to(nameEl, { scale: 2.8, filter: 'blur(6px)', duration: 0.3, ease: 'power2.in' }, 0.4)
        tl.to(sub1El, { scale: 2.2, filter: 'blur(8px)', duration: 0.3, ease: 'power2.in' }, 0.4)
        tl.to(sub2El, { scale: 2.0, filter: 'blur(10px)', duration: 0.3, ease: 'power2.in' }, 0.4)
        tl.to(glowEl, { scale: 3.5, duration: 0.3, ease: 'power2.in' }, 0.4)

        // Fade out — subtitles first, then name
        tl.to(sub2El, { opacity: 0, duration: 0.18, ease: 'power1.in' }, 0.42)
        tl.to(sub1El, { opacity: 0, duration: 0.18, ease: 'power1.in' }, 0.48)
        tl.to(nameEl, { opacity: 0, duration: 0.22, ease: 'power1.in' }, 0.52)
        tl.to(glowEl, { opacity: 0, duration: 0.18, ease: 'power1.in' }, 0.55)

        // Hide container once fully faded
        tl.set(introEl, { display: 'none' }, 0.78)
        tl.set(introEl, { display: 'flex' }, '<-0.78') // restore on reverse
      }

      /* ── Phase 1–6: Full cinematic zigzag — speed increases after intro ── */
      // First sweep starts faster (text just vanished — "scene enter" boost)
      tl.to(p, { x: -18, z: -10, rotY: -0.12, duration: 0.9, ease: 'power1.inOut' }, 0.75)
        .to(p, { x:  20, z: -22, rotY:  0.12, duration: 1, ease: 'power1.inOut' })
        .to(p, { x: -15, z: -34, rotY: -0.10, duration: 1, ease: 'power1.inOut' })
        .to(p, { x:  18, z: -46, rotY:  0.11, duration: 1, ease: 'power1.inOut' })
        .to(p, { x: -12, z: -54, rotY: -0.08, duration: 1, ease: 'power1.inOut' })
        .to(p, { x:   0, z: -62, rotY:  0,    duration: 1, ease: 'power2.inOut' })
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
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
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
