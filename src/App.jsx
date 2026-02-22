import { useRef, useEffect, useState } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Loader from './components/Loader'
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
  const [sceneReady, setSceneReady] = useState(false)

  /* ── Lock scroll while loader is visible ── */
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

      // ── Cinematic zigzag: wide lateral sweeps + forward travel ──
      tl.to(p, { x: -18, z: -8,  rotY: -0.12, duration: 1, ease: 'power1.inOut' })
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
      {/* ── Cinematic loader ── */}
      <Loader onFinished={() => setSceneReady(true)} />

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

        {/* Overlay text on top of canvas */}
        <Overlay />
      </div>

      {/* Scroll spacer — provides scroll height for ScrollTrigger */}
      <div id="scroll-container" style={{ height: '400vh', pointerEvents: 'none' }} />
    </>
  )
}
