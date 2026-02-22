import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ─────────────────────────── seeded PRNG ─────────────────────────── */
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ──────────────────── muted deep-sea colour palette ──────────────── */
const CORAL_PALETTES = [
  // deep sea green (algae-tinted)
  { base: [0.18, 0.28, 0.22], accent: [0.22, 0.34, 0.26] },
  // muted teal
  { base: [0.2, 0.32, 0.34], accent: [0.25, 0.38, 0.4] },
  // dark mauve (purple toned way down)
  { base: [0.3, 0.2, 0.28], accent: [0.36, 0.24, 0.32] },
  // dusty rose (soft pink, blue-absorbed)
  { base: [0.38, 0.22, 0.22], accent: [0.42, 0.26, 0.25] },
  // weathered brown
  { base: [0.3, 0.24, 0.18], accent: [0.36, 0.28, 0.2] },
  // deep olive
  { base: [0.22, 0.26, 0.16], accent: [0.28, 0.32, 0.2] },
  // slate blue-grey
  { base: [0.22, 0.25, 0.3], accent: [0.26, 0.3, 0.36] },
  // dark rust (red absorbed by water)
  { base: [0.32, 0.18, 0.14], accent: [0.38, 0.22, 0.16] },
]

/* ──── helper: deform a geometry for organic feel ──── */
function deformGeometry(geo, rng, amount = 0.06) {
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    pos.setX(i, pos.getX(i) + (rng() - 0.5) * amount)
    pos.setY(i, pos.getY(i) + (rng() - 0.5) * amount)
    pos.setZ(i, pos.getZ(i) + (rng() - 0.5) * amount)
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

/* ──────────────────── coral builders (organic forms) ──────────────────── */

/**
 * Branching coral — irregular trunk + asymmetric branches with sub-branches.
 * Feels like real staghorn / elkhorn coral.
 */
function BranchingCoral({ position, scale, colorIdx, rng }) {
  const pal = CORAL_PALETTES[colorIdx % CORAL_PALETTES.length]
  const col = new THREE.Color(...pal.base)
  const acc = new THREE.Color(...pal.accent)
  const rotY = rng() * Math.PI * 2

  const branches = useMemo(() => {
    const b = []
    const count = 4 + Math.floor(rng() * 4) // 4-7 branches
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (rng() - 0.5) * 0.8
      const lean = 0.2 + rng() * 0.7
      const h = 0.4 + rng() * 0.7
      const rBot = 0.04 + rng() * 0.04
      const rTop = rBot * (0.3 + rng() * 0.4)
      const twist = (rng() - 0.5) * 0.6

      // sub-branches for complexity
      const subs = []
      if (rng() > 0.3) {
        const subCount = 1 + Math.floor(rng() * 2)
        for (let s = 0; s < subCount; s++) {
          subs.push({
            yOff: 0.4 + rng() * 0.4,
            lean: 0.3 + rng() * 0.5,
            angle: rng() * Math.PI * 2,
            h: 0.2 + rng() * 0.3,
            r: rBot * (0.3 + rng() * 0.3),
          })
        }
      }
      b.push({ angle, lean, h, rBot, rTop, twist, subs })
    }
    return b
  }, [])

  // Deformed trunk geometry
  const trunkGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.05, 0.1, 0.9, 7, 3)
    return deformGeometry(g, rng, 0.03)
  }, [])

  return (
    <group position={position} scale={scale} rotation={[0, rotY, 0]}>
      {/* reef base — irregular rock */}
      <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color={col} roughness={0.95} metalness={0.02} flatShading />
      </mesh>

      {/* trunk */}
      <mesh geometry={trunkGeo} position={[0, 0.35, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={col} roughness={0.88} metalness={0.03} flatShading />
      </mesh>

      {/* branches */}
      {branches.map((br, i) => (
        <group key={i} position={[0, 0.3 + i * 0.08, 0]} rotation={[br.lean, br.angle, br.twist]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[br.rTop, br.rBot, br.h, 5, 2]} />
            <meshStandardMaterial color={acc} roughness={0.85} metalness={0.03} flatShading />
          </mesh>
          {br.subs.map((s, si) => (
            <group key={si} position={[0, br.h * s.yOff, 0]} rotation={[s.lean, s.angle, 0]}>
              <mesh castShadow receiveShadow>
                <cylinderGeometry args={[s.r * 0.4, s.r, s.h, 4, 1]} />
                <meshStandardMaterial color={acc} roughness={0.85} metalness={0.03} flatShading />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

/**
 * Brain coral — organic blob with irregular surface, reef base.
 */
function BrainCoral({ position, scale, colorIdx, rng }) {
  const pal = CORAL_PALETTES[colorIdx % CORAL_PALETTES.length]
  const col = new THREE.Color(...pal.base)
  const rotY = rng() * Math.PI * 2
  const squash = 0.45 + rng() * 0.25

  const blobGeo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.45, 2)
    return deformGeometry(g, rng, 0.08)
  }, [])

  return (
    <group position={position} scale={scale} rotation={[0, rotY, 0]}>
      {/* reef base */}
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <dodecahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color={col} roughness={0.95} metalness={0.02} flatShading />
      </mesh>
      {/* brain blob */}
      <mesh geometry={blobGeo} position={[0, 0.15, 0]} castShadow receiveShadow scale={[1, squash, 1]}>
        <meshStandardMaterial color={col} roughness={0.92} metalness={0.02} flatShading />
      </mesh>
    </group>
  )
}

/**
 * Tube coral — irregular cluster of varying-height tubes from a rocky base.
 */
function TubeCoral({ position, scale, colorIdx, rng }) {
  const pal = CORAL_PALETTES[colorIdx % CORAL_PALETTES.length]
  const col = new THREE.Color(...pal.base)
  const acc = new THREE.Color(...pal.accent)
  const rotY = rng() * Math.PI * 2

  const tubes = useMemo(() => {
    const t = []
    const count = 5 + Math.floor(rng() * 5) // 5-9 tubes
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2
      const dist = rng() * 0.18
      t.push({
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        h: 0.25 + rng() * 0.7,
        rBot: 0.025 + rng() * 0.03,
        lean: (rng() - 0.5) * 0.2, // slight lean
        useAccent: rng() > 0.5,
      })
    }
    return t
  }, [])

  return (
    <group position={position} scale={scale} rotation={[0, rotY, 0]}>
      {/* rocky base */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <dodecahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial color={col} roughness={0.95} metalness={0.02} flatShading />
      </mesh>
      {tubes.map((tb, i) => (
        <mesh key={i} position={[tb.x, tb.h / 2, tb.z]} rotation={[tb.lean, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[tb.rBot * 0.7, tb.rBot, tb.h, 6, 1]} />
          <meshStandardMaterial
            color={tb.useAccent ? acc : col}
            roughness={0.88}
            metalness={0.03}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Fan coral — organic sea fan on a stem with rocky base.
 * Uses irregular ring geometry instead of perfect circle.
 */
function FanCoral({ position, scale, colorIdx, rng }) {
  const pal = CORAL_PALETTES[colorIdx % CORAL_PALETTES.length]
  const col = new THREE.Color(...pal.base)
  const rotY = rng() * Math.PI * 2
  const tilt = (rng() - 0.5) * 0.15

  const fanGeo = useMemo(() => {
    const g = new THREE.CircleGeometry(0.5, 12)
    return deformGeometry(g, rng, 0.08)
  }, [])

  return (
    <group position={position} scale={scale} rotation={[0, rotY, tilt]}>
      {/* rocky base */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <dodecahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial color={col} roughness={0.95} metalness={0.02} flatShading />
      </mesh>
      {/* stem */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.02, 0.04, 0.25, 5, 1]} />
        <meshStandardMaterial color={col} roughness={0.92} metalness={0.03} flatShading />
      </mesh>
      {/* fan — standing upright, irregular edge */}
      <mesh geometry={fanGeo} position={[0, 0.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color={col}
          roughness={0.82}
          metalness={0.03}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>
    </group>
  )
}

/**
 * Rock coral — irregular rock formation with encrusting coral patches.
 * Replaces the cartoonish mushroom coral.
 */
function RockCoral({ position, scale, colorIdx, rng }) {
  const pal = CORAL_PALETTES[colorIdx % CORAL_PALETTES.length]
  const col = new THREE.Color(...pal.base)
  const acc = new THREE.Color(...pal.accent)
  const rotY = rng() * Math.PI * 2

  const rockGeo = useMemo(() => {
    const g = new THREE.DodecahedronGeometry(0.35, 1)
    return deformGeometry(g, rng, 0.1)
  }, [])

  const patchCount = 2 + Math.floor(rng() * 3)
  const patches = useMemo(() => {
    const p = []
    for (let i = 0; i < patchCount; i++) {
      p.push({
        x: (rng() - 0.5) * 0.3,
        y: 0.1 + rng() * 0.25,
        z: (rng() - 0.5) * 0.3,
        s: 0.08 + rng() * 0.1,
      })
    }
    return p
  }, [])

  return (
    <group position={position} scale={scale} rotation={[0, rotY, 0]}>
      {/* main rock */}
      <mesh geometry={rockGeo} position={[0, 0.15, 0]} castShadow receiveShadow scale={[1, 0.7, 1]}>
        <meshStandardMaterial color={col} roughness={0.95} metalness={0.02} flatShading />
      </mesh>
      {/* encrusting coral patches */}
      {patches.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} receiveShadow>
          <sphereGeometry args={[p.s, 6, 4]} />
          <meshStandardMaterial color={acc} roughness={0.9} metalness={0.02} flatShading />
        </mesh>
      ))}
    </group>
  )
}

/* ─────────────── shell geometry from shell-gleam-studio ─────────────── */

/**
 * Creates one half of the scallop shell (top or bottom valve).
 * Exact geometry from the shell-gleam-studio project.
 */
function createShellHalf(isTop, detail = 1) {
  const segments = Math.round(140 * detail)
  const rings = Math.round(100 * detail)
  const ridgeCount = 16
  const fanAngle = Math.PI * 0.85
  const maxR = 2.2

  const positions = []
  const uvs = []
  const indices = []

  for (let ri = 0; ri <= rings; ri++) {
    const rv = ri / rings
    const r = rv * maxR

    for (let si = 0; si <= segments; si++) {
      const su = si / segments
      const angle = -fanAngle / 2 + su * fanAngle

      const x = r * Math.sin(angle)
      const z = r * Math.cos(angle)

      // Dome curvature
      const dome = Math.sin(rv * Math.PI) * 0.65

      // Radial ridges
      const ridgePhase = angle * ridgeCount
      const ridge = Math.pow(Math.abs(Math.cos(ridgePhase)), 1.5) * 0.06 * rv

      // Fine groove between ridges (subtle valleys)
      const groove = -Math.pow(Math.abs(Math.sin(ridgePhase)), 4) * 0.02 * rv

      // Wavy edge frill
      const edgeT = Math.max(0, (rv - 0.85) / 0.15)
      const frill = edgeT * Math.sin(angle * ridgeCount) * 0.04

      const curveFactor = isTop ? 1 : 0.28
      const y = (dome + ridge + groove + frill) * curveFactor * (isTop ? 1 : -1)

      positions.push(x, y, z)
      uvs.push(su, rv)
    }
  }

  for (let ri = 0; ri < rings; ri++) {
    for (let si = 0; si < segments; si++) {
      const a = ri * (segments + 1) + si
      const b = a + 1
      const c = a + (segments + 1)
      const d = c + 1

      if (isTop) {
        indices.push(a, c, b)
        indices.push(b, c, d)
      } else {
        indices.push(a, b, c)
        indices.push(b, d, c)
      }
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

/**
 * ShellCoral — exact ScallopShell from shell-gleam-studio, adapted
 * to work as a coral placement in the underwater portfolio.
 * Geometry, materials, and pearl are identical to the studio version.
 */
function ShellCoral({ position, scale, colorIdx, rng, detail = 1 }) {
  const rotY = rng ? rng() * Math.PI * 2 : 0
  const pearlRef = useRef()

  const topGeo = useMemo(() => createShellHalf(true, detail), [detail])
  const bottomGeo = useMemo(() => createShellHalf(false, detail), [detail])

  // Subtle pearl bob animation (from studio)
  useFrame((state) => {
    if (pearlRef.current) {
      pearlRef.current.position.y = 0.1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.012
    }
  })

  return (
    <group position={position} scale={scale} rotation={[0.2, rotY, 0]}>
      {/* ── Bottom valve ── */}
      <mesh geometry={bottomGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#e07898"
          roughness={0.2}
          metalness={0.0}
          clearcoat={0.4}
          clearcoatRoughness={0.15}
          sheen={1.0}
          sheenColor={new THREE.Color('#ffc0d0')}
          sheenRoughness={0.15}
          side={THREE.DoubleSide}
          envMapIntensity={0.2}
        />
      </mesh>

      {/* ── Top valve (hinged open) ── */}
      <group rotation={[-0.75, 0, 0]}>
        <mesh geometry={topGeo} castShadow receiveShadow>
          <meshPhysicalMaterial
            color="#d46a88"
            roughness={0.35}
            metalness={0.0}
            clearcoat={0.3}
            clearcoatRoughness={0.3}
            sheen={0.8}
            sheenColor={new THREE.Color('#f5a0b8')}
            sheenRoughness={0.25}
            side={THREE.DoubleSide}
            envMapIntensity={0.3}
          />
        </mesh>
      </group>

      {/* ── Pearl ── */}
      <mesh ref={pearlRef} position={[0, 0.1, 0.75]} castShadow>
        <sphereGeometry args={[0.3, 64, 64]} />
        <meshPhysicalMaterial
          color="#f8f0e8"
          roughness={0.02}
          metalness={0.05}
          clearcoat={1.0}
          clearcoatRoughness={0.01}
          sheen={1.0}
          sheenColor={new THREE.Color('#ffe8ef')}
          sheenRoughness={0.08}
          envMapIntensity={2.0}
          iridescence={0.3}
          iridescenceIOR={1.5}
        />
      </mesh>
    </group>
  )
}

/* ─────────────── coral type registry ─────────────── */
const CORAL_TYPES = [BranchingCoral, BrainCoral, TubeCoral, FanCoral, RockCoral]

/* ───────────────── placement constants ───────────────── */
const FLOOR_Y = -2
const CENTER_CLEAR = 12
const MAX_X = 45
const Z_MIN = 20
const Z_MAX = -110

// Cluster layout — natural reef groupings with open sand
const NUM_CLUSTERS = 10          // fewer, more defined clusters
const CORALS_PER_CLUSTER_MIN = 3
const CORALS_PER_CLUSTER_MAX = 7
const CLUSTER_RADIUS = 5         // wider spread within cluster
const SOLO_CORALS = 5            // rare isolated pieces

/**
 * Generate coral placements — reef-like clusters with wide gaps.
 */
function generateAllCorals() {
  const rng = mulberry32(42)
  const corals = []
  const zRange = Z_MIN - Z_MAX

  for (let c = 0; c < NUM_CLUSTERS; c++) {
    const baseFrac = (c + 0.5) / NUM_CLUSTERS
    const jitter = (rng() - 0.5) * 0.7 / NUM_CLUSTERS
    const clusterZ = Z_MIN - (baseFrac + jitter) * zRange

    const side = c % 2 === 0 ? 1 : -1
    const clusterX = side * (CENTER_CLEAR + rng() * (MAX_X - CENTER_CLEAR - CLUSTER_RADIUS))

    const count = CORALS_PER_CLUSTER_MIN + Math.floor(rng() * (CORALS_PER_CLUSTER_MAX - CORALS_PER_CLUSTER_MIN + 1))

    // Pick a dominant type for the cluster (reefs have type grouping)
    const dominantType = Math.floor(rng() * CORAL_TYPES.length)
    const clusterPalette = Math.floor(rng() * CORAL_PALETTES.length)
    const heroIdx = Math.floor(rng() * count)

    for (let j = 0; j < count; j++) {
      const angle = rng() * Math.PI * 2
      const dist = rng() * CLUSTER_RADIUS * (0.3 + rng() * 0.7) // non-uniform spread
      const x = clusterX + Math.cos(angle) * dist
      const z = clusterZ + Math.sin(angle) * dist

      // 70% dominant type, 30% random — natural reef grouping
      const type = rng() < 0.7 ? dominantType : Math.floor(rng() * CORAL_TYPES.length)

      // Slight palette variation within cluster
      const colorIdx = rng() < 0.6 ? clusterPalette : Math.floor(rng() * CORAL_PALETTES.length)

      const s = j === heroIdx
        ? 2.5 + rng() * 1.5    // hero: 2.5–4.0
        : 1.2 + rng() * 1.0    // standard: 1.2–2.2

      corals.push({ x, z, type, colorIdx, s, seed: Math.floor(rng() * 99999) })
    }
  }

  // Sparse solo corals
  for (let i = 0; i < SOLO_CORALS; i++) {
    const side = rng() > 0.5 ? 1 : -1
    const x = side * (CENTER_CLEAR + rng() * (MAX_X - CENTER_CLEAR))
    const z = Z_MIN - rng() * zRange
    const type = Math.floor(rng() * CORAL_TYPES.length)
    const colorIdx = Math.floor(rng() * CORAL_PALETTES.length)
    const s = 0.8 + rng() * 0.6

    corals.push({ x, z, type, colorIdx, s, seed: Math.floor(rng() * 99999) })
  }

  return corals
}

/**
 * Single prominent shell for the Introduction section.
 * Placed on the right side of the viewport, large enough to fill ~1/4 screen.
 * Uses higher geometry detail for a smooth, polished look.
 */
function IntroShell() {
  const pearlRef = useRef()
  const topGeo = useMemo(() => createShellHalf(true, 1.4), [])
  const bottomGeo = useMemo(() => createShellHalf(false, 1.4), [])

  useFrame((state) => {
    if (pearlRef.current) {
      pearlRef.current.position.y = 0.1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.012
    }
  })

  // Introduction camera: { x: -6, y: 2, z: 0 }, looks toward -z
  // Right side of screen = more positive x from camera
  return (
    <group position={[-2, FLOOR_Y + 1.8, -8]} scale={1.1} rotation={[0.15, -0.8, 0]}>
      {/* Bottom valve */}
      <mesh geometry={bottomGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#e07898"
          roughness={0.18}
          metalness={0.0}
          clearcoat={0.5}
          clearcoatRoughness={0.1}
          sheen={1.0}
          sheenColor={new THREE.Color('#ffc0d0')}
          sheenRoughness={0.12}
          side={THREE.DoubleSide}
          envMapIntensity={0.25}
        />
      </mesh>

      {/* Top valve (hinged open) */}
      <group rotation={[-0.75, 0, 0]}>
        <mesh geometry={topGeo} castShadow receiveShadow>
          <meshPhysicalMaterial
            color="#d46a88"
            roughness={0.3}
            metalness={0.0}
            clearcoat={0.35}
            clearcoatRoughness={0.25}
            sheen={0.8}
            sheenColor={new THREE.Color('#f5a0b8')}
            sheenRoughness={0.2}
            side={THREE.DoubleSide}
            envMapIntensity={0.35}
          />
        </mesh>
      </group>

      {/* Pearl */}
      <mesh ref={pearlRef} position={[0, 0.1, 0.75]} castShadow>
        <sphereGeometry args={[0.3, 64, 64]} />
        <meshPhysicalMaterial
          color="#f8f0e8"
          roughness={0.02}
          metalness={0.05}
          clearcoat={1.0}
          clearcoatRoughness={0.01}
          sheen={1.0}
          sheenColor={new THREE.Color('#ffe8ef')}
          sheenRoughness={0.08}
          envMapIntensity={2.0}
          iridescence={0.3}
          iridescenceIOR={1.5}
        />
      </mesh>
    </group>
  )
}

export default function Corals() {
  const corals = useMemo(() => generateAllCorals(), [])

  return (
    <group>
      {/* Single prominent shell on the Introduction page (right side) */}
      <IntroShell />

      {/* All other coral types (no shells) across the scene */}
      {corals.map((c, i) => {
        const CoralComp = CORAL_TYPES[c.type]
        const coralRng = mulberry32(c.seed)
        return (
          <CoralComp
            key={i}
            position={[c.x, FLOOR_Y, c.z]}
            scale={c.s}
            colorIdx={c.colorIdx}
            rng={coralRng}
          />
        )
      })}
    </group>
  )
}
