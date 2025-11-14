import { useEffect, useState } from "react";

export const useF1Controls = (vehicleApi, chassisApi, disabled = false) => {
  let [controls, setControls] = useState({});

  useEffect(() => {
    if (disabled) return; // Don't listen to keys if AI mode
    
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
  }, [disabled]);

  useEffect(() => {
    if (!vehicleApi || !chassisApi || disabled) return; // Don't apply controls if AI mode

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

    // Reset position
    if (controls.r) {
      chassisApi.position.set(0, 0.3, 0);
      chassisApi.velocity.set(0, 0, 0);
      chassisApi.angularVelocity.set(0, 0, 0);
      chassisApi.rotation.set(0, 0, 0);
    }
  }, [controls, vehicleApi, chassisApi, disabled]);

  return controls;
};

