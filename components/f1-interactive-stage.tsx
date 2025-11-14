"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useLoader } from "@react-three/fiber"
import { Environment, MeshReflectorMaterial, OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { Physics, useBox, useCompoundBody, usePlane, useRaycastVehicle, useTrimesh } from "@react-three/cannon"
import { BufferAttribute, TextureLoader, type Group, type Mesh, type Object3D } from "three"
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
  return (
    <>
      <Environment files={`${TEXTURE_BASE}/envmap.hdr`} background="both" />
      <PerspectiveCamera makeDefault position={[-6, 3.9, 6.21]} fov={40} />
      <OrbitControls
        target={[-2.64, -0.71, 0.03]}
        enablePan={false}
        maxDistance={12}
        enableDamping
        dampingFactor={0.05}
      />
      <Track />
      <Ground />
      <Car raceStarted={raceStarted} onRaceEnd={onRaceEnd} />
    </>
  )
}

type CarProps = {
  raceStarted: boolean
  onRaceEnd?: () => void
}

function Car({ raceStarted, onRaceEnd }: CarProps) {
  const gltf = useLoader<GLTF>(GLTFLoader, `${MODEL_BASE}/car.glb`)
  const carScene = useMemo(() => gltf.scene.clone() as Group, [gltf])

  const position: [number, number, number] = [-1.5, 0.5, 3]
  const width = 0.15
  const height = 0.07
  const front = 0.15
  const wheelRadius = 0.05

  const chassisBodyArgs: [number, number, number] = [width, height, front * 2]
  const [chassisBody, chassisApi] = useBox(
    () => ({
      args: chassisBodyArgs,
      mass: 150,
      position,
    }),
    useRef(null),
  )

  const [wheels, wheelInfos] = useWheels(width, height, front, wheelRadius)

  const [vehicle, vehicleApi] = useRaycastVehicle(
    () => ({
      chassisBody,
      wheelInfos,
      wheels,
    }),
    useRef(null),
  )

  useControls(vehicleApi, chassisApi)

  useEffect(() => {
    carScene.scale.set(0.0012, 0.0012, 0.0012)
    if (carScene.children[0]) {
      carScene.children[0].position.set(-365, -18, -67)
    }
  }, [carScene])

  const stopVehicle = useCallback(() => {
    for (let i = 0; i < 4; i += 1) {
      vehicleApi.applyEngineForce(0, i)
      vehicleApi.setBrake(2, i)
    }
  }, [vehicleApi])

  const raceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!raceStarted) {
      stopVehicle()
      if (raceTimer.current) {
        clearTimeout(raceTimer.current)
        raceTimer.current = null
      }
      return
    }

    chassisApi.position.set(...position)
    chassisApi.velocity.set(0, 0, 0)
    chassisApi.angularVelocity.set(0, 0, 0)

    for (let i = 0; i < 4; i += 1) {
      vehicleApi.setBrake(0, i)
    }

    vehicleApi.applyEngineForce(200, 2)
    vehicleApi.applyEngineForce(200, 3)

    raceTimer.current = setTimeout(() => {
      stopVehicle()
      onRaceEnd?.()
      raceTimer.current = null
    }, 9000)

    return () => {
      stopVehicle()
      if (raceTimer.current) {
        clearTimeout(raceTimer.current)
        raceTimer.current = null
      }
    }
  }, [raceStarted, chassisApi, onRaceEnd, position, stopVehicle, vehicleApi])

  return (
    <group ref={vehicle} name="vehicle" dispose={null}>
      <primitive object={carScene} rotation-y={Math.PI} position={[0, -0.09, 0]} />
      {gltf?.scene && <primitive object={gltf.scene} />}
      <mesh ref={chassisBody}>
        <meshBasicMaterial transparent opacity={0} />
        <boxGeometry args={chassisBodyArgs} />
      </mesh>
      {wheels.map((wheelRef, idx) => (
        <WheelDebug key={idx} wheelRef={wheelRef} radius={wheelRadius} />
      ))}
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
          debug={0}
          reflectorOffset={0.02}
        />
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

function WheelDebug({ wheelRef, radius }: { wheelRef: React.RefObject<Object3D>; radius: number }) {
  const debug = false
  if (!debug) return null

  return (
    <group ref={wheelRef}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, 0.015, 16]} />
        <meshNormalMaterial transparent opacity={0.25} />
      </mesh>
    </group>
  )
}

