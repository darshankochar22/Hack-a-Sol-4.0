"use client"

import React, { useRef, useEffect, useMemo, useState, ErrorInfo, Component } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { Environment, PerspectiveCamera, OrbitControls, Grid } from "@react-three/drei"
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader"
import { Group, Vector3, AxesHelper } from "three"
import { Suspense } from "react"

// Error Boundary for 3D component
class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("3D Visualization Error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center h-full text-red-400 text-sm">
            <div className="text-center">
              <p>Error loading 3D model</p>
              <p className="text-xs text-gray-500 mt-2">{this.state.error?.message}</p>
            </div>
          </div>
        )
      )
    }
    return this.props.children
  }
}

function CarModel({ speed, rpm, throttle, carModelPath }: { speed: number; rpm: number; throttle: number; carModelPath: string }) {
  const carRef = useRef<Group>(null)
  
  useEffect(() => {
    console.log("CarModel: Loading model from:", carModelPath)
  }, [carModelPath])
  
  const gltf = useLoader(GLTFLoader, carModelPath) as GLTF

  // Create car scene
  const carScene = useMemo(() => {
    if (!gltf || !gltf.scene) {
      console.error("Invalid GLTF scene loaded", gltf)
      return null
    }
    console.log("CarModel: GLTF loaded successfully", gltf.scene)
    const cloned = gltf.scene.clone()
    cloned.scale.set(8.0, 8.0, 8.0)
    // Position the car so its bottom is at y=0 (fixed bottom)
    cloned.position.set(0, 0, 0)
    return cloned
  }, [gltf])

  useFrame((state) => {
    if (carRef.current) {
      // Subtle rotation animation based on speed (optional, can be removed)
      const speedRotation = (speed / 380) * 0.001
      carRef.current.rotation.y += speedRotation
      
      // Keep position fixed - no floating or movement
      carRef.current.position.set(0, 0, 0)
      
      // Subtle scale pulse based on throttle (optional)
      const throttleScale = 1 + (throttle / 100) * 0.02
      carRef.current.scale.setScalar(8.0 * throttleScale)
    }
  })

  if (!carScene) {
    return (
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
    )
  }

  return (
    <group ref={carRef} position={[0, 0, 0]}>
      <primitive object={carScene} />
    </group>
  )
}

function Scene({ speed, rpm, throttle, carModelPath }: { speed: number; rpm: number; throttle: number; carModelPath: string }) {
  const axesHelper = useMemo(() => new AxesHelper(2), [])
  
  return (
    <>
      <OrbitControls 
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={15}
        maxPolarAngle={Math.PI / 1.5}
        minPolarAngle={0}
        target={[0, 0, 0]}
      />
      {/* Fixed axes helper - visible reference */}
      <primitive object={axesHelper} />
      {/* Grid floor to show ground plane */}
      <Grid 
        args={[20, 20]} 
        cellColor="#ff0000" 
        sectionColor="#ff0000" 
        cellThickness={0.5}
        sectionThickness={1}
        fadeDistance={25}
        fadeStrength={1}
        position={[0, 0, 0]}
      />
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.2} color="#ff0000" />
      <pointLight position={[-10, 10, -10]} intensity={0.8} color="#ffffff" />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#ffffff" />
      <spotLight
        position={[5, 8, 5]}
        angle={0.6}
        penumbra={0.5}
        intensity={1.5}
        castShadow
        color="#ff4444"
      />
      <Environment preset="night" />
      <CarModel speed={speed} rpm={rpm} throttle={throttle} carModelPath={carModelPath} />
    </>
  )
}

export default function F1Car3DVisualization({ 
  speed, 
  rpm, 
  throttle,
  carModelPath 
}: { 
  speed: number
  rpm: number
  throttle: number
  carModelPath: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verify the file exists
    fetch(carModelPath, { method: 'HEAD' })
      .then((response) => {
        if (!response.ok) {
          setError(`Model file not found: ${carModelPath}`)
        }
        setIsLoading(false)
      })
      .catch((err) => {
        console.error("Error checking model file:", err)
        setError(`Failed to load model: ${carModelPath}`)
        setIsLoading(false)
      })
  }, [carModelPath])

  if (error) {
    return (
      <div className="w-full h-96 bg-black/40 border border-red-500/30 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center text-red-400 p-4">
          <p className="text-sm mb-2">Error loading 3D model</p>
          <p className="text-xs text-gray-400">{error}</p>
          <p className="text-xs text-gray-500 mt-2">Path: {carModelPath}</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    console.log("Loading 3D model from path:", carModelPath)
  }, [carModelPath])

  return (
    <div className="w-full h-96 bg-black/40 border border-red-500/30 rounded-lg overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="text-white text-sm">Loading 3D model...</div>
        </div>
      )}
      <ErrorBoundary
        fallback={
          <div className="flex items-center justify-center h-full text-red-400 text-sm">
            <div className="text-center p-4">
              <p className="mb-2">Failed to load 3D model</p>
              <p className="text-xs text-gray-500">Path: {carModelPath}</p>
              <p className="text-xs text-gray-400 mt-2">Check browser console for details</p>
            </div>
          </div>
        }
      >
        <Canvas 
          gl={{ antialias: true, alpha: true }} 
          onCreated={() => {
            console.log("Canvas created successfully")
            setIsLoading(false)
          }}
          camera={{ position: [5, 3, 5], fov: 50 }}
        >
          <Suspense 
            fallback={
              <>
                <ambientLight intensity={0.5} />
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="#333" wireframe />
                </mesh>
              </>
            }
          >
            <Scene speed={speed} rpm={rpm} throttle={throttle} carModelPath={carModelPath} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}

