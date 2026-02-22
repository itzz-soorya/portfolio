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

/* ── procedural shell nacre texture (matches real shell photo) ────────── */
function createShellTexture(size = 512, isInner = true) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  const cx = size / 2, cy = size / 2

  if (isInner) {
    // Inner nacre — creamy white centre → warm peach → soft pink at edge
    const grad = ctx.createRadialGradient(cx, cy * 0.6, 0, cx, cy, size * 0.55)
    grad.addColorStop(0.0, '#FAF4ED')   // near-white centre
    grad.addColorStop(0.3, '#F5E6D3')   // warm cream 
    grad.addColorStop(0.55, '#EDCFB8')  // peach
    grad.addColorStop(0.75, '#E4B89E')  // deeper peach-pink
    grad.addColorStop(1.0, '#D4A07A')   // golden tan at rim
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)

    // Iridescent nacre shimmer — subtle rainbow streaks
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2
      const shimGrad = ctx.createLinearGradient(
        cx + Math.cos(angle) * 20, cy + Math.sin(angle) * 20,
        cx + Math.cos(angle) * size * 0.45, cy + Math.sin(angle) * size * 0.45
      )
      shimGrad.addColorStop(0, 'rgba(255,240,230,0)')
      shimGrad.addColorStop(0.3, 'rgba(255,220,210,0.06)')
      shimGrad.addColorStop(0.5, 'rgba(230,210,240,0.05)')
      shimGrad.addColorStop(0.7, 'rgba(210,230,240,0.04)')
      shimGrad.addColorStop(1, 'rgba(240,230,220,0)')
      ctx.fillStyle = shimGrad
      ctx.fillRect(0, 0, size, size)
    }

    // Radial ridge lines from hinge (bottom-centre) — scallop growth lines
    ctx.strokeStyle = 'rgba(200,160,120,0.12)'
    for (let i = 0; i < 28; i++) {
      const a = -Math.PI * 0.15 + (i / 27) * Math.PI * 1.3
      ctx.beginPath()
      ctx.moveTo(cx, size)
      ctx.lineTo(cx + Math.cos(a) * size * 0.7, size - Math.sin(a) * size * 0.9)
      ctx.lineWidth = 1 + Math.random() * 1.5
      ctx.stroke()
    }

    // Concentric growth arcs
    ctx.strokeStyle = 'rgba(190,150,110,0.07)'
    for (let r = 60; r < size * 0.55; r += 18 + Math.random() * 14) {
      ctx.beginPath()
      ctx.arc(cx, size, r, -Math.PI * 0.85, -Math.PI * 0.15)
      ctx.lineWidth = 0.8 + Math.random()
      ctx.stroke()
    }
  } else {
    // Outer shell — warmer golden-tan to amber-brown
    const grad = ctx.createRadialGradient(cx, cy * 0.6, 0, cx, cy, size * 0.55)
    grad.addColorStop(0.0, '#D4A97A')
    grad.addColorStop(0.3, '#C9976A')
    grad.addColorStop(0.6, '#B8845A')
    grad.addColorStop(1.0, '#A07050')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)

    // Stronger radial ridges on outer surface
    ctx.strokeStyle = 'rgba(120,80,50,0.18)'
    for (let i = 0; i < 28; i++) {
      const a = -Math.PI * 0.15 + (i / 27) * Math.PI * 1.3
      ctx.beginPath()
      ctx.moveTo(cx, size)
      ctx.lineTo(cx + Math.cos(a) * size * 0.72, size - Math.sin(a) * size * 0.92)
      ctx.lineWidth = 1.5 + Math.random() * 2
      ctx.stroke()
    }

    // Concentric growth rings (more visible on exterior)
    ctx.strokeStyle = 'rgba(100,70,40,0.1)'
    for (let r = 50; r < size * 0.6; r += 14 + Math.random() * 10) {
      ctx.beginPath()
      ctx.arc(cx, size, r, -Math.PI * 0.85, -Math.PI * 0.15)
      ctx.lineWidth = 1 + Math.random() * 1.5
      ctx.stroke()
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/* ── pearl iridescence procedural texture ── */
function createPearlTexture(size = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  // Base creamy white
  const grad = ctx.createRadialGradient(size * 0.4, size * 0.35, 0, size * 0.5, size * 0.5, size * 0.5)
  grad.addColorStop(0.0, '#FFFDF8')
  grad.addColorStop(0.4, '#F5EDE4')
  grad.addColorStop(0.7, '#EDE0D4')
  grad.addColorStop(1.0, '#E0D0C0')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  // Subtle iridescent colour patches
  const colours = [
    'rgba(255,220,230,0.08)', 'rgba(220,230,255,0.06)',
    'rgba(230,255,230,0.05)', 'rgba(255,240,210,0.07)',
  ]
  for (let i = 0; i < 12; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 30 + Math.random() * 60
    const g2 = ctx.createRadialGradient(x, y, 0, x, y, r)
    g2.addColorStop(0, colours[i % colours.length])
    g2.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g2
    ctx.fillRect(0, 0, size, size)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/**
 * Build a scallop shell valve — fan-shaped, cupped, with proper radial ridges.
 * Custom BufferGeometry matching the shape in the reference photo.
 */
function createScallopValveGeometry(rng, radius = 0.34, segments = 24, rings = 12) {
  const positions = []
  const normals = []
  const uvs = []
  const indices = []

  const fanAngle = Math.PI * 1.15  // slightly wider than semicircle
  const startAngle = -fanAngle / 2

  for (let ri = 0; ri <= rings; ri++) {
    const rFrac = ri / rings
    const r = rFrac * radius
    // Cupping — lift edges, depress centre (creates the bowl shape)
    const cup = -Math.pow(rFrac, 1.6) * 0.12

    for (let si = 0; si <= segments; si++) {
      const sFrac = si / segments
      const angle = startAngle + sFrac * fanAngle

      // Base position
      let x = Math.cos(angle) * r
      let z = Math.sin(angle) * r

      // Radial ridges — sinusoidal bumps in the y direction
      const ridgeCount = 13
      const ridge = Math.sin(angle * ridgeCount) * 0.008 * rFrac * rFrac

      // Scalloped edge — wavy rim
      let edgeWave = 0
      if (rFrac > 0.85) {
        edgeWave = Math.sin(angle * ridgeCount) * 0.015 * ((rFrac - 0.85) / 0.15)
      }

      // Slight organic wobble
      const wobble = (rng() - 0.5) * 0.003 * rFrac

      const y = cup + ridge + edgeWave + wobble

      positions.push(x, y, z)
      normals.push(0, 1, 0) // will recompute
      uvs.push(sFrac, rFrac)
    }
  }

  // Build triangle indices
  const vertsPerRing = segments + 1
  for (let ri = 0; ri < rings; ri++) {
    for (let si = 0; si < segments; si++) {
      const a = ri * vertsPerRing + si
      const b = a + 1
      const c = a + vertsPerRing
      const d = c + 1
      indices.push(a, c, b)
      indices.push(b, c, d)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

/**
 * Shell coral — realistic open seashell with pearl, matching the reference
 * photo.  Warm cream/peach/golden nacre, proper scallop shape, iridescent
 * pearl, pearlescent MeshPhysicalMaterial.
 */
function ShellCoral({ position, scale, colorIdx, rng }) {
  const rotY = rng() * Math.PI * 2

  // Per-instance variation
  const openAngle = 0.5 + rng() * 0.35       // how wide the shell gapes
  const pearlSize = 0.055 + rng() * 0.025
  const pearlOffY = 0.02 + rng() * 0.015
  const shellTilt = (rng() - 0.5) * 0.08     // slight natural tilt

  // Scallop valve geometry (shared between halves)
  const valveGeo = useMemo(() => createScallopValveGeometry(rng), [])

  // Textures
  const innerTex = useMemo(() => createShellTexture(512, true), [])
  const outerTex = useMemo(() => createShellTexture(512, false), [])
  const pearlTex = useMemo(() => createPearlTexture(256), [])

  // Shell colours from the reference image
  const shellColor = useMemo(() => new THREE.Color('#F0D8C0'), [])     // warm cream
  const outerColor = useMemo(() => new THREE.Color('#C9976A'), [])     // golden tan
  const pearlColor = useMemo(() => new THREE.Color('#F5EDE4'), [])     // creamy white
  const baseColor = useMemo(() => new THREE.Color('#8B7355'), [])      // sandy rock

  // Hinge point — where the two valves meet
  const hingeZ = -0.3

  return (
    <group position={position} scale={scale} rotation={[shellTilt, rotY, 0]}>

      {/* ── sandy base — natural anchor on the ocean floor ── */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <dodecahedronGeometry args={[0.14, 1]} />
        <meshStandardMaterial
          color={baseColor}
          roughness={0.95}
          metalness={0.02}
          flatShading
        />
      </mesh>

      {/* ── BOTTOM VALVE (rests on base, inner nacre facing up) ── */}
      <group position={[0, 0.02, 0]}>
        {/* inner nacre surface (facing up) */}
        <mesh geometry={valveGeo} castShadow receiveShadow>
          <meshPhysicalMaterial
            map={innerTex}
            color={shellColor}
            roughness={0.2}
            metalness={0.15}
            clearcoat={0.6}
            clearcoatRoughness={0.15}
            sheen={0.4}
            sheenColor={new THREE.Color('#FFE4D6')}
            side={THREE.FrontSide}
          />
        </mesh>
        {/* outer surface (facing down) */}
        <mesh geometry={valveGeo} receiveShadow>
          <meshPhysicalMaterial
            map={outerTex}
            color={outerColor}
            roughness={0.55}
            metalness={0.05}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {/* ── TOP VALVE (hinged open, inner nacre facing down toward pearl) ── */}
      <group position={[0, 0.02, hingeZ]}>
        <group rotation={[-openAngle, 0, 0]} position={[0, 0, -hingeZ]}>
          <group position={[0, 0, hingeZ]}>
            {/* inner nacre (now angled, facing inward) */}
            <mesh geometry={valveGeo} castShadow receiveShadow>
              <meshPhysicalMaterial
                map={innerTex}
                color={shellColor}
                roughness={0.2}
                metalness={0.15}
                clearcoat={0.6}
                clearcoatRoughness={0.15}
                sheen={0.4}
                sheenColor={new THREE.Color('#FFE4D6')}
                side={THREE.FrontSide}
              />
            </mesh>
            {/* outer surface */}
            <mesh geometry={valveGeo} castShadow receiveShadow>
              <meshPhysicalMaterial
                map={outerTex}
                color={outerColor}
                roughness={0.55}
                metalness={0.05}
                side={THREE.BackSide}
              />
            </mesh>
          </group>
        </group>
      </group>

      {/* ── PEARL — smooth iridescent sphere ── */}
      <mesh position={[0, pearlOffY, 0]} castShadow>
        <sphereGeometry args={[pearlSize, 32, 24]} />
        <meshPhysicalMaterial
          map={pearlTex}
          color={pearlColor}
          roughness={0.12}
          metalness={0.25}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          sheen={0.8}
          sheenColor={new THREE.Color('#FFF0E8')}
          emissive={new THREE.Color('#F5E6D3')}
          emissiveIntensity={0.08}
          iridescence={0.3}
          iridescenceIOR={1.8}
        />
      </mesh>

      {/* ── Pearl highlight glow (subtle light catch) ── */}
      <mesh position={[pearlSize * 0.25, pearlOffY + pearlSize * 0.35, pearlSize * 0.2]}>
        <sphereGeometry args={[pearlSize * 0.15, 8, 6]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.15} />
      </mesh>

      {/* ── Hinge nub — where the two valves connect ── */}
      <mesh position={[0, 0.03, hingeZ]} castShadow>
        <sphereGeometry args={[0.035, 8, 6]} />
        <meshStandardMaterial
          color={outerColor}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>
    </group>
  )
}

/* ─────────────── coral type registry ─────────────── */
const CORAL_TYPES = [BranchingCoral, BrainCoral, TubeCoral, FanCoral, RockCoral, ShellCoral]

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
