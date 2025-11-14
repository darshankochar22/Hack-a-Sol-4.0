"use client"

import { useRef, useEffect, useState } from "react"
import * as THREE from "three"
import { motion } from "framer-motion"

interface RacerGirl3DProps {
  modelPath?: string
}

export default function RacerGirl3D({ modelPath = "/racer-girl.glb" }: RacerGirl3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const animationIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight || 400

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.set(0, 1.5, 5)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight1 = new THREE.DirectionalLight(0xff0000, 0.8)
    directionalLight1.position.set(5, 5, 5)
    directionalLight1.castShadow = true
    scene.add(directionalLight1)

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4)
    directionalLight2.position.set(-5, 3, -5)
    scene.add(directionalLight2)

    // Point light for accent
    const pointLight = new THREE.PointLight(0xff0000, 0.5, 10)
    pointLight.position.set(0, 2, 3)
    scene.add(pointLight)

    // Process and add model to scene
    const processModel = (model: THREE.Group) => {
      // Center and scale the model
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())

      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = 2.5 / maxDim
      model.scale.multiplyScalar(scale)

      model.position.x = -center.x * scale
      model.position.y = -center.y * scale
      model.position.z = -center.z * scale

      // Enable shadows and enhance materials
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true

          // Enhance material properties for better visuals
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.metalness = 0.5
            child.material.roughness = 0.3
          } else if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.metalness = 0.5
                mat.roughness = 0.3
              }
            })
          }
        }
      })

      scene.add(model)
      modelRef.current = model
      setIsLoaded(true)
    }

    // Load GLTF/GLB or FBX model
    const loadModel = async () => {
      try {
        const isFBX = modelPath.toLowerCase().endsWith('.fbx')

        if (isFBX) {
          // Load FBX file
          try {
            const { FBXLoader } = await import("three/examples/jsm/loaders/FBXLoader.js")
            const loader = new FBXLoader()
            
            loader.load(
              modelPath,
              (fbx) => {
                processModel(fbx)
              },
              (progress) => {
                if (progress.total) {
                  const percentComplete = (progress.loaded / progress.total) * 100
                  console.log(`FBX Model loading: ${percentComplete.toFixed(2)}%`)
                }
              },
              (error) => {
                console.error("Error loading FBX model:", error)
                setError("Failed to load FBX model. Converting to GLB/GLTF is recommended.")
              }
            )
          } catch (fbxErr) {
            console.error("FBXLoader not available:", fbxErr)
            setError("FBX loader not available. Please convert model to GLB/GLTF format or ensure FBXLoader is available.")
          }
        } else {
          // Load GLTF/GLB file
          const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js")
          const loader = new GLTFLoader()

          loader.load(
            modelPath,
            (gltf) => {
              processModel(gltf.scene)
            },
            (progress) => {
              if (progress.total) {
                const percentComplete = (progress.loaded / progress.total) * 100
                console.log(`GLTF Model loading: ${percentComplete.toFixed(2)}%`)
              }
            },
            (error) => {
              console.error("Error loading GLTF model:", error)
              setError("Failed to load 3D model. Please ensure the model file exists at: " + modelPath)
            }
          )
        }
      } catch (err) {
        console.error("Error loading model:", err)
        setError("3D model loader error: " + (err instanceof Error ? err.message : "Unknown error"))
      }
    }

    loadModel()

    // Animation loop
    const animate = () => {
      if (modelRef.current) {
        // Rotate model slowly
        modelRef.current.rotation.y += 0.005

        // Gentle floating animation
        modelRef.current.position.y += Math.sin(Date.now() * 0.001) * 0.0005
      }

      // Rotate point light
      if (pointLight) {
        pointLight.position.x = Math.sin(Date.now() * 0.001) * 2
        pointLight.position.z = Math.cos(Date.now() * 0.001) * 2 + 3
      }

      renderer.render(scene, camera)
      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return

      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight || 400

      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [modelPath])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900/50 rounded-lg border border-red-500/30">
        <p className="text-red-400 text-sm text-center px-4">{error}</p>
      </div>
    )
  }

  return (
    <motion.div
      ref={containerRef}
      className="w-full h-full min-h-[400px] relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isLoaded ? 1 : 0.5, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-red-400 text-xs">Loading 3D Model...</p>
          </div>
        </div>
      )}
    </motion.div>
  )
}

