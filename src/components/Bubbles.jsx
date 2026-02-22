import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const BUBBLE_COUNT = 30
const SAND_Y = -1.5        // spawn near sand level
const MAX_Y = 12           // reset height
const RISE_SPEED = 0.015   // slow upward drift

export default function Bubbles() {
  const meshRef = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  /* ── per-bubble random seed data ── */
  const bubbles = useMemo(() => {
    const arr = []
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      arr.push({
        // position
        x: (Math.random() - 0.5) * 60,
        y: SAND_Y + Math.random() * (MAX_Y - SAND_Y),
        z: -Math.random() * 60,
        // variation
        speed: 0.008 + Math.random() * 0.014,       // each bubble rises differently
        driftFreq: 0.3 + Math.random() * 0.8,       // side-wobble frequency
        driftAmp: 0.002 + Math.random() * 0.004,    // side-wobble amplitude
        phase: Math.random() * Math.PI * 2,          // offset so they don't sync
        scale: 0.03 + Math.random() * 0.06,          // very small spheres
      })
    }
    return arr
  }, [])

  /* ── animate every frame ── */
  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const b = bubbles[i]

      // rise
      b.y += b.speed

      // gentle side drift (sin wave)
      b.x += Math.sin(t * b.driftFreq + b.phase) * b.driftAmp

      // loop back to sand when reaching top
      if (b.y > MAX_Y) {
        b.y = SAND_Y
        b.x = (Math.random() - 0.5) * 60
        b.z = -Math.random() * 60
      }

      dummy.position.set(b.x, b.y, b.z)
      dummy.scale.setScalar(b.scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, BUBBLE_COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        color="#b0d8f0"
        transparent
        opacity={0.45}
        roughness={0.1}
        metalness={0.0}
        depthWrite={false}
      />
    </instancedMesh>
  )
}
