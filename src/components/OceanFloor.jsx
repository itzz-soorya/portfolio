import { useRef, useMemo } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import * as THREE from 'three'
import {
  generateSandColorMap,
  generateSandNormalMap,
  generateSandRoughnessMap,
} from '../textures/sandTextures'

/**
 * Custom ShaderMaterial for the ocean floor — sand textures + animated caustics.
 * Uses world-space UV tiling so the huge plane looks detailed everywhere.
 */
class OceanFloorMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uTime: { value: 0 },
        uColorMap: { value: null },
        uNormalMap: { value: null },
        uRoughnessMap: { value: null },
        uSunDirection: { value: new THREE.Vector3(0.2, 0.9, -0.3).normalize() },
        uSunColor: { value: new THREE.Color(0.6, 0.7, 0.85) },
        uSunIntensity: { value: 1.6 },
        uAmbientColor: { value: new THREE.Color(0.12, 0.18, 0.28) },
        uFogColor: { value: new THREE.Color('#062a3e') },
        uFogNear: { value: 10.0 },
        uFogFar: { value: 60.0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        varying float vElevation;

        void main() {
          vUv = uv;

          vec3 pos = position;

          // World-space coordinates for displacement
          vec4 wp = modelMatrix * vec4(pos, 1.0);
          float wx = wp.x;
          float wz = wp.z;

          // Sand dunes & ripples
          float dune1 = sin(wx * 0.15) * cos(wz * 0.12) * 0.3;
          float dune2 = sin(wx * 0.4 + 1.0) * cos(wz * 0.3 + 0.5) * 0.15;
          float ripple = sin(wx * 1.5 + wz * 1.0) * 0.04;
          float fine   = sin(wx * 4.0) * cos(wz * 3.5) * 0.015;

          float elevation = dune1 + dune2 + ripple + fine;
          pos.z += elevation;  // plane is rotated -PI/2, so z is "up"
          vElevation = elevation;

          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPos.xyz;
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);

          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform sampler2D uColorMap;
        uniform sampler2D uNormalMap;
        uniform sampler2D uRoughnessMap;
        uniform vec3 uSunDirection;
        uniform vec3 uSunColor;
        uniform float uSunIntensity;
        uniform vec3 uAmbientColor;
        uniform vec3 uFogColor;
        uniform float uFogNear;
        uniform float uFogFar;

        varying vec2 vUv;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        varying float vElevation;

        float causticPattern(vec2 uv, float time) {
          float c1 = sin(uv.x * 3.5 + time * 0.4) * cos(uv.y * 2.8 - time * 0.3);
          float c2 = sin(uv.x * 2.2 - time * 0.5 + 1.5) * cos(uv.y * 3.8 + time * 0.35);
          float c3 = sin((uv.x + uv.y) * 2.5 + time * 0.25);
          float c4 = cos(uv.x * 1.8 - uv.y * 2.2 + time * 0.45);
          return pow(abs(c1 + c2 + c3 + c4) * 0.25, 1.8);
        }

        void main() {
          // World-space UV tiling
          vec2 tiledUv = vWorldPosition.xz * 0.08;

          vec3 sandColor = texture2D(uColorMap, tiledUv).rgb;
          sandColor *= 0.8;

          vec3 nDetail = texture2D(uNormalMap, tiledUv).rgb * 2.0 - 1.0;
          vec3 N = normalize(vWorldNormal + nDetail * 0.35);

          float NdotL = max(dot(N, uSunDirection), 0.0);
          vec3 diffuse = sandColor * uSunColor * NdotL * uSunIntensity;
          vec3 ambient = sandColor * uAmbientColor * 1.2;

          float heightBoost = smoothstep(-0.3, 0.5, vElevation) * 0.15;

          vec2 cUv = vWorldPosition.xz * 0.12;
          float caustics  = causticPattern(cUv, uTime);
          float caustics2 = causticPattern(cUv * 1.3 + 0.5, uTime * 0.8);
          float causticsTotal = (caustics + caustics2 * 0.5) * 0.4;
          vec3 causticsColor = uSunColor * causticsTotal * sandColor;

          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          vec3 halfDir = normalize(uSunDirection + viewDir);
          float spec = pow(max(dot(N, halfDir), 0.0), 64.0) * 0.08;

          vec3 color = diffuse + ambient + causticsColor + heightBoost;
          color += uSunColor * spec;

          color = mix(color, color * vec3(0.75, 0.85, 0.95), 0.2);

          float dist = length(vWorldPosition - cameraPosition);
          float fogFactor = smoothstep(uFogNear, uFogFar, dist);
          color = mix(color, uFogColor, fogFactor);

          color = clamp(color, 0.0, 1.0);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    })
  }
}

extend({ OceanFloorMaterial })

// One large plane — wide enough for ±20 camera sweep
const PLANE_WIDTH = 300
const PLANE_LENGTH = 200
const PLANE_SEGMENTS = 200

/**
 * OceanFloor — single large sand plane centered at z=-220 (covers 0 to -440).
 * Camera travels from z=0 to z=-440, so it always has sand.
 */
export default function OceanFloor() {
  const matRef = useRef()

  const textures = useMemo(() => ({
    color: generateSandColorMap(1024),
    normal: generateSandNormalMap(1024),
    roughness: generateSandRoughnessMap(512),
  }), [])

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime
      if (!matRef.current.uniforms.uColorMap.value) {
        matRef.current.uniforms.uColorMap.value = textures.color
        matRef.current.uniforms.uNormalMap.value = textures.normal
        matRef.current.uniforms.uRoughnessMap.value = textures.roughness
      }
    }
  })

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -2, -PLANE_LENGTH / 2 + 20]}
      receiveShadow
    >
      <planeGeometry args={[PLANE_WIDTH, PLANE_LENGTH, PLANE_SEGMENTS, PLANE_SEGMENTS]} />
      <oceanFloorMaterial ref={matRef} />
    </mesh>
  )
}