function useWheels(width: number, height: number, front: number, radius: number) {
  const wheels = [useRef<Object3D>(null), useRef<Object3D>(null), useRef<Object3D>(null), useRef<Object3D>(null)]

  const wheelInfo = {
    radius,
    directionLocal: [0, -1, 0] as [number, number, number],
    axleLocal: [1, 0, 0] as [number, number, number],
    suspensionStiffness: 60,
    suspensionRestLength: 0.1,
    frictionSlip: 5,
    dampingRelaxation: 2.3,
    dampingCompression: 4.4,
    maxSuspensionForce: 100000,
    rollInfluence: 0.01,
    maxSuspensionTravel: 0.1,
    customSlidingRotationalSpeed: -30,
    useCustomSlidingRotationalSpeed: true,
  }

  const wheelInfos = [
    {
      ...wheelInfo,
      chassisConnectionPointLocal: [-width * 0.65, height * 0.4, front] as [number, number, number],
      isFrontWheel: true,
    },
    {
      ...wheelInfo,
      chassisConnectionPointLocal: [width * 0.65, height * 0.4, front] as [number, number, number],
      isFrontWheel: true,
    },
    {
      ...wheelInfo,
      chassisConnectionPointLocal: [-width * 0.65, height * 0.4, -front] as [number, number, number],
      isFrontWheel: false,
    },
    {
      ...wheelInfo,
      chassisConnectionPointLocal: [width * 0.65, height * 0.4, -front] as [number, number, number],
      isFrontWheel: false,
    },
  ]

  const propsFunc = () => ({
    collisionFilterGroup: 0,
    mass: 1,
    shapes: [
      {
        args: [wheelInfo.radius, wheelInfo.radius, 0.015, 16],
        rotation: [0, 0, -Math.PI / 2] as [number, number, number],
        type: "Cylinder" as const,
      },
    ],
    type: "Kinematic" as const,
  })

  useCompoundBody(propsFunc, wheels[0])
  useCompoundBody(propsFunc, wheels[1])
  useCompoundBody(propsFunc, wheels[2])
  useCompoundBody(propsFunc, wheels[3])

  return [wheels, wheelInfos] as const
}

function useControls(vehicleApi: any, chassisApi: any) {
  const [controls, setControls] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const keyDownPressHandler = (e: KeyboardEvent) => {
      setControls((prev) => ({
        ...prev,
        [e.key.toLowerCase()]: true,
      }))
    }

    const keyUpPressHandler = (e: KeyboardEvent) => {
      setControls((prev) => ({
        ...prev,
        [e.key.toLowerCase()]: false,
      }))
    }

    window.addEventListener("keydown", keyDownPressHandler)
    window.addEventListener("keyup", keyUpPressHandler)
    return () => {
      window.removeEventListener("keydown", keyDownPressHandler)
      window.removeEventListener("keyup", keyUpPressHandler)
    }
  }, [])

  useEffect(() => {
    if (controls.w) {
      vehicleApi.applyEngineForce(150, 2)
      vehicleApi.applyEngineForce(150, 3)
    } else if (controls.s) {
      vehicleApi.applyEngineForce(-150, 2)
      vehicleApi.applyEngineForce(-150, 3)
    } else {
      vehicleApi.applyEngineForce(0, 2)
      vehicleApi.applyEngineForce(0, 3)
    }

    if (controls.a) {
      vehicleApi.setSteeringValue(0.35, 2)
      vehicleApi.setSteeringValue(0.35, 3)
      vehicleApi.setSteeringValue(-0.1, 0)
      vehicleApi.setSteeringValue(-0.1, 1)
    } else if (controls.d) {
      vehicleApi.setSteeringValue(-0.35, 2)
      vehicleApi.setSteeringValue(-0.35, 3)
      vehicleApi.setSteeringValue(0.1, 0)
      vehicleApi.setSteeringValue(0.1, 1)
    } else {
      for (let i = 0; i < 4; i++) {
        vehicleApi.setSteeringValue(0, i)
      }
    }
  }, [controls, vehicleApi, chassisApi])
}

