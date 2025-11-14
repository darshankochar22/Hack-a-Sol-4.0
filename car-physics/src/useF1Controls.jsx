import { useEffect, useState } from "react";

export const useF1Controls = (vehicleApi, chassisApi) => {
  let [controls, setControls] = useState({});

  useEffect(() => {
    const keyDownPressHandler = (e) => {
      setControls((controls) => ({ ...controls, [e.key.toLowerCase()]: true }));
    };

    const keyUpPressHandler = (e) => {
      setControls((controls) => ({ ...controls, [e.key.toLowerCase()]: false }));
    };

    window.addEventListener("keydown", keyDownPressHandler);
    window.addEventListener("keyup", keyUpPressHandler);
    return () => {
      window.removeEventListener("keydown", keyDownPressHandler);
      window.removeEventListener("keyup", keyUpPressHandler);
    };
  }, []);

  useEffect(() => {
    if (!vehicleApi || !chassisApi) return;

    // F1-style controls - higher speed, better handling
    if (controls.w || controls.arrowup) {
      // Accelerate - F1 cars are faster
      vehicleApi.applyEngineForce(300, 2);
      vehicleApi.applyEngineForce(300, 3);
    } else if (controls.s || controls.arrowdown) {
      // Reverse/Brake
      vehicleApi.applyEngineForce(-200, 2);
      vehicleApi.applyEngineForce(-200, 3);
    } else {
      vehicleApi.applyEngineForce(0, 2);
      vehicleApi.applyEngineForce(0, 3);
    }

    // Steering - F1 cars have better steering
    if (controls.a || controls.arrowleft) {
      vehicleApi.setSteeringValue(0.5, 2);
      vehicleApi.setSteeringValue(0.5, 3);
      vehicleApi.setSteeringValue(-0.1, 0);
      vehicleApi.setSteeringValue(-0.1, 1);
    } else if (controls.d || controls.arrowright) {
      vehicleApi.setSteeringValue(-0.5, 2);
      vehicleApi.setSteeringValue(-0.5, 3);
      vehicleApi.setSteeringValue(0.1, 0);
      vehicleApi.setSteeringValue(0.1, 1);
    } else {
      for (let i = 0; i < 4; i++) {
        vehicleApi.setSteeringValue(0, i);
      }
    }

    // Reset position - back to start line in middle lane
    if (controls.r) {
      const trackRadius = 25;
      const innerRadius = trackRadius * 0.65;
      const trackWidth = trackRadius - innerRadius;
      const startLineZ = trackRadius * 0.6;
      const middleLaneX = (innerRadius + trackWidth / 2) - trackRadius;
      
      chassisApi.position.set(middleLaneX, 0.3, startLineZ);
      chassisApi.velocity.set(0, 0, 0);
      chassisApi.angularVelocity.set(0, 0, 0);
      chassisApi.rotation.set(0, 0, 0);
    }
  }, [controls, vehicleApi, chassisApi]);

  return controls;
};

