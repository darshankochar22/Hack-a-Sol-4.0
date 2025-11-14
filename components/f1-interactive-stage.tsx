// "use client"

// import React, { Suspense, useEffect, useMemo, useRef, useState } from "react"
// import { Canvas, useFrame, useLoader } from "@react-three/fiber"
// import { Environment, MeshReflectorMaterial, OrbitControls, PerspectiveCamera } from "@react-three/drei"
// import { Physics, useBox, usePlane, useTrimesh } from "@react-three/cannon"
// import { BufferAttribute, CatmullRomCurve3, Quaternion, TextureLoader, Vector3, Mesh, type Group, type PerspectiveCamera as ThreePerspectiveCamera } from "three"
// import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader"

// const ASSET_BASE = "/r3f"
// const MODEL_BASE = `${ASSET_BASE}/models`
// const TEXTURE_BASE = `${ASSET_BASE}/textures`

// type StageProps = {
//   raceStarted: boolean
//   onRaceEnd?: () => void
// }

// export default function F1InteractiveStage({ raceStarted, onRaceEnd }: StageProps) {
//   return (
//     <div className="relative h-screen min-h-[720px] w-full overflow-hidden bg-[#030304]">
//       <Canvas
//         gl={{ antialias: true }}
//         camera={{ position: [-6, 3.9, 6.21], fov: 40 }}
//         dpr={[1, 2]}
//       >
//         <color attach="background" args={["#040309"]} />
//         <Suspense fallback={null}>
//           <Physics broadphase="SAP" gravity={[0, -2.6, 0]}>
//             <Scene raceStarted={raceStarted} onRaceEnd={onRaceEnd} />
//           </Physics>
//         </Suspense>
//       </Canvas>
//       <div className="pointer-events-none absolute inset-x-0 top-20 flex justify-center">
//         <div className="rounded-full border border-white/10 bg-black/40 px-6 py-2 text-xs tracking-[0.5em] text-white/70 backdrop-blur">
//           TOUCH & DRAG THE GRID
//         </div>
//       </div>
//       <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-[#05030a] to-background" />
//     </div>
//   )
// }

// function Scene({ raceStarted, onRaceEnd }: StageProps) {
//   const cameraRef = useRef<ThreePerspectiveCamera>(null)
//   const controlsRef = useRef<any>(null)

//   return (
//     <>
//       <Environment files={`${TEXTURE_BASE}/envmap.hdr`} background />
//       <PerspectiveCamera makeDefault ref={cameraRef} position={[-6, 3.9, 6.21]} fov={40} />
//       <OrbitControls
//         ref={controlsRef}
//         target={[-2.64, -0.71, 0.03]}
//         enablePan={false}
//         maxDistance={12}
//         enableDamping
//         dampingFactor={0.05}
//         enabled={!raceStarted}
//       />
//       <Track />
//       <Ground />
//       <Car raceStarted={raceStarted} onRaceEnd={onRaceEnd} cameraRef={cameraRef} controlsRef={controlsRef} />
//     </>
//   )
// }

// type CarProps = {
//   raceStarted: boolean
//   onRaceEnd?: () => void
//   cameraRef: React.RefObject<ThreePerspectiveCamera>
//   controlsRef: React.RefObject<any>
// }

// function Car({ raceStarted, onRaceEnd, cameraRef, controlsRef }: CarProps) {
//   const gltf = useLoader(GLTFLoader, "/car_3d/scene.gltf") as GLTF
//   const carRef = useRef<Group>(null)

//   const carScene = useMemo(() => {
//     const cloned = gltf.scene.clone()
//     // Dramatically increased scale - from 0.01 to 8.0 for maximum visibility
//     // This is an 800x increase from the original scale
//     cloned.scale.set(8.0, 8.0, 8.0)
//     // Adjusted Y position to account for larger scale - car should sit on track
//     // Track is at Y=0, so we need to adjust based on car's bottom pivot
//     cloned.position.set(0, -0.2, 0)
//     return cloned
//   }, [gltf])

//   // Precise path traced from track collider positions
//   // Following the black track centerline based on actual collider layout
//   const pathPoints = useMemo(
//     () =>
//       [
//         // START/FINISH LINE - Pit area between colliders [-1.85, 0, 0.385] and [-1.85, 0, -0.385]
//         // Center point: X=-2.065 (between -1.85 and -2.28 colliders), Z=0
//         [-2.065, 0.35, 0.0],
        
//         // Turn 1 - Exit pit area, entering first turn
//         // Between colliders [-0.83, 0, 3.2] and [0.41, 0, 2]
//         [-1.4, 0.35, 0.6],
//         [-0.8, 0.35, 1.4],
//         [-0.4, 0.35, 2.2],
//         [-0.21, 0.35, 2.6], // Midpoint between colliders
        
//         // Straight section - between [0.41, 0, 2] and [1.75, 0, 0.5]
//         [0.35, 0.35, 2.3],
//         [1.08, 0.35, 1.75],
//         [1.7, 0.35, 1.0],
        
//         // Turn 2 - Entry near collider [2.5, 0, -1.4]
//         [2.0, 0.35, 0.3],
//         [2.25, 0.35, -0.45],
//         [2.35, 0.35, -1.0],
        
//         // Back straight - towards [0.6, 0, -3.8]
//         [2.15, 0.35, -1.9],
//         [1.675, 0.35, -2.85], // Midpoint: (1.75+0.6)/2 = 1.175, but adjusted for curve
//         [1.1, 0.35, -3.5],
//         [0.6, 0.35, -3.8],
        
//         // Turn 3 - Tight section near [-1.95, 0, -5.18]
//         [0.0, 0.35, -4.4],
//         [-0.975, 0.35, -4.99], // Midpoint before collider
//         [-1.95, 0.35, -5.18],
        
