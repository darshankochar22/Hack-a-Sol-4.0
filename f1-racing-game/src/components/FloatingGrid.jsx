/**
 * FloatingGrid component from car-show
 * Provides animated grid overlay for visual enhancement
 * Simplified version without texture loading to avoid hooks issues
 */
export function FloatingGrid() {
  // Simple grid using geometry (no texture dependency)
  return (
    <mesh rotation-x={-Math.PI * 0.5} position={[0, 0.425, 0]}>
      <planeGeometry args={[35, 35]} />
      <meshBasicMaterial
        color={[1, 1, 1]}
        opacity={0.1}
        transparent={true}
        wireframe={true}
      />
    </mesh>
  );
}

