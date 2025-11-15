import { useEffect, useState, useRef } from "react";

export const useF1Controls = (vehicleApi, chassisApi, disabled = false, trackAssistRef = null) => {
  let [controls, setControls] = useState({});
  const steeringRef = useRef(0); // For smooth steering interpolation
  const throttleRef = useRef(0); // For smooth throttle interpolation

  useEffect(() => {
    if (disabled) return; // Don't listen to keys if AI mode
    
    const keyDownPressHandler = (e) => {
      // Handle arrow keys and regular keys
      let key = e.key.toLowerCase();
      // Arrow keys have special names
      if (e.key === 'ArrowUp') key = 'arrowup';
      else if (e.key === 'ArrowDown') key = 'arrowdown';
      else if (e.key === 'ArrowLeft') key = 'arrowleft';
      else if (e.key === 'ArrowRight') key = 'arrowright';
      
      setControls((controls) => ({ ...controls, [key]: true }));
    };

    const keyUpPressHandler = (e) => {
      // Handle arrow keys and regular keys
      let key = e.key.toLowerCase();
      // Arrow keys have special names
      if (e.key === 'ArrowUp') key = 'arrowup';
      else if (e.key === 'ArrowDown') key = 'arrowdown';
      else if (e.key === 'ArrowLeft') key = 'arrowleft';
      else if (e.key === 'ArrowRight') key = 'arrowright';
      
      setControls((controls) => ({ ...controls, [key]: false }));
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

    // More responsive controls - smoother steering for less sensitivity
    const steeringLerpFactor = 0.15; // Slower steering response (less sensitive)
    const throttleLerpFactor = 0.6; // Faster acceleration response

    // Determine target values
    let targetThrottle = 0;
    let targetSteering = 0;

    // F1-style controls - balanced force to prevent car from pitching
    const baseForce = 200; // Reduced base force to prevent rotation
    const playerBoost = 1.5; // Reduced boost to prevent excessive force
    
    // Forward movement - Up arrow or W key
    if (controls.w || controls.arrowup) {
      targetThrottle = baseForce * playerBoost; // Forward (reduced to prevent pitching)
    } else if (controls.s || controls.arrowdown) {
      targetThrottle = -150; // Reverse/Brake (reduced)
    }

    // Smooth throttle interpolation
    throttleRef.current = throttleRef.current * (1 - throttleLerpFactor) + targetThrottle * throttleLerpFactor;
    
    // Apply engine force to rear wheels (2 and 3) - this prevents front-end lift
    vehicleApi.applyEngineForce(throttleRef.current, 2);
    vehicleApi.applyEngineForce(throttleRef.current, 3);

    // Steering - Left arrow turns left, Right arrow turns right
    // Reduced sensitivity: Lower values = less sensitive steering
    if (controls.a || controls.arrowleft) {
      targetSteering = -0.25; // Turn left (negative) - reduced from -0.5 for less sensitivity
    } else if (controls.d || controls.arrowright) {
      targetSteering = 0.25; // Turn right (positive) - reduced from 0.5 for less sensitivity
    }

    // Smooth steering interpolation (prevents zig-zag)
    steeringRef.current = steeringRef.current * (1 - steeringLerpFactor) + targetSteering * steeringLerpFactor;
    
    // Only apply track assist if player is NOT actively steering
    // This prevents track assist from interfering with player control
    let finalSteering = steeringRef.current;
    const isPlayerSteering = controls.a || controls.arrowleft || controls.d || controls.arrowright;
    
    if (!isPlayerSteering && trackAssistRef && trackAssistRef.current && trackAssistRef.current.steeringCorrection !== undefined) {
      // Only apply track assist when player is not steering
      // This helps guide the car back to track when player releases controls
      finalSteering = steeringRef.current + trackAssistRef.current.steeringCorrection * 0.5; // Reduced strength
      // Clamp to valid range
      finalSteering = Math.max(-0.5, Math.min(0.5, finalSteering));
    }
    
    // Apply smoothed steering to front wheels only (like bot cars)
    // Bot cars only steer wheels 0 and 1 (front wheels)
    vehicleApi.setSteeringValue(finalSteering, 0);
    vehicleApi.setSteeringValue(finalSteering, 1);

    // Reset position
    if (controls.r) {
      chassisApi.position.set(0, 0.3, 0);
      chassisApi.velocity.set(0, 0, 0);
      chassisApi.angularVelocity.set(0, 0, 0);
      chassisApi.rotation.set(0, 0, 0);
      steeringRef.current = 0; // Reset steering
      throttleRef.current = 0; // Reset throttle
    }
  }, [controls, vehicleApi, chassisApi, disabled, trackAssistRef]);

  return controls;
};