//         // Turn 4 - Long sweeper towards [-5.55, 0, -3.05]
//         [-3.25, 0.35, -4.7],
//         [-4.4, 0.35, -4.0],
//         [-4.975, 0.35, -3.4],
//         [-5.55, 0.35, -3.05],
        
//         // Turn 5 - Section near [-4.4, 0, -1.77] and [-7.03, 0, -0.76]
//         [-5.7, 0.35, -2.5],
//         [-6.25, 0.35, -1.6],
//         [-6.515, 0.35, -1.265], // Between colliders
//         [-6.7, 0.35, -0.76],
        
//         // Turn 6 - Final section leading to finish
//         // Between colliders [-4.75, 0, 2.73] and [-3.05, 0, 3.4]
//         [-6.4, 0.35, 0.0],
//         [-6.0, 0.35, 0.8],
//         [-5.4, 0.35, 1.6],
//         [-5.0, 0.35, 2.365], // Midpoint: (-4.75 + -5.25)/2 = -5.0, Z: (2.73 + 2.0)/2 = 2.365
//         [-4.4, 0.35, 3.065], // Midpoint: (-4.75 + -4.05)/2 = -4.4, Z: (2.73 + 3.4)/2 = 3.065
//         [-3.9, 0.35, 3.065],
//         [-3.05, 0.35, 3.4],
        
//         // Final turn - Return to start/finish
//         [-2.5, 0.35, 2.9],
//         [-2.3, 0.35, 1.8],
//         [-2.2, 0.35, 0.9],
//         [-2.15, 0.35, 0.4],
        
//         // Return to START/FINISH LINE (close the loop)
//         [-2.065, 0.35, 0.0],
//       ].map(([x, y, z]) => new Vector3(x, y, z)),
//     [],
//   )

//   const curve = useMemo(() => new CatmullRomCurve3(pathPoints, true, "catmullrom", 0.5), [pathPoints])
//   const forward = useMemo(() => new Vector3(0, 0, 1), [])
//   const tangent = useMemo(() => new Vector3(), [])
//   const targetQuat = useMemo(() => new Quaternion(), [])

//   const progressRef = useRef(0)
//   const activeRef = useRef(false)
//   const duration = 30 // seconds per lap - slow movement for smooth viewing
//   const simulationStartTimeRef = useRef<number | null>(null)
//   const cameraTargetPosRef = useRef<Vector3>(new Vector3())
//   const cameraTargetLookRef = useRef<Vector3>(new Vector3())
  
//   // Camera animation state
//   const cameraStateRef = useRef<'intro' | 'following' | 'side' | 'aerial' | 'finish'>('intro')
//   const cameraTransitionTimeRef = useRef(0)

//   useEffect(() => {
//     if (raceStarted) {
//       progressRef.current = 0
//       activeRef.current = true
//       simulationStartTimeRef.current = null
//       cameraStateRef.current = 'intro'
//       cameraTransitionTimeRef.current = 0
      
//       if (carRef.current) {
//         const startPoint = curve.getPointAt(0)
//         carRef.current.position.copy(startPoint)
//         // Reset car rotation to face the track direction
//         const initialDir = curve.getTangentAt(0, tangent).normalize()
//         targetQuat.setFromUnitVectors(forward, initialDir)
//         carRef.current.quaternion.copy(targetQuat)
//       }
      
//       // Initialize camera targets for smooth start
//       if (cameraRef.current && carRef.current) {
//         const startPoint = curve.getPointAt(0)
//         const startPos = new Vector3(startPoint.x - 7, startPoint.y + 6, startPoint.z + 7)
//         cameraTargetPosRef.current.copy(startPos)
//         cameraRef.current.position.copy(startPos)
//         cameraTargetLookRef.current.copy(new Vector3(startPoint.x, startPoint.y + 1.0, startPoint.z))
//       }
      
//       // Disable orbit controls during race
//       if (controlsRef.current) {
//         controlsRef.current.enabled = false
//       }
//     } else {
//       activeRef.current = false
//       simulationStartTimeRef.current = null
      
//       if (carRef.current) {
//         const startPoint = curve.getPointAt(0)
//         carRef.current.position.copy(startPoint)
//       }
      
//       // Re-enable orbit controls
//       if (controlsRef.current) {
//         controlsRef.current.enabled = true
//       }
      
//       // Reset camera to initial position
//       if (cameraRef.current) {
//         cameraRef.current.position.set(-6, 3.9, 6.21)
//         cameraRef.current.lookAt(-2.64, -0.71, 0.03)
//       }
//     }
//   }, [curve, raceStarted, tangent, targetQuat, forward])

//   useFrame((_, delta) => {
//     if (!carRef.current || !cameraRef.current) return

//     if (!activeRef.current) return

//     // Initialize simulation start time
//     if (simulationStartTimeRef.current === null) {
//       simulationStartTimeRef.current = 0
//     }
//     simulationStartTimeRef.current += delta
//     cameraTransitionTimeRef.current += delta

//     // Update car progress
//     progressRef.current += delta / duration
    
//     const progress = progressRef.current % 1
//     const point = curve.getPointAt(progress)
//     const dir = curve.getTangentAt(progress, tangent).normalize()

//     // Update car position - use very high lerp factor (0.95) to precisely follow the path
//     // This ensures the car stays on the road path while maintaining smooth animation
//     carRef.current.position.lerp(point, 0.95)
    
//     // Update car rotation - use high slerp factor for responsive turning that matches path direction
//     targetQuat.setFromUnitVectors(forward, dir)
//     carRef.current.quaternion.slerp(targetQuat, 0.7)

