import { useBox, useRaycastVehicle } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Quaternion, Vector3 } from "three";
import { useF1Controls } from "./useF1Controls";
import { useF1Wheels } from "./useF1Wheels";

export function F1Car({ thirdPerson, onPositionUpdate, sendPositionUpdate }) {
  // F1 Car dimensions (smaller, faster)
  const position = [0, 0.3, 0];
  const width = 0.12; // Narrower for F1
  const height = 0.06;
  const front = 0.12;
  const wheelRadius = 0.04;

  const chassisBodyArgs = [width, height, front * 2];
  const [chassisBody, chassisApi] = useBox(
    () => ({
      allowSleep: false,
      args: chassisBodyArgs,
      mass: 100, // Lighter for F1
      position,
    }),
    useRef(null),
  );

  const [wheels, wheelInfos] = useF1Wheels(width, height, front, wheelRadius);

  const [vehicle, vehicleApi] = useRaycastVehicle(
    () => ({
      chassisBody,
      wheelInfos,
      wheels,
    }),
    useRef(null),
  );

  useF1Controls(vehicleApi, chassisApi);

  // Track previous position for speed calculation
  const prevPositionRef = useRef(new Vector3(0, 0, 0));
  const isFirstFrameRef = useRef(true);

  // Update position for race tracking
  useFrame((state, delta) => {
    if (!chassisBody.current || !onPositionUpdate) return;

    const position = new Vector3();
    position.setFromMatrixPosition(chassisBody.current.matrixWorld);
    
    const quaternion = new Quaternion();
    quaternion.setFromRotationMatrix(chassisBody.current.matrixWorld);

    // Calculate speed from position delta
    let speed = 0;
    if (!isFirstFrameRef.current && delta > 0) {
      const deltaPosition = position.clone().sub(prevPositionRef.current);
      speed = deltaPosition.length() / delta; // Speed in units per second
    } else {
      isFirstFrameRef.current = false;
    }

    // Update ref for next frame
    prevPositionRef.current.copy(position);

    const positionData = {
      position: [position.x, position.y, position.z],
      rotation: quaternion,
      speed: speed,
    };

    // Call local callback
    if (onPositionUpdate) {
      onPositionUpdate(positionData);
    }

    // Send to multiplayer server
    if (sendPositionUpdate) {
      sendPositionUpdate(
        positionData.position,
        quaternion,
        positionData.speed
      );
    }
  });

  // Third-person camera following
  useFrame((state) => {
    if (!thirdPerson || !chassisBody.current) return;

    let position = new Vector3(0, 0, 0);
    position.setFromMatrixPosition(chassisBody.current.matrixWorld);

    let quaternion = new Quaternion(0, 0, 0, 0);
    quaternion.setFromRotationMatrix(chassisBody.current.matrixWorld);

    let wDir = new Vector3(0, 0, 1);
    wDir.applyQuaternion(quaternion);
    wDir.normalize();

    let cameraPosition = position
      .clone()
      .add(wDir.clone().multiplyScalar(2).add(new Vector3(0, 0.5, 0)));

    wDir.add(new Vector3(0, 0.3, 0));
    state.camera.position.lerp(cameraPosition, 0.1);
    state.camera.lookAt(position);
  });

  return (
    <group ref={vehicle} name="f1-vehicle">
      <group ref={chassisBody} name="chassisBody">
        {/* F1 Car body - simple box for now */}
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={chassisBodyArgs} />
          <meshStandardMaterial
            color="#FF0000"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* F1 Car details */}
        <mesh position={[0, 0.02, 0.08]}>
          <boxGeometry args={[width * 0.8, 0.02, 0.05]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        
        {/* Driver cockpit */}
        <mesh position={[0, 0.01, -0.02]}>
          <boxGeometry args={[width * 0.6, 0.03, 0.08]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>

      {/* Wheels - simple cylinders */}
      {wheels.map((wheelRef, index) => (
        <mesh key={index} ref={wheelRef}>
          <cylinderGeometry args={[wheelRadius, wheelRadius, 0.02, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      ))}
    </group>
  );
}

