import { useMemo } from 'react'
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

/* ──────────────────── natural marine colour palette ──────────────── */
const CORAL_PALETTES = [
  // warm reds / pinks
  { base: [0.55, 0.18, 0.15], accent: [0.7, 0.25, 0.2] },
  { base: [0.65, 0.22, 0.25], accent: [0.8, 0.3, 0.3] },
  // orange / peach
  { base: [0.7, 0.35, 0.15], accent: [0.85, 0.45, 0.2] },
  // purple / mauve
  { base: [0.4, 0.2, 0.45], accent: [0.55, 0.3, 0.55] },
  // soft yellow
  { base: [0.65, 0.55, 0.2], accent: [0.8, 0.7, 0.3] },
  // earthy brown / tan
  { base: [0.45, 0.3, 0.2], accent: [0.6, 0.4, 0.25] },
  // deep crimson
  { base: [0.5, 0.12, 0.1], accent: [0.65, 0.18, 0.14] },
  // olive green (algae-covered)
  { base: [0.25, 0.35, 0.18], accent: [0.35, 0.45, 0.22] },
]

/* ──────────────────── individual coral builders ──────────────────── */

/**
 * Branching coral — tapered cylinder trunk + smaller branch cylinders.
 */
function BranchingCoral({ position, scale, colorIdx, rng }) {
  const pal = CORAL_PALETTES[colorIdx % CORAL_PALETTES.length]
  const col = new THREE.Color(...pal.base)
  const acc = new THREE.Color(...pal.accent)
  const rotY = rng() * Math.PI * 2

  const branches = useMemo(() => {
    const b = []
    const count = 3 + Math.floor(rng() * 4)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rng() * 0.5
      const lean = 0.3 + rng() * 0.5
      const h = 0.5 + rng() * 0.8
      const r = 0.04 + rng() * 0.06
      b.push({ angle, lean, h, r, subBranches: rng() > 0.5 })
    }
    return b
  }, [])

  return (
    <group position={position} scale={scale} rotation={[0, rotY, 0]}>
      {/* trunk */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.06, 0.12, 1.2, 8, 1]} />
        <meshStandardMaterial color={col} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* branches */}
      {branches.map((br, i) => (
        <group key={i} position={[0, 0.4 + i * 0.12, 0]} rotation={[br.lean, br.angle, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[br.r * 0.5, br.r, br.h, 6, 1]} />
            <meshStandardMaterial color={acc} roughness={0.8} metalness={0.05} />
          </mesh>
          {br.subBranches && (
            <group position={[0, br.h * 0.75, 0]} rotation={[0.4, 1.2, 0]}>
              <mesh castShadow receiveShadow>
                <cylinderGeometry args={[br.r * 0.3, br.r * 0.5, br.h * 0.5, 5, 1]} />
                <meshStandardMaterial color={acc} roughness={0.8} metalness={0.05} />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* soft shadow disc on floor */}
      <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.5, 16]} />
        <meshStandardMaterial color="#0a0a0a" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  )
}

/**
 * Brain coral — slightly flattened sphere with bumpy normals.
 */
function BrainCoral({ position, scale, colorIdx, rng }) {
  const pal = CORAL_PALETTES[colorIdx % CORAL_PALETTES.length]
  const col = new THREE.Color(...pal.base)
  const rotY = rng() * Math.PI * 2

  return (
    <group position={position} scale={scale} rotation={[0, rotY, 0]}>
      <mesh castShadow receiveShadow scale={[1, 0.6, 1]}>
        <dodecahedronGeometry args={[0.5, 2]} />
        <meshStandardMaterial
          color={col}
          roughness={0.92}
          metalness={0.02}
          flatShading
        />
      </mesh>
      {/* shadow disc */}
      <mesh position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.45, 16]} />
        <meshStandardMaterial color="#0a0a0a" transparent opacity={0.15} depthWrite={false} />
      </mesh>
    </group>
  )
}

/**
 * Tube coral — cluster of elongated cylinders
 */
function TubeCoral({ position, scale, colorIdx, rng }) {
  const pal = CORAL_PALETTES[colorIdx % CORAL_PALETTES.length]
  const col = new THREE.Color(...pal.base)
  const acc = new THREE.Color(...pal.accent)
  const rotY = rng() * Math.PI * 2

  const tubes = useMemo(() => {
    const t = []
    const count = 4 + Math.floor(rng() * 5)
    for (let i = 0; i < count; i++) {
      t.push({
        x: (rng() - 0.5) * 0.3,
        z: (rng() - 0.5) * 0.3,
        h: 0.4 + rng() * 0.9,
        r: 0.04 + rng() * 0.05,
        useAccent: rng() > 0.5,
      })
    }
    return t
  }, [])

  return (
    <group position={position} scale={scale} rotation={[0, rotY, 0]}>
      {tubes.map((tb, i) => (
        <mesh key={i} position={[tb.x, tb.h / 2, tb.z]} castShadow receiveShadow>
          <cylinderGeometry args={[tb.r, tb.r * 1.15, tb.h, 7, 1]} />
          <meshStandardMaterial
            color={tb.useAccent ? acc : col}
            roughness={0.85}
            metalness={0.04}
          />
        </mesh>
      ))}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.35, 16]} />
        <meshStandardMaterial color="#0a0a0a" transparent opacity={0.14} depthWrite={false} />
      </mesh>
    </group>
  )
}

/**
 * Fan coral — thin flat disc standing upright, like a sea fan.
 */