//     // Camera animation system
//     const elapsedTime = simulationStartTimeRef.current
//     const time = elapsedTime

//     // STABLE camera system - smooth transitions, car always visible
//     // Calculate car look position (car center with height offset)
//     const carLookPos = new Vector3(point.x, point.y + 1.0, point.z)
//     cameraTargetLookRef.current.lerp(carLookPos, 0.1)
    
//     // Phase 1: Initial zoom (0-3 seconds)
//     if (time < 3) {
//       cameraStateRef.current = 'intro'
//       const t = time / 3
//       const easeT = 1 - Math.pow(1 - t, 2) // Smooth ease out
      
//       const startPos = new Vector3(point.x - 7, point.y + 6, point.z + 7)
//       const targetPos = new Vector3(point.x - 4, point.y + 3.5, point.z + 4.5)
      
//       cameraTargetPosRef.current.lerpVectors(startPos, targetPos, easeT)
//       cameraRef.current.position.lerp(cameraTargetPosRef.current, 0.1)
//       cameraRef.current.lookAt(cameraTargetLookRef.current)
//       cameraRef.current.fov = 45 + (30 - 45) * easeT
//       cameraRef.current.updateProjectionMatrix()
//     }
//     // Phase 2: Stable following camera (3-20 seconds) - most of the lap
//     else if (time < 20) {
//       cameraStateRef.current = 'following'
      
//       // Stable following position behind car
//       const behindOffset = new Vector3(0, 3.5, 5.5)
//       behindOffset.applyQuaternion(carRef.current.quaternion)
//       const targetPos = point.clone().add(behindOffset)
      
//       cameraTargetPosRef.current.lerp(targetPos, 0.05)
//       cameraRef.current.position.lerp(cameraTargetPosRef.current, 0.08)
//       cameraRef.current.lookAt(cameraTargetLookRef.current)
//       cameraRef.current.fov = 42
//       cameraRef.current.updateProjectionMatrix()
//     }
//     // Phase 3: Stable side view (20-26 seconds)
//     else if (time < 26) {
//       cameraStateRef.current = 'side'
      
//       // Stable side view - perpendicular to car direction
//       const rightSide = new Vector3(-dir.z, 0, dir.x).normalize()
//       const sideOffset = rightSide.clone().multiplyScalar(-5)
//       const heightOffset = new Vector3(0, 2.8, 0)
//       const forwardOffset = dir.clone().multiplyScalar(1.5)
      
//       const targetPos = point.clone()
//         .add(sideOffset)
//         .add(heightOffset)
//         .add(forwardOffset)
      
//       cameraTargetPosRef.current.lerp(targetPos, 0.04)
//       cameraRef.current.position.lerp(cameraTargetPosRef.current, 0.08)
      
//       // Look ahead along track
//       const lookAhead = point.clone().add(dir.clone().multiplyScalar(4))
//       const lookTarget = new Vector3(lookAhead.x, lookAhead.y + 1.0, lookAhead.z)
//       cameraTargetLookRef.current.lerp(lookTarget, 0.1)
//       cameraRef.current.lookAt(cameraTargetLookRef.current)
//       cameraRef.current.fov = 48
//       cameraRef.current.updateProjectionMatrix()
//     }
//     // Phase 4: Stable aerial view (26-28 seconds)
//     else if (time < 28) {
//       cameraStateRef.current = 'aerial'
      
//       // Stable aerial view above and ahead of car
//       const forwardOffset = dir.clone().multiplyScalar(3)
//       const rightOffset = new Vector3(-dir.z, 0, dir.x).normalize().multiplyScalar(2)
//       const aerialPos = point.clone()
//         .add(new Vector3(0, 7.5, 0))
//         .add(forwardOffset)
//         .add(rightOffset)
      
//       cameraTargetPosRef.current.lerp(aerialPos, 0.03)
//       cameraRef.current.position.lerp(cameraTargetPosRef.current, 0.08)
//       cameraRef.current.lookAt(cameraTargetLookRef.current)
//       cameraRef.current.fov = 52
//       cameraRef.current.updateProjectionMatrix()
//     }
//     // Phase 5: Finish line view (28-30 seconds)
//     else {
//       cameraStateRef.current = 'finish'
//       const t = (time - 28) / 2
//       const easeT = 1 - Math.pow(1 - t, 2)
      
//       // Return to following view for finish
//       const behindOffset = new Vector3(0, 3, 4)
//       behindOffset.applyQuaternion(carRef.current.quaternion)
//       const targetPos = point.clone().add(behindOffset)
      
//       cameraTargetPosRef.current.lerp(targetPos, 0.08)
//       cameraRef.current.position.lerp(cameraTargetPosRef.current, 0.1)
//       cameraRef.current.lookAt(cameraTargetLookRef.current)
//       cameraRef.current.fov = 42 - (7 * easeT)
//       cameraRef.current.updateProjectionMatrix()
//     }

//     // Check if race is complete - ensure smooth round completion
//     if (progressRef.current >= 1.0) {
//       // Ensure car reaches exactly the start position
//       if (carRef.current) {
//         const finalPoint = curve.getPointAt(0)
//         carRef.current.position.lerp(finalPoint, 0.3)
//         const finalDir = curve.getTangentAt(0, tangent).normalize()
//         const finalQuat = new Quaternion()
//         finalQuat.setFromUnitVectors(forward, finalDir)
//         carRef.current.quaternion.slerp(finalQuat, 0.4)
//       }
      
//       progressRef.current = 1.0
//       activeRef.current = false
      
//       // Small delay before calling onRaceEnd for smooth transition
//       setTimeout(() => {
//         onRaceEnd?.()
//       }, 800)
//     }
//   })

