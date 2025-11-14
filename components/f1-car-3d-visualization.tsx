"use client"

import { useRef, useEffect } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { Environment, PerspectiveCamera, OrbitControls } from "@react-three/drei"
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader"
import { Group, Vector3 } from "three"
import { Suspense } from "react"

function CarModel({ speed, rpm, throttle }: { speed: number; rpm: number; throttle: number }) {
  const carRef = useRef<Group>(null)
  const gltf = useLoader(GLTFLoader, "/car_3d/scene.gltf") as GLTF

  // Create car scene
  const carScene = gltf.scene.clone()
  carScene.scale.set(8.0, 8.0, 8.0)
  carScene.position.set(0, -0.2, 0)

  useFrame((state) => {
    if (carRef.current) {
      // Floating animation based on RPM
      const time = state.clock.getElapsedTime()
      const rpmFactor = rpm / 15000
      const baseY = Math.sin(time * 0.5) * 0.1 * (1 + rpmFactor)
      
      // Rotation based on speed
      const speedRotation = (speed / 380) * Math.PI * 0.1
      carRef.current.rotation.y += speedRotation * 0.01
      
      // Position animation
      carRef.current.position.y = baseY
      carRef.current.position.x = Math.sin(time * 0.3) * 0.05
      
      // Scale based on throttle
      const throttleScale = 1 + (throttle / 100) * 0.1
      carRef.current.scale.setScalar(8.0 * throttleScale)
    }
  })

  return (
    <group ref={carRef}>
      <primitive object={carScene} />
    </group>
  )
}

function Scene({ speed, rpm, throttle }: { speed: number; rpm: number; throttle: number }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[3, 2, 5]} fov={50} />
      <OrbitControls 
        enableZoom={true}
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
      />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ff0000" />
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#ffffff" />
      <spotLight
        position={[5, 5, 5]}
        angle={0.5}
        penumbra={0.5}
        intensity={1}
        castShadow
        color="#ff4444"
      />
      <Environment preset="night" />
      <CarModel speed={speed} rpm={rpm} throttle={throttle} />
    </>
  )
}

export default function F1Car3DVisualization({ 
  speed, 
  rpm, 
  throttle 
}: { 
  speed: number
  rpm: number
  throttle: number
}) {
  return (
    <div className="w-full h-96 bg-black/40 border border-red-500/30 rounded-lg overflow-hidden">
      <Canvas gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <Scene speed={speed} rpm={rpm} throttle={throttle} />
        </Suspense>
      </Canvas>
    </div>
  )
}

