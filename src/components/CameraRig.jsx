import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { gsap } from 'gsap'
import { SECTIONS } from '../config/SectionPositions'

/**
 * CameraRig — handles smooth GSAP camera navigation between sections.
 * Keeps the drone-sweep feel during transitions + underwater breathing bob.
 */
export default function CameraRig({ activeSection }) {
  const { camera } = useThree()

  // Base position animated by GSAP — useFrame reads this + adds breathing
  const base = useRef({
    x: SECTIONS[0].position.x,
    y: SECTIONS[0].position.y,
    z: SECTIONS[0].position.z,
    rotY: 0,
  })

  const tweenRef = useRef(null)

  useEffect(() => {
    const target = SECTIONS[activeSection].position
    const b = base.current
    const dx = target.x - b.x

    // Kill any in-flight animation
    if (tweenRef.current) tweenRef.current.kill()

    // Drone-sweep yaw direction
    const sweepRotY = dx > 2 ? 0.09 : dx < -2 ? -0.09 : 0

    const tl = gsap.timeline()
    tweenRef.current = tl

    // Main diagonal sweep
    tl.to(b, {
      x: target.x,
      y: target.y,
      z: target.z,
      rotY: sweepRotY,
      duration: 1.4,
      ease: 'power2.inOut',
    })
    // Settle yaw back
    .to(b, {
      rotY: 0,
      duration: 0.35,
      ease: 'power1.out',
    })
  }, [activeSection])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const b = base.current

    // Position with underwater breathing bob
    camera.position.set(
      b.x + Math.sin(t * 0.2) * 0.1,
      b.y + Math.sin(t * 0.35) * 0.05,
      b.z
    )

    // Look ahead — slight downward at the ocean floor
    const lookX = b.x + b.rotY * 25 + Math.sin(t * 0.15) * 0.08
    camera.lookAt(lookX, b.y - 3.5, b.z - 25)

    // Yaw tilt on turns — cinematic drone feel
    camera.rotateY(b.rotY * 0.4)
  })

  return null
}