//   // Ensure car is visible by making sure materials are properly set
//   useEffect(() => {
//     if (carScene) {
//       carScene.traverse((child: any) => {
//         if (child instanceof Mesh) {
//           // Ensure the car is visible
//           child.visible = true
//           if (child.material) {
//             // Make sure materials are not transparent
//             if (Array.isArray(child.material)) {
//               child.material.forEach((mat: any) => {
//                 mat.transparent = false
//               })
//             } else {
//               (child.material as any).transparent = false
//             }
//           }
//         }
//       })
//     }
//   }, [carScene])

//   return (
//     <group ref={carRef} dispose={null}>
//       <primitive object={carScene} />
//     </group>
//   )
// }

// function Ground() {
//   const [planeRef] = usePlane(
//     () => ({
//       type: "Static",
//       rotation: [-Math.PI / 2, 0, 0],
//     }),
//     useRef(null),
//   )

//   const gridMap = useLoader(TextureLoader, `${TEXTURE_BASE}/grid.png`)
//   const aoMap = useLoader(TextureLoader, `${TEXTURE_BASE}/ground-ao.png`)
//   const alphaMap = useLoader(TextureLoader, `${TEXTURE_BASE}/alpha-map.png`)

//   useEffect(() => {
//     gridMap.anisotropy = 16
//   }, [gridMap])

//   const meshRef = useRef<Mesh>(null)
//   const meshRef2 = useRef<Mesh>(null)

//   useEffect(() => {
//     if (meshRef.current?.geometry) {
//       const uvs = meshRef.current.geometry.attributes.uv.array
//       meshRef.current.geometry.setAttribute("uv2", new BufferAttribute(uvs, 2))
//     }
//     if (meshRef2.current?.geometry) {
//       const uvs2 = meshRef2.current.geometry.attributes.uv.array
//       meshRef2.current.geometry.setAttribute("uv2", new BufferAttribute(uvs2, 2))
//     }
//   }, [])

//   return (
//     <>
//       <mesh
//         ref={meshRef2}
//         position={[-2.285, -0.01, -1.325]}
//         rotation-x={-Math.PI * 0.5}
//       >
//         <planeGeometry args={[12, 12]} />
//         <meshBasicMaterial
//           opacity={0.325}
//           alphaMap={gridMap}
//           transparent
//           color="white"
//         />
//       </mesh>

//       <mesh
//         ref={meshRef}
//         position={[-2.285, -0.015, -1.325]}
//         rotation-x={-Math.PI * 0.5}
//         rotation-z={-0.079}
//       >
//         <circleGeometry args={[6.12, 50]} />
//         <MeshReflectorMaterial
//           aoMap={aoMap}
//           alphaMap={alphaMap}
//           transparent
//           color={[0.5, 0.5, 0.5]}
//           envMapIntensity={0.35}
//           metalness={0.05}
//           roughness={0.4}
//           dithering
//           blur={[1024, 512]}
//           mixBlur={3}
//           mixStrength={30}
//           mixContrast={1}
//           resolution={1024}
//           mirror={0}
//           depthScale={0}
//           minDepthThreshold={0.9}
//           maxDepthThreshold={1}
//           depthToBlurRatioBias={0.25}
//           reflectorOffset={0.02}
//         />
//       </mesh>
//       <mesh ref={planeRef} visible={false}>
//         <planeGeometry args={[1, 1]} />
//       </mesh>
//     </>
//   )
// }

// function Track() {
//   const gltf = useLoader(GLTFLoader, `${MODEL_BASE}/track.glb`) as Group
//   const colorMap = useLoader(TextureLoader, `${TEXTURE_BASE}/track.png`)

//   useEffect(() => {
//     colorMap.anisotropy = 16
//   }, [colorMap])

//   if (!gltf?.scene?.children?.[0]) return null

//   const geometry = gltf.scene.children[0].geometry

//   return (
//     <>
//       <mesh geometry={geometry}>
//         <meshBasicMaterial toneMapped={false} map={colorMap} />
//       </mesh>

//       <ColliderBox position={[1.75, 0, 0.5]} scale={[0.3, 1, 0.3]} />
//       <ColliderBox position={[2.5, 0, -1.4]} scale={[0.3, 1, 0.3]} />
//       <ColliderBox position={[0.6, 0, -3.8]} scale={[0.3, 1, 0.3]} />
//       <ColliderBox position={[-1.95, 0, -5.18]} scale={[0.3, 1, 0.3]} />
//       <ColliderBox position={[-5.55, 0, -3.05]} scale={[0.3, 1, 0.3]} />
//       <ColliderBox position={[-4.4, 0, -1.77]} scale={[0.3, 1, 0.3]} />
//       <ColliderBox position={[-7.03, 0, -0.76]} scale={[0.3, 1, 0.3]} />
//       <ColliderBox position={[-4.75, 0, 2.73]} scale={[0.3, 1, 0.3]} />
//       <ColliderBox position={[-3.05, 0, 3.4]} scale={[0.3, 1, 0.3]} />
//       <ColliderBox position={[-0.83, 0, 3.2]} scale={[0.3, 1, 0.3]} />

//       <ColliderBox position={[-1.85, 0, 0.385]} scale={[0.05, 1, 0.13]} />
//       <ColliderBox position={[-1.85, 0, -0.385]} scale={[0.05, 1, 0.13]} />
//       <ColliderBox position={[-2.28, 0, 0.385]} scale={[0.05, 1, 0.13]} />
//       <ColliderBox position={[-2.28, 0, -0.385]} scale={[0.05, 1, 0.13]} />
//       <ColliderBox position={[-4.39, 0, 1.125]} scale={[0.13, 1, 0.13]} />
//       <ColliderBox position={[-4.39, 0, 1.9]} scale={[0.13, 1, 0.13]} />