function FanCoral({ position, scale, colorIdx, rng }) {
  const pal = CORAL_PALETTES[colorIdx % CORAL_PALETTES.length]
  const col = new THREE.Color(...pal.base)
  const rotY = rng() * Math.PI * 2
  const tilt = (rng() - 0.5) * 0.2

  return (
    <group position={position} scale={scale} rotation={[0, rotY, tilt]}>
      {/* fan body — a flat disc rotated to stand upright */}
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
        <circleGeometry args={[0.6, 24]} />
        <meshStandardMaterial
          color={col}
          roughness={0.8}
          metalness={0.03}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* stem */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.03, 0.05, 0.35, 6, 1]} />
        <meshStandardMaterial color={col} roughness={0.9} metalness={0.05} />
      </mesh>
      {/* shadow */}
      <mesh position={[0, -0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.4, 16]} />
        <meshStandardMaterial color="#0a0a0a" transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  )
}

/**
 * Mushroom / table coral — wide flat disc on a short stump.
 */
function MushroomCoral({ position, scale, colorIdx, rng }) {
  const pal = CORAL_PALETTES[colorIdx % CORAL_PALETTES.length]
  const col = new THREE.Color(...pal.base)
  const rotY = rng() * Math.PI * 2

  return (
    <group position={position} scale={scale} rotation={[0, rotY, 0]}>
      {/* stump */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.18, 0.3, 8, 1]} />
        <meshStandardMaterial color={col} roughness={0.88} metalness={0.04} />
      </mesh>
      {/* cap — squished sphere */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow scale={[1, 0.3, 1]}>
        <sphereGeometry args={[0.45, 16, 12]} />
        <meshStandardMaterial color={col} roughness={0.85} metalness={0.03} flatShading />
      </mesh>
      {/* shadow */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.4, 16]} />
        <meshStandardMaterial color="#0a0a0a" transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* ─────────────── coral type registry ─────────────── */
const CORAL_TYPES = [BranchingCoral, BrainCoral, TubeCoral, FanCoral, MushroomCoral]

/* ───────────────── placement constants ───────────────── */
const FLOOR_Y = -2             // sand floor Y
const CENTER_CLEAR = 12        // min distance from center (keep path clear)
const MAX_X = 45               // max distance from centre (visible within FOV)
const Z_MIN = 20               // start slightly behind camera start (z=0)
const Z_MAX = -80              // extends past camera endpoint (z=-60)

// Cluster definitions — each cluster is a focal point with a few corals around it
const NUM_CLUSTERS = 14        // number of natural groupings
const CORALS_PER_CLUSTER_MIN = 2
const CORALS_PER_CLUSTER_MAX = 5
const CLUSTER_RADIUS = 4       // how spread out corals are within a cluster
const SOLO_CORALS = 8          // scattered lone corals between clusters

/**
 * Generate coral placements using natural cluster-based distribution.
 * - 14 clusters of 2–5 corals each, scattered along the full z range
 * - 8 additional solo corals for variety
 * - Wide open sand between clusters
 * - Occasional large coral (hero piece)
 */
function generateAllCorals() {
  const rng = mulberry32(42)
  const corals = []
  const zRange = Z_MIN - Z_MAX

  // ── Place clusters along the z axis with spacing ──
  for (let c = 0; c < NUM_CLUSTERS; c++) {
    // Spread cluster centers evenly with jitter
    const baseFrac = (c + 0.5) / NUM_CLUSTERS
    const jitter = (rng() - 0.5) * 0.6 / NUM_CLUSTERS
    const clusterZ = Z_MIN - (baseFrac + jitter) * zRange

    // Cluster center x — on either side of the path
    const side = c % 2 === 0 ? 1 : -1
    const clusterX = side * (CENTER_CLEAR + rng() * (MAX_X - CENTER_CLEAR - CLUSTER_RADIUS))

    // How many corals in this cluster
    const count = CORALS_PER_CLUSTER_MIN + Math.floor(rng() * (CORALS_PER_CLUSTER_MAX - CORALS_PER_CLUSTER_MIN + 1))

    // One coral in the cluster can be a hero (larger)
    const heroIdx = Math.floor(rng() * count)

    for (let j = 0; j < count; j++) {
      const angle = rng() * Math.PI * 2
      const dist = rng() * CLUSTER_RADIUS
      const x = clusterX + Math.cos(angle) * dist
      const z = clusterZ + Math.sin(angle) * dist

      const type = Math.floor(rng() * CORAL_TYPES.length)
      const colorIdx = Math.floor(rng() * CORAL_PALETTES.length)

      // Hero coral is 1.5–2.2x, others are 0.6–1.2x
      const s = j === heroIdx
        ? 1.5 + rng() * 0.7
        : 0.6 + rng() * 0.6

      corals.push({ x, z, type, colorIdx, s, seed: Math.floor(rng() * 99999) })
    }
  }

  // ── Scattered solo corals for natural variety ──
  for (let i = 0; i < SOLO_CORALS; i++) {
    const side = rng() > 0.5 ? 1 : -1
    const x = side * (CENTER_CLEAR + rng() * (MAX_X - CENTER_CLEAR))
    const z = Z_MIN - rng() * zRange
    const type = Math.floor(rng() * CORAL_TYPES.length)
    const colorIdx = Math.floor(rng() * CORAL_PALETTES.length)
    const s = 0.5 + rng() * 0.5   // solo corals are small

    corals.push({ x, z, type, colorIdx, s, seed: Math.floor(rng() * 99999) })
  }

  return corals
}

/**
 * Corals — placed on both sides of the sand road across the full plane.
 * No leapfrog needed since the plane is one big static surface.
 */
export default function Corals() {
  const corals = useMemo(() => generateAllCorals(), [])

  return (
    <group>
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
