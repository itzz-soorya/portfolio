import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Underwater lighting rig that follows the camera as it travels forward.
 * Lights stay relative to camera position so the seabed is always illuminated.
 */
export default function UnderwaterLighting() {
  const sunRef = useRef()
  const accentRef = useRef()
  const spotRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const camZ = state.camera.position.z

    // Sun follows with camera, slight sway
    if (sunRef.current) {
      sunRef.current.position.set(
        5 + Math.sin(t * 0.15) * 2,
        15,
        camZ - 5 + Math.cos(t * 0.1) * 2
      )
      // Point the shadow camera at camera's forward area
      sunRef.current.target.position.set(0, 0, camZ - 10)
      sunRef.current.target.updateMatrixWorld()
    }

    // Accent light follows overhead
    if (accentRef.current) {
      accentRef.current.position.set(0, 10, camZ - 5)
      accentRef.current.intensity = 0.6 + Math.sin(t * 0.3) * 0.1
    }

    // Spot follows for god-ray effect
    if (spotRef.current) {
      spotRef.current.position.set(0, 18, camZ - 3)
    }
  })

  return (
    <>
      {/* Primary sunlight — follows camera */}
      <directionalLight
        ref={sunRef}
        position={[5, 15, -5]}
        intensity={3.0}
        color={new THREE.Color(0.7, 0.85, 1.0)}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />

      {/* Ambient fill — constant blue tone */}
      <ambientLight
        intensity={0.6}
        color={new THREE.Color(0.15, 0.3, 0.5)}
      />

      {/* Hemisphere: blue sky, dark ground */}
      <hemisphereLight
        args={[
          new THREE.Color(0.3, 0.5, 0.7),
          new THREE.Color(0.05, 0.08, 0.12),
          0.8,
        ]}
      />

      {/* Pulsing accent — follows camera overhead */}
      <pointLight
        ref={accentRef}
        position={[0, 10, 0]}
        intensity={0.6}
        color={new THREE.Color(0.4, 0.65, 0.85)}
        distance={40}
        decay={1.5}
      />

      {/* God-ray spot — follows camera */}
      <spotLight
        ref={spotRef}
        position={[0, 18, 0]}
        angle={Math.PI / 3}
        penumbra={1}
        intensity={2.0}
        color={new THREE.Color(0.4, 0.6, 0.8)}
        distance={50}
        decay={1.5}
        castShadow={false}
      />

      {/* Underwater exponential fog — realistic depth fade */}
      <fogExp2 attach="fog" args={['#062a3e', 0.018]} />
    </>
  )
}