//       <ColliderBox position={[-2.86, 0, -0.9]} scale={[0.35, 1, 0.35]} />
//       <ColliderBox position={[-3.33, 0, -0.9]} scale={[0.35, 1, 0.35]} />
//       <ColliderBox position={[0.41, 0, 2]} scale={[0.35, 1, 0.35]} />

//       <ColliderBox position={[-2.3, 0, -2.76]} scale={[1.37, 1, 1.09]} />

//       <ColliderBox position={[-3.08, 0, 0.89]} scale={[0.36, 1, 0.03]} />
//       <ColliderBox position={[-2.53, 0, 0.89]} scale={[0.36, 1, 0.03]} />

//       <ColliderBox position={[-4.53, 0, -0.65]} scale={[0.1, 0.5, 0.1]} />
//       <ColliderBox position={[-4.15, 0, -0.67]} scale={[0.1, 0.5, 0.1]} />
//       <ColliderBox position={[-4.9, 0, -0.58]} scale={[0.1, 0.5, 0.1]} />
//       <ColliderBox position={[-0.3, 0, 1]} scale={[0.1, 0.5, 0.1]} />

//       <Ramp />
//     </>
//   )
// }

// function Ramp() {
//   const gltf = useLoader(GLTFLoader, `${MODEL_BASE}/ramp.glb`) as Group

//   if (!gltf?.scene?.children?.[0]) return null

//   const geometry = gltf.scene.children[0].geometry
//   const vertices = geometry.attributes.position.array
//   const indices = geometry.index?.array

//   if (!indices) return null

//   const [ref] = useTrimesh(
//     () => ({
//       args: [vertices, indices],
//       mass: 0,
//       type: "Static",
//     }),
//     useRef(null),
//   )

//   return null
// }

// function ColliderBox({ position, scale }: { position: [number, number, number]; scale: [number, number, number] }) {
//   useBox(() => ({
//     args: scale,
//     position,
//     type: "Static",
//   }))

//   return null
// }

