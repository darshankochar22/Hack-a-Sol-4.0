/**
 * Enhanced Ground component from car-show
 * Provides reflective, textured ground surface
 * Simplified version without texture loading to avoid hooks issues
 */
export function EnhancedGround() {
  // Note: Texture loading removed to avoid React Hooks violations
  // Can be added back if textures are available and useLoader is called unconditionally

  return (
    <mesh rotation-x={-Math.PI * 0.5} castShadow receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
    </mesh>
  );
}

