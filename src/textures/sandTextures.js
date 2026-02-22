import * as THREE from 'three'

/**
 * Procedurally generates realistic sand textures entirely on the GPU-side
 * using canvas-based baking. No external image files required.
 */

function createCanvasTexture(width, height, drawFn) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  drawFn(ctx, width, height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(6, 6)
  return texture
}

// Seeded pseudo-random for deterministic textures
function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

/**
 * Generates a sandy color map — warm beige with grain variation
 */
export function generateSandColorMap(size = 512) {
  return createCanvasTexture(size, size, (ctx, w, h) => {
    // Base sand gradient — warm golden sand, underwater-suitable brightness
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7)
    gradient.addColorStop(0, '#c4a06a')   // warm golden center
    gradient.addColorStop(0.4, '#b89058') // mid sand
    gradient.addColorStop(0.8, '#a88050') // slightly darker
    gradient.addColorStop(1, '#987045')   // edge
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    // Add grain particles
    const rand = seededRandom(42)
    const imageData = ctx.getImageData(0, 0, w, h)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const noise = (rand() - 0.5) * 30
      // Warm sand tones with subtle variation
      data[i] = Math.min(220, Math.max(0, data[i] + noise))         // R
      data[i + 1] = Math.min(190, Math.max(0, data[i + 1] + noise * 0.8)) // G
      data[i + 2] = Math.min(150, Math.max(0, data[i + 2] + noise * 0.5)) // B
    }

    ctx.putImageData(imageData, 0, 0)

    // Darken scattered spots (small pebbles / darker grains)
    for (let i = 0; i < 3000; i++) {
      const x = rand() * w
      const y = rand() * h
      const r = rand() * 2 + 0.5
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(60, 45, 25, ${rand() * 0.35})`
      ctx.fill()
    }

    // Lighter highlight grains (kept subtle, not bright white)
    for (let i = 0; i < 1500; i++) {
      const x = rand() * w
      const y = rand() * h
      const r = rand() * 1.5 + 0.3
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(210, 185, 140, ${rand() * 0.2})`
      ctx.fill()
    }
  })
}

/**
 * Generates a normal map for sand surface bumpiness
 */
export function generateSandNormalMap(size = 512) {
  return createCanvasTexture(size, size, (ctx, w, h) => {
    // Base normal (pointing up: RGB = 128, 128, 255)
    ctx.fillStyle = '#8080ff'
    ctx.fillRect(0, 0, w, h)

    const rand = seededRandom(123)
    const imageData = ctx.getImageData(0, 0, w, h)
    const data = imageData.data

    // Add fine-grain bump noise
    for (let i = 0; i < data.length; i += 4) {
      const nx = (rand() - 0.5) * 30  // slight x perturbation
      const ny = (rand() - 0.5) * 30  // slight y perturbation
      data[i] = Math.min(255, Math.max(0, 128 + nx))
      data[i + 1] = Math.min(255, Math.max(0, 128 + ny))
      // Z stays high (mostly upward-facing)
      data[i + 2] = Math.min(255, Math.max(200, 255 - Math.abs(nx) - Math.abs(ny)))
    }

    ctx.putImageData(imageData, 0, 0)

    // Add larger ripple patterns (sand ripples from current)
    for (let i = 0; i < 60; i++) {
      const y = rand() * h
      const amplitude = rand() * 3 + 1
      ctx.beginPath()
      ctx.moveTo(0, y)
      for (let x = 0; x < w; x += 4) {
        const wave = Math.sin(x * 0.03 + rand() * 2) * amplitude
        ctx.lineTo(x, y + wave)
      }
      ctx.strokeStyle = `rgba(140, 140, 255, ${rand() * 0.15 + 0.05})`
      ctx.lineWidth = rand() * 3 + 1
      ctx.stroke()
    }
  })
}

/**
 * Generates a roughness map — sand is mostly rough with some smoother patches
 */
export function generateSandRoughnessMap(size = 512) {
  return createCanvasTexture(size, size, (ctx, w, h) => {
    // High roughness base (lighter = rougher in StandardMaterial)
    ctx.fillStyle = '#cccccc'
    ctx.fillRect(0, 0, w, h)

    const rand = seededRandom(789)
    const imageData = ctx.getImageData(0, 0, w, h)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const noise = (rand() - 0.5) * 60
      const val = Math.min(255, Math.max(120, 200 + noise))
      data[i] = val
      data[i + 1] = val
      data[i + 2] = val
    }

    ctx.putImageData(imageData, 0, 0)

    // Add smoother wet patches
    for (let i = 0; i < 20; i++) {
      const x = rand() * w
      const y = rand() * h
      const r = rand() * 40 + 20
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
      grad.addColorStop(0, `rgba(80, 80, 80, 0.3)`)
      grad.addColorStop(1, `rgba(80, 80, 80, 0)`)
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()
    }
  })
}

/**
 * Displacement heightmap for sand undulations
 */
export function generateSandDisplacementMap(size = 512) {
  return createCanvasTexture(size, size, (ctx, w, h) => {
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, w, h)

    const rand = seededRandom(456)

    // Broad dune shapes
    for (let i = 0; i < 12; i++) {
      const cx = rand() * w
      const cy = rand() * h
      const rx = rand() * 200 + 100
      const ry = rand() * 200 + 100
      const brightness = Math.floor(128 + (rand() - 0.5) * 60)
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry))
      grad.addColorStop(0, `rgb(${brightness}, ${brightness}, ${brightness})`)
      grad.addColorStop(1, 'rgba(128, 128, 128, 0)')
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, rand() * Math.PI, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()
    }

    // Fine noise ripples
    const imageData = ctx.getImageData(0, 0, w, h)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const noise = (rand() - 0.5) * 20
      const val = Math.min(255, Math.max(0, data[i] + noise))
      data[i] = val
      data[i + 1] = val
      data[i + 2] = val
    }
    ctx.putImageData(imageData, 0, 0)
  })
}