"use client"

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { Environment, MeshReflectorMaterial, OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { Physics, useBox, usePlane, useTrimesh } from "@react-three/cannon"
import { BufferAttribute, CatmullRomCurve3, Quaternion, TextureLoader, Vector3, Mesh, type Group, type PerspectiveCamera as ThreePerspectiveCamera } from "three"
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader"

const ASSET_BASE = "/r3f"
const MODEL_BASE = `${ASSET_BASE}/models`
const TEXTURE_BASE = `${ASSET_BASE}/textures`

type StageProps = {
  raceStarted: boolean
  onRaceEnd?: () => void
}

export default function F1InteractiveStage({ raceStarted, onRaceEnd }: StageProps) {
  return (
    <div className="relative h-screen min-h-[720px] w-full overflow-hidden bg-[#030304]">
      <Canvas
        gl={{ antialias: true }}
        camera={{ position: [-6, 3.9, 6.21], fov: 40 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#040309"]} />
        <Suspense fallback={null}>
          <Physics broadphase="SAP" gravity={[0, -2.6, 0]}>
            <Scene raceStarted={raceStarted} onRaceEnd={onRaceEnd} />
          </Physics>
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 top-20 flex justify-center">
        <div className="rounded-full border border-white/10 bg-black/40 px-6 py-2 text-xs tracking-[0.5em] text-white/70 backdrop-blur">
          TOUCH & DRAG THE GRID
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-[#05030a] to-background" />
    </div>
  )
}

function Scene({ raceStarted, onRaceEnd }: StageProps) {
  const cameraRef = useRef<ThreePerspectiveCamera>(null)
  const controlsRef = useRef<any>(null)

  return (
    <>
      <Environment files={`${TEXTURE_BASE}/envmap.hdr`} background />
      <PerspectiveCamera makeDefault ref={cameraRef} position={[-6, 3.9, 6.21]} fov={40} />
      <OrbitControls
        ref={controlsRef}
        target={[-2.64, -0.71, 0.03]}
        enablePan={false}
        maxDistance={12}
        enableDamping
        dampingFactor={0.05}
        enabled={!raceStarted}
      />
      <Track />
      <Ground />
      <Car raceStarted={raceStarted} onRaceEnd={onRaceEnd} cameraRef={cameraRef} controlsRef={controlsRef} />
    </>
  )
}

type CarProps = {
  raceStarted: boolean
  onRaceEnd?: () => void
  cameraRef: React.RefObject<ThreePerspectiveCamera>
  controlsRef: React.RefObject<any>
}

function Car({ raceStarted, onRaceEnd, cameraRef, controlsRef }: CarProps) {
  const gltf = useLoader(GLTFLoader, "/car_3d/scene.gltf") as GLTF
  const carRef = useRef<Group>(null)

  const carScene = useMemo(() => {
    const cloned = gltf.scene.clone()
    // Scale set to 12, 12, 12 for visibility
    cloned.scale.set(12, 12, 12)
    cloned.position.set(0, -0.03, 0)
    return cloned
  }, [gltf])

  // CORRECTED PATH - traced to follow the actual black track surface
  // The track forms a figure-8 shape centered around [-2.285, 0, -1.325]
  const pathPoints = useMemo(
    () =>
      [
        // Starting position - pit straight (right side of track)
        [-2.1, 0.05, 0.0],
        [-2.0, 0.05, 0.5],
        [-1.8, 0.05, 1.0],
        [-1.5, 0.05, 1.5],
        
        // Turn 1 - top right corner
        [-1.0, 0.05, 2.0],
        [-0.5, 0.05, 2.5],
        [0.0, 0.05, 2.8],
        [0.5, 0.05, 2.9],
        
        // Top straight
        [1.0, 0.05, 2.7],
        [1.5, 0.05, 2.3],
        [1.8, 0.05, 1.8],
        
        // Turn 2 - right side
        [2.0, 0.05, 1.2],
        [2.2, 0.05, 0.5],
        [2.3, 0.05, -0.2],
        [2.3, 0.05, -1.0],
        
        // Right straight going down
        [2.2, 0.05, -1.8],
        [2.0, 0.05, -2.5],
        [1.6, 0.05, -3.0],
        [1.0, 0.05, -3.5],
        
        // Turn 3 - bottom right
        [0.3, 0.05, -3.9],
        [-0.5, 0.05, -4.2],
        [-1.2, 0.05, -4.5],
        [-1.8, 0.05, -4.8],
        
        // Bottom section - crossing point
        [-2.5, 0.05, -5.0],
        [-3.2, 0.05, -5.0],
        [-3.9, 0.05, -4.8],
        [-4.5, 0.05, -4.4],
        
        // Turn 4 - bottom left
        [-5.0, 0.05, -3.8],
        [-5.4, 0.05, -3.2],
        [-5.6, 0.05, -2.5],
        [-5.7, 0.05, -1.8],
        
        // Left side going up
        [-5.8, 0.05, -1.0],
        [-6.0, 0.05, -0.3],
        [-6.2, 0.05, 0.5],
        [-6.3, 0.05, 1.2],
        
        // Turn 5 - top left
        [-6.2, 0.05, 1.9],
        [-5.9, 0.05, 2.5],
        [-5.5, 0.05, 2.9],
        [-5.0, 0.05, 3.2],
        
        // Top left section
        [-4.5, 0.05, 3.4],
        [-4.0, 0.05, 3.5],
        [-3.5, 0.05, 3.5],
        [-3.0, 0.05, 3.4],
        
        // Turn 6 - back towards start
        [-2.5, 0.05, 3.1],
        [-2.2, 0.05, 2.6],
        [-2.1, 0.05, 2.0],
        [-2.1, 0.05, 1.4],
        [-2.1, 0.05, 0.8],
        [-2.1, 0.05, 0.4],
        
        // Close the loop back to start
        [-2.1, 0.05, 0.0],
      ].map(([x, y, z]) => new Vector3(x, y, z)),
    [],
  )

  const curve = useMemo(() => new CatmullRomCurve3(pathPoints, true, "catmullrom", 0.5), [pathPoints])
  const forward = useMemo(() => new Vector3(0, 0, 1), [])
  const tangent = useMemo(() => new Vector3(), [])
  const targetQuat = useMemo(() => new Quaternion(), [])

  const progressRef = useRef(0)
  const activeRef = useRef(false)
  const duration = 30
  const simulationStartTimeRef = useRef<number | null>(null)
  const cameraTargetPosRef = useRef<Vector3>(new Vector3())
  const cameraTargetLookRef = useRef<Vector3>(new Vector3())
  
  const cameraStateRef = useRef<'intro' | 'following' | 'side' | 'aerial' | 'finish'>('intro')
  const cameraTransitionTimeRef = useRef(0)

  useEffect(() => {
    if (raceStarted) {
      progressRef.current = 0
      activeRef.current = true
      simulationStartTimeRef.current = null
      cameraStateRef.current = 'intro'
      cameraTransitionTimeRef.current = 0
      
      if (carRef.current) {
        const startPoint = curve.getPointAt(0)
        carRef.current.position.copy(startPoint)
        const initialDir = curve.getTangentAt(0, tangent).normalize()
        targetQuat.setFromUnitVectors(forward, initialDir)
        carRef.current.quaternion.copy(targetQuat)
      }
      
      if (cameraRef.current && carRef.current) {
        const startPoint = curve.getPointAt(0)
        const startPos = new Vector3(startPoint.x - 7, startPoint.y + 6, startPoint.z + 7)
        cameraTargetPosRef.current.copy(startPos)
        cameraRef.current.position.copy(startPos)
        cameraTargetLookRef.current.copy(new Vector3(startPoint.x, startPoint.y + 1.0, startPoint.z))
      }
      
      if (controlsRef.current) {
        controlsRef.current.enabled = false
      }
    } else {
      activeRef.current = false
      simulationStartTimeRef.current = null
      
      if (carRef.current) {
        const startPoint = curve.getPointAt(0)
        carRef.current.position.copy(startPoint)
      }
      
      if (controlsRef.current) {
        controlsRef.current.enabled = true
      }
      
      if (cameraRef.current) {
        cameraRef.current.position.set(-6, 3.9, 6.21)
        cameraRef.current.lookAt(-2.64, -0.71, 0.03)
      }
    }
  }, [curve, raceStarted, tangent, targetQuat, forward])

  useFrame((_, delta) => {
    if (!carRef.current || !cameraRef.current) return
    if (!activeRef.current) return

    if (simulationStartTimeRef.current === null) {
      simulationStartTimeRef.current = 0
    }
    simulationStartTimeRef.current += delta
    cameraTransitionTimeRef.current += delta

    progressRef.current += delta / duration
    
    const progress = progressRef.current % 1
    const point = curve.getPointAt(progress)
    const dir = curve.getTangentAt(progress, tangent).normalize()

    // Smooth car movement along path
    carRef.current.position.lerp(point, 0.15)
    targetQuat.setFromUnitVectors(forward, dir)
    carRef.current.quaternion.slerp(targetQuat, 0.1)

    const elapsedTime = simulationStartTimeRef.current
    const time = elapsedTime

    const carLookPos = new Vector3(point.x, point.y + 0.5, point.z)
    cameraTargetLookRef.current.lerp(carLookPos, 0.1)
    
    if (time < 3) {
      cameraStateRef.current = 'intro'
      const t = time / 3
      const easeT = 1 - Math.pow(1 - t, 2)
      
      const startPos = new Vector3(point.x - 7, point.y + 6, point.z + 7)
      const targetPos = new Vector3(point.x - 4, point.y + 3.5, point.z + 4.5)
      
      cameraTargetPosRef.current.lerpVectors(startPos, targetPos, easeT)
      cameraRef.current.position.lerp(cameraTargetPosRef.current, 0.1)
      cameraRef.current.lookAt(cameraTargetLookRef.current)
      cameraRef.current.fov = 45 + (30 - 45) * easeT
      cameraRef.current.updateProjectionMatrix()
    }
    else if (time < 20) {
      cameraStateRef.current = 'following'
      
      const behindOffset = new Vector3(0, 2.5, 4)
      behindOffset.applyQuaternion(carRef.current.quaternion)
      const targetPos = point.clone().add(behindOffset)
      
      cameraTargetPosRef.current.lerp(targetPos, 0.05)
      cameraRef.current.position.lerp(cameraTargetPosRef.current, 0.08)
      cameraRef.current.lookAt(cameraTargetLookRef.current)
      cameraRef.current.fov = 42
      cameraRef.current.updateProjectionMatrix()
    }
    else if (time < 26) {
      cameraStateRef.current = 'side'
      
      const rightSide = new Vector3(-dir.z, 0, dir.x).normalize()
      const sideOffset = rightSide.clone().multiplyScalar(-5)
      const heightOffset = new Vector3(0, 2.8, 0)
      const forwardOffset = dir.clone().multiplyScalar(1.5)
      
      const targetPos = point.clone()
        .add(sideOffset)
        .add(heightOffset)
        .add(forwardOffset)
      
      cameraTargetPosRef.current.lerp(targetPos, 0.04)
      cameraRef.current.position.lerp(cameraTargetPosRef.current, 0.08)
      
      const lookAhead = point.clone().add(dir.clone().multiplyScalar(4))
      const lookTarget = new Vector3(lookAhead.x, lookAhead.y + 0.5, lookAhead.z)
      cameraTargetLookRef.current.lerp(lookTarget, 0.1)
      cameraRef.current.lookAt(cameraTargetLookRef.current)
      cameraRef.current.fov = 48
      cameraRef.current.updateProjectionMatrix()
    }
    else if (time < 28) {
      cameraStateRef.current = 'aerial'
      
      const forwardOffset = dir.clone().multiplyScalar(3)
      const rightOffset = new Vector3(-dir.z, 0, dir.x).normalize().multiplyScalar(2)
      const aerialPos = point.clone()
        .add(new Vector3(0, 7.5, 0))
        .add(forwardOffset)
        .add(rightOffset)
      
      cameraTargetPosRef.current.lerp(aerialPos, 0.03)
      cameraRef.current.position.lerp(cameraTargetPosRef.current, 0.08)
      cameraRef.current.lookAt(cameraTargetLookRef.current)
      cameraRef.current.fov = 52
      cameraRef.current.updateProjectionMatrix()
    }
    else {
      cameraStateRef.current = 'finish'
      const t = (time - 28) / 2
      const easeT = 1 - Math.pow(1 - t, 2)
      
      const behindOffset = new Vector3(0, 3, 4)
      behindOffset.applyQuaternion(carRef.current.quaternion)
      const targetPos = point.clone().add(behindOffset)
      
      cameraTargetPosRef.current.lerp(targetPos, 0.08)
      cameraRef.current.position.lerp(cameraTargetPosRef.current, 0.1)
      cameraRef.current.lookAt(cameraTargetLookRef.current)
      cameraRef.current.fov = 42 - (7 * easeT)
      cameraRef.current.updateProjectionMatrix()
    }

    if (progressRef.current >= 1.0) {
      if (carRef.current) {
        const finalPoint = curve.getPointAt(0)
        carRef.current.position.lerp(finalPoint, 0.3)
        const finalDir = curve.getTangentAt(0, tangent).normalize()
        const finalQuat = new Quaternion()
        finalQuat.setFromUnitVectors(forward, finalDir)
        carRef.current.quaternion.slerp(finalQuat, 0.4)
      }
      
      progressRef.current = 1.0
      activeRef.current = false
      
      setTimeout(() => {
        onRaceEnd?.()
      }, 800)
    }
  })

  useEffect(() => {
    if (carScene) {
      carScene.traverse((child: any) => {
        if (child instanceof Mesh) {
          child.visible = true
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat: any) => {
                mat.transparent = false
              })
            } else {
              (child.material as any).transparent = false
            }
          }
        }
      })
    }
  }, [carScene])

  return (
    <group ref={carRef} dispose={null}>
      <primitive object={carScene} />
    </group>
  )
}

