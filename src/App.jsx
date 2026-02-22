import { useRef, useState, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { gsap } from 'gsap'
import Loader from './components/Loader'
import Intro from './components/Intro'
import HeaderNav from './components/HeaderNav'
import OceanFloor from './components/OceanFloor'
import UnderwaterLighting from './components/UnderwaterLighting'
import Corals from './components/Corals'
import MarineAssets from './components/MarineAssets'
import Bubbles from './components/Bubbles'
import Particles from './components/Particles'
import SunRays from './components/SunRays'
import CameraRig from './components/CameraRig'
import SectionActivationController from './components/SectionActivationController'
import GlassContentBox from './components/GlassContentBox'
import GlassContactForm from './components/GlassContactForm'
import { SECTIONS } from './config/SectionPositions'

/* ── Detect portrait mobile and provide wrapper style ── */
function usePortraitMobile() {
  const [isPortrait, setIsPortrait] = useState(() => {
    return window.innerWidth < 768 && window.innerHeight > window.innerWidth
  })

  useEffect(() => {
    const check = () => {
      const isSmall = window.innerWidth < 768
      const isPort = window.innerHeight > window.innerWidth
      setIsPortrait(isSmall && isPort)
    }
    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', () => setTimeout(check, 200))
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  return isPortrait
}

export default function App() {
  const [activeSection, setActiveSection] = useState(0)
  const [headerVisible, setHeaderVisible] = useState(false)
  const introRef = useRef()
  const scrollReady = useRef(false)        // block scroll until intro done
  const isAnimating = useRef(false)        // debounce rapid scrolls
  const touchStartY = useRef(0)            // for mobile swipe
  const isPortraitMobile = usePortraitMobile()

  /* ── After loader fades: auto-animate intro, then reveal header ── */
  const handleLoaderDone = useCallback(() => {
    document.body.style.overflow = 'hidden'

    const introEl = introRef.current
    if (!introEl) { setHeaderVisible(true); scrollReady.current = true; return }

    const nameEl = introEl.querySelector('.intro-name')
    const sub1El = introEl.querySelector('.intro-sub1')
    const sub2El = introEl.querySelector('.intro-sub2')
    const glowEl = introEl.querySelector('.intro-glow')

    const tl = gsap.timeline({
      onComplete: () => {
        introEl.style.display = 'none'
        setHeaderVisible(true)
        scrollReady.current = true
      },
    })

    // Hold for a beat — user reads the intro
    tl.to({}, { duration: 1.8 })
    // Scale up + blur + fade out — cinematic pass-through
    tl.to(nameEl,  { scale: 2.4, filter: 'blur(6px)', opacity: 0, duration: 1.2, ease: 'power2.in' }, '+=0')
      .to(sub1El, { scale: 1.8, filter: 'blur(8px)', opacity: 0, duration: 1.0, ease: 'power2.in' }, '<0.1')
      .to(sub2El, { scale: 1.6, filter: 'blur(10px)', opacity: 0, duration: 1.0, ease: 'power2.in' }, '<0.1')
      .to(glowEl, { scale: 3, opacity: 0, duration: 0.8, ease: 'power2.in' }, '<')
  }, [])

  /* ── Navigate to section (shared by header clicks + scroll) ── */
  const handleNavigate = useCallback((index) => {
    if (index < 0 || index >= SECTIONS.length) return
    if (index === activeSection) return
    isAnimating.current = true
    setActiveSection(index)
    // Unlock after camera animation finishes (~1.8s)
    setTimeout(() => { isAnimating.current = false }, 1600)
  }, [activeSection])

  /* ── Wheel scroll → next / prev section ── */
  useEffect(() => {
    let accumulated = 0
    const THRESHOLD = 60  // px of scroll delta to trigger

    const onWheel = (e) => {
      e.preventDefault()
      if (!scrollReady.current || isAnimating.current) return

      accumulated += e.deltaY

      if (Math.abs(accumulated) >= THRESHOLD) {
        const dir = accumulated > 0 ? 1 : -1
        accumulated = 0
        setActiveSection((prev) => {
          const next = Math.max(0, Math.min(SECTIONS.length - 1, prev + dir))
          if (next !== prev) {
            isAnimating.current = true
            setTimeout(() => { isAnimating.current = false }, 1600)
          }
          return next
        })
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  /* ── Touch swipe → next / prev section (mobile) ── */
  useEffect(() => {
    const onTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY
    }
    const onTouchEnd = (e) => {
      if (!scrollReady.current || isAnimating.current) return
      const delta = touchStartY.current - e.changedTouches[0].clientY
      if (Math.abs(delta) < 50) return // too small

      const dir = delta > 0 ? 1 : -1
      setActiveSection((prev) => {
        const next = Math.max(0, Math.min(SECTIONS.length - 1, prev + dir))
        if (next !== prev) {
          isAnimating.current = true
          setTimeout(() => { isAnimating.current = false }, 1600)
        }
        return next
      })
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  // Wrapper style: rotates the entire app into landscape on portrait mobile
  const wrapperStyle = isPortraitMobile
    ? {
        position: 'fixed',
        width: window.innerHeight,
        height: window.innerWidth,
        transform: 'rotate(-90deg) translateX(-100%)',
        transformOrigin: 'top left',
        overflow: 'hidden',
        top: 0,
        left: 0,
      }
    : { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'hidden' }

  return (
    <div style={wrapperStyle}>
      {/* ── Cinematic loader ── */}
      <Loader onFinished={handleLoaderDone} />

      {/* ── Intro text — auto-animated after loader ── */}
      <Intro ref={introRef} />

      {/* ── Header navigation — slides in after intro ── */}
      <HeaderNav
        activeSection={activeSection}
        onNavigate={handleNavigate}
        visible={headerVisible}
      />

      {/* ── Glass content box — HTML overlay for active section ── */}
      <GlassContentBox activeSection={activeSection} enabled={headerVisible} />

      {/* ── Glass contact form — HTML overlay for Contact section ── */}
      <GlassContactForm activeSection={activeSection} enabled={headerVisible} />

      {/* Fixed full-screen canvas */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [-6, 2, 0], fov: 60, near: 0.1, far: 200 }}
          shadows
          style={{ width: '100%', height: '100%' }}
          gl={{
            antialias: true,
            alpha: false,
            toneMapping: THREE.ACESFilmicToneMapping,
          }}
          onCreated={({ gl }) => {
            gl.toneMappingExposure = 0.9
            setTimeout(() => window.__loaderDismiss?.(), 1800)
          }}
        >
          <color attach="background" args={['#062a3e']} />
          <UnderwaterLighting />
          <OceanFloor />
          <Corals />
          <MarineAssets />
          <Bubbles />
          <Particles />
          <SunRays />
          <SectionActivationController activeSection={activeSection} enabled={headerVisible} />
          <CameraRig activeSection={activeSection} />
        </Canvas>
      </div>
    </div>
  )
}
