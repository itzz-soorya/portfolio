import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ── Sun-ray shaft config ── */
const RAY_COUNT = 12
const RAY_HEIGHT = 28
const RAY_SPREAD_X = 30  // total horizontal spread
const RAY_DEPTH = 40     // how far ahead/behind camera rays span

/**
 * Underwater sun-ray light shafts.
 * Tall transparent planes with a custom GLSL shader —
 * bright at top, fading toward the sand, soft edges, slow sway.
 * Follows the camera so rays are always present.
 */
export default function SunRays() {
  const groupRef = useRef()

  /* ── One shared ShaderMaterial ── */
  const rayMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 1.0 },
        uColor: { value: new THREE.Color(0.35, 0.62, 0.82) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uOpacity;
        uniform vec3  uColor;
        varying vec2  vUv;

        void main() {
          // Vertical: bright at top (uv.y=1), fades to nothing at bottom (uv.y=0)
          float vFade = pow(vUv.y, 1.6);

          // Horizontal: soft edges, bright in center
          float center = abs(vUv.x - 0.5) * 2.0;   // 0 at center, 1 at edge
          float hFade  = 1.0 - smoothstep(0.0, 1.0, center);

          // Gentle shimmer
          float shimmer = 0.85 + 0.15 * sin(uTime * 0.4 + vUv.y * 6.0);

          float alpha = vFade * hFade * shimmer * uOpacity * 0.18;

          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    })
  }, [])

  /* ── Per-ray data: random x offset, z offset, width, phase, speed ── */
  const rays = useMemo(() => {
    const arr = []
    for (let i = 0; i < RAY_COUNT; i++) {
      arr.push({
        xBase: (Math.random() - 0.5) * RAY_SPREAD_X,
        zOff:  (Math.random() - 0.5) * RAY_DEPTH,
        width: 0.8 + Math.random() * 1.8,       // 0.8 – 2.6
        phase: Math.random() * Math.PI * 2,
        speed: 0.08 + Math.random() * 0.12,      // slow drift
        yOff:  Math.random() * 3,                 // slight vertical variety
      })
    }
    return arr
  }, [])

  /* ── Animate: follow camera + slow sway ── */
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const camZ = state.camera.position.z

    // Update shared uniform
    rayMaterial.uniforms.uTime.value = t

    if (!groupRef.current) return
    const children = groupRef.current.children

    for (let i = 0; i < children.length; i++) {
      const mesh = children[i]
      const r = rays[i]

      // Slow horizontal sway
      const sway = Math.sin(t * r.speed + r.phase) * 1.8

      mesh.position.set(
        r.xBase + sway,
        RAY_HEIGHT * 0.5 - 2 + r.yOff,   // hangs from high above toward sand
        camZ + r.zOff
      )
    }
  })

  return (
    <group ref={groupRef}>
      {rays.map((r, i) => (
        <mesh key={i} material={rayMaterial}>
          <planeGeometry args={[r.width, RAY_HEIGHT]} />
        </mesh>
      ))}
    </group>
  )
}