function Ground() {
  const [planeRef] = usePlane(
    () => ({
      type: "Static",
      rotation: [-Math.PI / 2, 0, 0],
    }),
    useRef(null),
  )

  const gridMap = useLoader(TextureLoader, `${TEXTURE_BASE}/grid.png`)
  const aoMap = useLoader(TextureLoader, `${TEXTURE_BASE}/ground-ao.png`)
  const alphaMap = useLoader(TextureLoader, `${TEXTURE_BASE}/alpha-map.png`)

  useEffect(() => {
    gridMap.anisotropy = 16
  }, [gridMap])

  const meshRef = useRef<Mesh>(null)
  const meshRef2 = useRef<Mesh>(null)

  useEffect(() => {
    if (meshRef.current?.geometry) {
      const uvs = meshRef.current.geometry.attributes.uv.array
      meshRef.current.geometry.setAttribute("uv2", new BufferAttribute(uvs, 2))
    }
    if (meshRef2.current?.geometry) {
      const uvs2 = meshRef2.current.geometry.attributes.uv.array
      meshRef2.current.geometry.setAttribute("uv2", new BufferAttribute(uvs2, 2))
    }
  }, [])

  return (
    <>
      <mesh
        ref={meshRef2}
        position={[-2.285, -0.01, -1.325]}
        rotation-x={-Math.PI * 0.5}
      >
        <planeGeometry args={[12, 12]} />
        <meshBasicMaterial
          opacity={0.325}
          alphaMap={gridMap}
          transparent
          color="white"
        />
      </mesh>

      <mesh
        ref={meshRef}
        position={[-2.285, -0.015, -1.325]}
        rotation-x={-Math.PI * 0.5}
        rotation-z={-0.079}
      >
        <circleGeometry args={[6.12, 50]} />
        <MeshReflectorMaterial
          aoMap={aoMap}
          alphaMap={alphaMap}
          transparent
          color={[0.5, 0.5, 0.5]}
          envMapIntensity={0.35}
          metalness={0.05}
          roughness={0.4}
          dithering
          blur={[1024, 512]}
          mixBlur={3}
          mixStrength={30}
          mixContrast={1}
          resolution={1024}
          mirror={0}
          depthScale={0}
          minDepthThreshold={0.9}
          maxDepthThreshold={1}
          depthToBlurRatioBias={0.25}
          reflectorOffset={0.02}
        />
      </mesh>
      <mesh ref={planeRef} visible={false}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </>
  )
}

