import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

import { SECTIONS } from '../config/SectionPositions'

/**
 * Sections that get ground-bubble activation.
 * Github excluded — handled separately later.
 */
const ACTIVE_IDS = ['introduction', 'stacks', 'projects', 'social', 'contact']

/* ────────────────────────────────────────────────────────────
   GroundBubbleEffect — 2 small natural air bubbles + sand dust
   Only small realistic bubbles. No big sphere.
   ──────────────────────────────────────────────────────────── */

const BUBBLE_COUNT = 2
const DUST_COUNT = 5

function GroundBubbleEffect({ sectionPos, active }) {
  const bubblesRef = useRef([])
  const dustRef = useRef([])
  const progressRef = useRef(0)

  const bubbleData = useMemo(() => {
    const arr = []
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 2.0,
        z: (Math.random() - 0.5) * 2.0,
        speed: 0.25 + Math.random() * 0.3,
        wobblePhase: Math.random() * Math.PI * 2,
        size: 0.15 + Math.random() * 0.1,
        delay: i * 0.2,
      })
    }
    return arr
  }, [])

  const dustData = useMemo(() => {
    const arr = []
    for (let i = 0; i < DUST_COUNT; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 2.5,
        z: (Math.random() - 0.5) * 2.5,
        speed: 0.08 + Math.random() * 0.12,
        size: 0.04 + Math.random() * 0.03,
      })
    }
    return arr
  }, [])

  useFrame((_, delta) => {
    const target = active ? 1 : 0
    progressRef.current += (target - progressRef.current) * delta * 3

    const p = progressRef.current
    if (p < 0.005 && !active) {
      bubblesRef.current.forEach(m => { if (m) m.visible = false })
      dustRef.current.forEach(m => { if (m) m.visible = false })
      return
    }

    const time = performance.now() * 0.001

    // 2 small bubbles — rise naturally, wobble, fade at top
    bubblesRef.current.forEach((mesh, i) => {
      if (!mesh) return
      const d = bubbleData[i]
      const localP = Math.max(0, Math.min(1, (p - d.delay * 0.3) / 0.7))
      mesh.visible = localP > 0.01

      if (mesh.visible) {
        // Continuous looping rise
        const cycle = (time * d.speed + d.delay) % 4
        const y = cycle * 1.2
        mesh.position.set(
          d.x + Math.sin(time * 1.8 + d.wobblePhase) * 0.08,
          y,
          d.z + Math.cos(time * 1.4 + d.wobblePhase) * 0.06
        )
        // Fade near top
        const fadeUp = y > 3 ? Math.max(0, 1 - (y - 3) / 1.5) : 1
        mesh.material.opacity = localP * fadeUp * 0.7
        mesh.scale.setScalar(d.size * (0.8 + Math.sin(time * 2 + i) * 0.15))
      }
    })

    // Sand dust — slight disturbance near ground
    dustRef.current.forEach((mesh, i) => {
      if (!mesh) return
      const d = dustData[i]
      mesh.visible = p > 0.15
      if (mesh.visible) {
        const y = p * d.speed * 1.5 + Math.sin(time * 0.8 + i) * 0.03
        mesh.position.set(d.x, y, d.z)
        mesh.material.opacity = Math.min(p * 0.8, 0.35) * Math.max(0, 1 - y / 1.2)
        mesh.scale.setScalar(d.size)
      }
    })
  })

  const basePos = [sectionPos.x, -2, sectionPos.z - 12]

  return (
    <group position={basePos}>
      {/* Small natural bubbles */}
      {bubbleData.map((_, i) => (
        <mesh key={`b-${i}`} ref={el => bubblesRef.current[i] = el} visible={false}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial
            color="#b8e4f0"
            transparent
            opacity={0}
            depthWrite={false}
            roughness={0.05}
            metalness={0.15}
          />
        </mesh>
      ))}

      {/* Sand dust */}
      {dustData.map((_, i) => (
        <mesh key={`d-${i}`} ref={el => dustRef.current[i] = el} visible={false}>
          <sphereGeometry args={[1, 4, 3]} />
          <meshStandardMaterial
            color="#8a7555"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}


/* ────────────────────────────────────────────────────────────
   SectionActivationController — only ground bubbles per section.
   No big bubble sphere.
   ──────────────────────────────────────────────────────────── */

export default function SectionActivationController({ activeSection, enabled }) {
  return (
    <>
      {SECTIONS.map((section, index) => {
        if (!ACTIVE_IDS.includes(section.id)) return null
        const isActive = enabled && activeSection === index
        return (
          <GroundBubbleEffect
            key={section.id}
            sectionPos={section.position}
            active={isActive}
          />
        )
      })}
    </>
  )
}
