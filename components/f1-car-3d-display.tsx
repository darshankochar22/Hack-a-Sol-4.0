"use client"

import { useEffect, useRef, useState } from "react"
import { useScroll, useTransform, MotionValue } from "framer-motion"
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber"
import { Environment, PerspectiveCamera } from "@react-three/drei"
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader"
import { Group, Vector3 as ThreeVector3 } from "three"
import { Suspense } from "react"

// Hook to use scroll progress in three.js
function useScrollProgress(scrollYProgress: MotionValue<number>) {
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      setProgress(latest)
    })
    return () => unsubscribe()
  }, [scrollYProgress])
  
  return progress
}

function CarModel({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const carRef = useRef<Group>(null)
  const gltf = useLoader(GLTFLoader, "/car_3d/scene.gltf") as GLTF
  const progress = useScrollProgress(scrollYProgress)

  // Create car scene
  const carScene = gltf.scene.clone()
  carScene.scale.set(8.0, 8.0, 8.0)
  carScene.position.set(0, -0.2, 0)

  useFrame((state) => {
    if (carRef.current) {
      // Floating animation based on time
      const time = state.clock.getElapsedTime()
      const baseY = Math.sin(time * 0.5) * 0.1
      
      // Scroll-based movement
      const scrollY = progress * 0.3
      const scrollRotation = progress * Math.PI * 0.5
      
      carRef.current.position.y = baseY + scrollY
      carRef.current.rotation.y = scrollRotation
      
      // Subtle side-to-side movement
      carRef.current.position.x = Math.sin(time * 0.3) * 0.05
    }
  })

  return (
    <group ref={carRef}>
      <primitive object={carScene} />
    </group>
  )
}

export default function F1Car3DDisplay() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  return (
    <div 
      ref={containerRef}
      className="w-full h-full min-h-[600px] bg-black/40 rounded-sm border border-red-500/20 overflow-hidden"
    >
      <Canvas
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 2, 5], fov: 45 }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Environment files="/r3f/textures/envmap.hdr" background />
          <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={45} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <pointLight position={[-5, 2, -5]} intensity={0.5} color="#ff0000" />
          <CarModel scrollYProgress={scrollYProgress} />
        </Suspense>
      </Canvas>
    </div>
  )
}