function Track() {
  const gltf = useLoader(GLTFLoader, `${MODEL_BASE}/track.glb`) as Group
  const colorMap = useLoader(TextureLoader, `${TEXTURE_BASE}/track.png`)

  useEffect(() => {
    colorMap.anisotropy = 16
  }, [colorMap])

  if (!gltf?.scene?.children?.[0]) return null

  const geometry = gltf.scene.children[0].geometry

  return (
    <>
      <mesh geometry={geometry}>
        <meshBasicMaterial toneMapped={false} map={colorMap} />
      </mesh>

      <ColliderBox position={[1.75, 0, 0.5]} scale={[0.3, 1, 0.3]} />
      <ColliderBox position={[2.5, 0, -1.4]} scale={[0.3, 1, 0.3]} />
      <ColliderBox position={[0.6, 0, -3.8]} scale={[0.3, 1, 0.3]} />
      <ColliderBox position={[-1.95, 0, -5.18]} scale={[0.3, 1, 0.3]} />
      <ColliderBox position={[-5.55, 0, -3.05]} scale={[0.3, 1, 0.3]} />
      <ColliderBox position={[-4.4, 0, -1.77]} scale={[0.3, 1, 0.3]} />
      <ColliderBox position={[-7.03, 0, -0.76]} scale={[0.3, 1, 0.3]} />
      <ColliderBox position={[-4.75, 0, 2.73]} scale={[0.3, 1, 0.3]} />
      <ColliderBox position={[-3.05, 0, 3.4]} scale={[0.3, 1, 0.3]} />
      <ColliderBox position={[-0.83, 0, 3.2]} scale={[0.3, 1, 0.3]} />

      <ColliderBox position={[-1.85, 0, 0.385]} scale={[0.05, 1, 0.13]} />
      <ColliderBox position={[-1.85, 0, -0.385]} scale={[0.05, 1, 0.13]} />
      <ColliderBox position={[-2.28, 0, 0.385]} scale={[0.05, 1, 0.13]} />
      <ColliderBox position={[-2.28, 0, -0.385]} scale={[0.05, 1, 0.13]} />
      <ColliderBox position={[-4.39, 0, 1.125]} scale={[0.13, 1, 0.13]} />
      <ColliderBox position={[-4.39, 0, 1.9]} scale={[0.13, 1, 0.13]} />

      <ColliderBox position={[-2.86, 0, -0.9]} scale={[0.35, 1, 0.35]} />
      <ColliderBox position={[-3.33, 0, -0.9]} scale={[0.35, 1, 0.35]} />
      <ColliderBox position={[0.41, 0, 2]} scale={[0.35, 1, 0.35]} />

      <ColliderBox position={[-2.3, 0, -2.76]} scale={[1.37, 1, 1.09]} />

      <ColliderBox position={[-3.08, 0, 0.89]} scale={[0.36, 1, 0.03]} />
      <ColliderBox position={[-2.53, 0, 0.89]} scale={[0.36, 1, 0.03]} />

      <ColliderBox position={[-4.53, 0, -0.65]} scale={[0.1, 0.5, 0.1]} />
      <ColliderBox position={[-4.15, 0, -0.67]} scale={[0.1, 0.5, 0.1]} />
      <ColliderBox position={[-4.9, 0, -0.58]} scale={[0.1, 0.5, 0.1]} />
      <ColliderBox position={[-0.3, 0, 1]} scale={[0.1, 0.5, 0.1]} />

      <Ramp />
    </>
  )
}

function Ramp() {
  const gltf = useLoader(GLTFLoader, `${MODEL_BASE}/ramp.glb`) as Group

  if (!gltf?.scene?.children?.[0]) return null

  const geometry = gltf.scene.children[0].geometry
  const vertices = geometry.attributes.position.array
  const indices = geometry.index?.array

  if (!indices) return null

  const [ref] = useTrimesh(
    () => ({
      args: [vertices, indices],
      mass: 0,
      type: "Static",
    }),
    useRef(null),
  )

  return null
}

function ColliderBox({ position, scale }: { position: [number, number, number]; scale: [number, number, number] }) {
  useBox(() => ({
    args: scale,
    position,
    type: "Static",
  }))

  return null
}