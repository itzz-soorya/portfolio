import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 120
const SPREAD_X = 80
const SPREAD_Y = 16
const SPREAD_Z = 90
const BASE_Y = -2

export default function Particles() {
  const pointsRef = useRef()

  /* ── seed data ── */
  const { positions, seeds } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const s = []

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      pos[i3]     = (Math.random() - 0.5) * SPREAD_X            // x
      pos[i3 + 1] = BASE_Y + Math.random() * SPREAD_Y           // y
      pos[i3 + 2] = -Math.random() * SPREAD_Z                   // z (forward)

      s.push({
        driftX: (Math.random() - 0.5) * 0.003,
        driftY: (Math.random() - 0.5) * 0.002,
        driftZ: (Math.random() - 0.5) * 0.002,
        freqX: 0.1 + Math.random() * 0.3,
        freqY: 0.08 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2,
      })
    }

    return { positions: pos, seeds: s }
  }, [])

  /* ── animate ── */
  useFrame((state) => {
    if (!pointsRef.current) return
    const t = state.clock.elapsedTime
    const geo = pointsRef.current.geometry
    const arr = geo.attributes.position.array

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      const sd = seeds[i]

      // gentle wandering via sin + constant drift
      arr[i3]     += Math.sin(t * sd.freqX + sd.phase) * sd.driftX
      arr[i3 + 1] += Math.sin(t * sd.freqY + sd.phase) * sd.driftY
      arr[i3 + 2] += sd.driftZ

      // wrap bounds so particles stay in view
      if (arr[i3]     >  SPREAD_X / 2) arr[i3]     = -SPREAD_X / 2
      if (arr[i3]     < -SPREAD_X / 2) arr[i3]     =  SPREAD_X / 2
      if (arr[i3 + 1] >  BASE_Y + SPREAD_Y) arr[i3 + 1] = BASE_Y
      if (arr[i3 + 1] <  BASE_Y)             arr[i3 + 1] = BASE_Y + SPREAD_Y
      if (arr[i3 + 2] >  0)          arr[i3 + 2] = -SPREAD_Z
      if (arr[i3 + 2] < -SPREAD_Z)   arr[i3 + 2] = 0
    }

    geo.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={COUNT}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#8ec8d8"
        transparent
        opacity={0.35}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
