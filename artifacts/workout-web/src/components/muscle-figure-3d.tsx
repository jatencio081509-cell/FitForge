import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";

const PRIMARY = "#00E6D2";
const INACTIVE = "#2a3550";
const SKIN = "#1a2236";

// ── Anatomy constants (Y-up coordinate system) ───────────────────────────────
// Head crown  ≈  y +1.97
// Shoulder    ≈  y +1.32   x ±0.285
// Elbow       ≈  y +0.94   x ±0.385
// Wrist       ≈  y +0.54   x ±0.440
// Hip joint   ≈  y +0.30   x ±0.145
// Knee        ≈  y −0.25   x ±0.155
// Ankle       ≈  y −0.73   x ±0.145
// Foot bottom ≈  y −0.88

// Upper-arm angle  ≈ 16° outward → rot_z = ±0.28 rad
// Forearm angle    ≈  8° outward → rot_z = ±0.14 rad
// Thigh angle      ≈  5° outward → rot_z = ±0.09 rad

interface MusclePart {
  id: string;
  type: "sphere" | "cylinder" | "capsule" | "box";
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: [number, number, number];
  isSkin?: boolean;
}

// Capsule geometry: args=[radius, length, capSeg, radSeg]
// We set args=[0.5, 1, 8, 16] and control shape purely via scale.
// Effective radius = scale.x * 0.5,  effective length = scale.y * 1 + 2*(scale.x*0.5)
// For simple use: treat scale.y as total length multiplier.

const PARTS: MusclePart[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // SKELETON / BODY BASE
  // ──────────────────────────────────────────────────────────────────────────

  // Head (slightly oval)
  { id: "head",     type: "sphere",  position: [0, 1.73, 0],         scale: [0.215, 0.255, 0.215],  isSkin: true },
  // Neck
  { id: "neck",     type: "capsule", position: [0, 1.46, 0],         scale: [0.085, 0.12, 0.085],   isSkin: true },

  // Torso — two-section taper (wide chest → narrower waist)
  { id: "torso_hi", type: "box",     position: [0, 1.10, 0],         scale: [0.50, 0.30, 0.260],    isSkin: true },
  { id: "torso_lo", type: "box",     position: [0, 0.80, 0],         scale: [0.44, 0.24, 0.250],    isSkin: true },
  // Hips (pelvis block)
  { id: "hips",     type: "box",     position: [0, 0.56, 0],         scale: [0.43, 0.22, 0.255],    isSkin: true },

  // ── LEFT ARM (angled outward ~16° at upper, ~8° forearm) ─────────────────
  // Upper arm: shoulder (−0.285, 1.32) → elbow (−0.385, 0.94)
  // center (−0.335, 1.13), length ≈ 0.40, tilt −16°
  { id: "u_arm_l",  type: "capsule", position: [-0.335, 1.13, 0],    rotation: [0, 0, -0.28], scale: [0.085, 0.40, 0.085], isSkin: true },
  // Forearm: elbow (−0.385, 0.94) → wrist (−0.440, 0.54)
  // center (−0.412, 0.74), length ≈ 0.41, tilt −8°
  { id: "l_arm_l",  type: "capsule", position: [-0.412, 0.74, 0],    rotation: [0, 0, -0.14], scale: [0.075, 0.41, 0.075], isSkin: true },
  // Hand
  { id: "hand_l",   type: "sphere",  position: [-0.445, 0.48, 0],    scale: [0.07, 0.10, 0.055],    isSkin: true },

  // ── RIGHT ARM (mirror) ────────────────────────────────────────────────────
  { id: "u_arm_r",  type: "capsule", position: [ 0.335, 1.13, 0],    rotation: [0, 0,  0.28], scale: [0.085, 0.40, 0.085], isSkin: true },
  { id: "l_arm_r",  type: "capsule", position: [ 0.412, 0.74, 0],    rotation: [0, 0,  0.14], scale: [0.075, 0.41, 0.075], isSkin: true },
  { id: "hand_r",   type: "sphere",  position: [ 0.445, 0.48, 0],    scale: [0.07, 0.10, 0.055],    isSkin: true },

  // ── LEFT LEG (slight outward angle) ──────────────────────────────────────
  // Thigh: hip (−0.145, 0.30) → knee (−0.155, −0.25) → mostly vertical
  { id: "thigh_l",  type: "capsule", position: [-0.150, 0.025, 0],   rotation: [0, 0, -0.04], scale: [0.130, 0.56, 0.130], isSkin: true },
  // Shin: knee → ankle
  { id: "shin_l",   type: "capsule", position: [-0.152, -0.49, 0],   scale: [0.092, 0.49, 0.092],   isSkin: true },
  // Foot
  { id: "foot_l",   type: "box",     position: [-0.150, -0.845, 0.07], scale: [0.108, 0.065, 0.22],  isSkin: true },

  // ── RIGHT LEG ─────────────────────────────────────────────────────────────
  { id: "thigh_r",  type: "capsule", position: [ 0.150, 0.025, 0],   rotation: [0, 0,  0.04], scale: [0.130, 0.56, 0.130], isSkin: true },
  { id: "shin_r",   type: "capsule", position: [ 0.152, -0.49, 0],   scale: [0.092, 0.49, 0.092],   isSkin: true },
  { id: "foot_r",   type: "box",     position: [ 0.150, -0.845, 0.07], scale: [0.108, 0.065, 0.22],  isSkin: true },

  // ──────────────────────────────────────────────────────────────────────────
  // MUSCLE GROUPS
  // ──────────────────────────────────────────────────────────────────────────

  // ── CHEST (pectorals — fan shape on front of torso) ───────────────────────
  { id: "chest_l",   type: "sphere",  position: [-0.13, 1.12, 0.142],  scale: [0.185, 0.145, 0.095] },
  { id: "chest_r",   type: "sphere",  position: [ 0.13, 1.12, 0.142],  scale: [0.185, 0.145, 0.095] },

  // ── SHOULDERS (deltoids — round cap at shoulder joint) ───────────────────
  // Anterior + lateral heads visible from front
  { id: "shoulder_l", type: "sphere", position: [-0.295, 1.30, 0.02],  scale: [0.145, 0.135, 0.145] },
  { id: "shoulder_r", type: "sphere", position: [ 0.295, 1.30, 0.02],  scale: [0.145, 0.135, 0.145] },

  // ── ARMS ─────────────────────────────────────────────────────────────────
  // Biceps — front of upper arm, peak at mid upper-arm
  { id: "bicep_l",   type: "capsule", position: [-0.340, 1.12, 0.045],  rotation: [0, 0, -0.28], scale: [0.080, 0.22, 0.080] },
  { id: "bicep_r",   type: "capsule", position: [ 0.340, 1.12, 0.045],  rotation: [0, 0,  0.28], scale: [0.080, 0.22, 0.080] },
  // Triceps — back of upper arm (long head hangs lower)
  { id: "tricep_l",  type: "capsule", position: [-0.338, 1.10, -0.050], rotation: [0, 0, -0.28], scale: [0.082, 0.26, 0.082] },
  { id: "tricep_r",  type: "capsule", position: [ 0.338, 1.10, -0.050], rotation: [0, 0,  0.28], scale: [0.082, 0.26, 0.082] },
  // Forearms (brachioradialis / flexors visible as bulk)
  { id: "forearm_l", type: "capsule", position: [-0.413, 0.74, 0.02],   rotation: [0, 0, -0.14], scale: [0.072, 0.36, 0.072] },
  { id: "forearm_r", type: "capsule", position: [ 0.413, 0.74, 0.02],   rotation: [0, 0,  0.14], scale: [0.072, 0.36, 0.072] },

  // ── CORE ─────────────────────────────────────────────────────────────────
  // Abs — 6-pack on front of lower torso  (2 columns × 3 rows)
  { id: "abs_r1_l",  type: "box",     position: [-0.075, 1.13, 0.148],  scale: [0.075, 0.078, 0.04] },
  { id: "abs_r1_r",  type: "box",     position: [ 0.075, 1.13, 0.148],  scale: [0.075, 0.078, 0.04] },
  { id: "abs_r2_l",  type: "box",     position: [-0.075, 0.99, 0.148],  scale: [0.075, 0.082, 0.04] },
  { id: "abs_r2_r",  type: "box",     position: [ 0.075, 0.99, 0.148],  scale: [0.075, 0.082, 0.04] },
  { id: "abs_r3_l",  type: "box",     position: [-0.075, 0.85, 0.148],  scale: [0.075, 0.082, 0.04] },
  { id: "abs_r3_r",  type: "box",     position: [ 0.075, 0.85, 0.148],  scale: [0.075, 0.082, 0.04] },
  // Obliques — angled strips at the sides
  { id: "oblique_l", type: "capsule", position: [-0.215, 0.97, 0.105],  rotation: [0, 0,  0.38], scale: [0.058, 0.30, 0.058] },
  { id: "oblique_r", type: "capsule", position: [ 0.215, 0.97, 0.105],  rotation: [0, 0, -0.38], scale: [0.058, 0.30, 0.058] },

  // ── BACK ─────────────────────────────────────────────────────────────────
  // Traps — diamond from neck base across to both acromions
  { id: "trap",      type: "box",     position: [0, 1.36, -0.123],      scale: [0.460, 0.195, 0.110] },
  // Lats — V-shape; widest at armpit level, tapers to lumbar
  { id: "lat_l",     type: "sphere",  position: [-0.230, 1.02, -0.115], scale: [0.110, 0.310, 0.095] },
  { id: "lat_r",     type: "sphere",  position: [ 0.230, 1.02, -0.115], scale: [0.110, 0.310, 0.095] },
  // Erector spinae (lower back pillars)
  { id: "lo_back_l", type: "capsule", position: [-0.075, 0.83, -0.130], scale: [0.060, 0.24, 0.060] },
  { id: "lo_back_r", type: "capsule", position: [ 0.075, 0.83, -0.130], scale: [0.060, 0.24, 0.060] },

  // ── LEGS ─────────────────────────────────────────────────────────────────
  // Glutes — large rounded muscles at back of hip
  { id: "glute_l",   type: "sphere",  position: [-0.148, 0.50, -0.160], scale: [0.185, 0.175, 0.145] },
  { id: "glute_r",   type: "sphere",  position: [ 0.148, 0.50, -0.160], scale: [0.185, 0.175, 0.145] },
  // Quads — 4 heads, front of thigh, widest at mid-thigh
  { id: "quad_l",    type: "capsule", position: [-0.152, 0.04, 0.072],  rotation: [0, 0, -0.04], scale: [0.118, 0.48, 0.100] },
  { id: "quad_r",    type: "capsule", position: [ 0.152, 0.04, 0.072],  rotation: [0, 0,  0.04], scale: [0.118, 0.48, 0.100] },
  // Hamstrings — back of thigh
  { id: "hamstr_l",  type: "capsule", position: [-0.152, 0.02, -0.090], rotation: [0, 0, -0.04], scale: [0.108, 0.44, 0.095] },
  { id: "hamstr_r",  type: "capsule", position: [ 0.152, 0.02, -0.090], rotation: [0, 0,  0.04], scale: [0.108, 0.44, 0.095] },
  // Calves (gastrocnemius) — diamond-shaped, back of shin
  { id: "calf_l",    type: "sphere",  position: [-0.152, -0.52, -0.050], scale: [0.085, 0.200, 0.085] },
  { id: "calf_r",    type: "sphere",  position: [ 0.152, -0.52, -0.050], scale: [0.085, 0.200, 0.085] },
];

// ── Muscle → part ID mapping ──────────────────────────────────────────────────
const MUSCLE_GROUP_MAP: Record<string, string[]> = {
  chest:     ["chest_l", "chest_r"],
  shoulders: ["shoulder_l", "shoulder_r", "trap"],
  arms:      ["bicep_l", "bicep_r", "tricep_l", "tricep_r", "forearm_l", "forearm_r"],
  core:      ["abs_r1_l", "abs_r1_r", "abs_r2_l", "abs_r2_r", "abs_r3_l", "abs_r3_r", "oblique_l", "oblique_r"],
  back:      ["trap", "lat_l", "lat_r", "lo_back_l", "lo_back_r"],
  legs:      ["quad_l", "quad_r", "hamstr_l", "hamstr_r", "glute_l", "glute_r", "calf_l", "calf_r"],
};
MUSCLE_GROUP_MAP.full_body = Object.values(MUSCLE_GROUP_MAP).flat();

function buildActiveSet(activeMuscles: string[]): Set<string> {
  const s = new Set<string>();
  for (const mg of activeMuscles) {
    for (const part of MUSCLE_GROUP_MAP[mg] ?? []) s.add(part);
  }
  return s;
}

// ── Per-mesh renderer ─────────────────────────────────────────────────────────
function BodyMesh({ part, isActive }: { part: MusclePart; isActive: boolean }) {
  const color = part.isSkin ? SKIN : isActive ? PRIMARY : INACTIVE;
  const emissive = isActive && !part.isSkin ? PRIMARY : "#000000";
  const emissiveIntensity = isActive && !part.isSkin ? 0.40 : 0;

  const geo = useMemo(() => {
    if (part.type === "sphere")
      return <sphereGeometry args={[1, 24, 16]} />;
    if (part.type === "capsule")
      return <capsuleGeometry args={[0.5, 1, 8, 16]} />;
    if (part.type === "cylinder")
      return <cylinderGeometry args={[0.9, 1, 1, 16]} />;
    return <boxGeometry args={[1, 1, 1]} />;
  }, [part.type]);

  return (
    <mesh position={part.position} rotation={part.rotation ?? [0, 0, 0]} scale={part.scale}>
      {geo}
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.55}
        metalness={0.05}
      />
    </mesh>
  );
}

function HumanFigure({ activeMuscles }: { activeMuscles: string[] }) {
  const activeSet = useMemo(() => buildActiveSet(activeMuscles), [activeMuscles]);
  return (
    <group>
      {PARTS.map(part => (
        <BodyMesh key={part.id} part={part} isActive={activeSet.has(part.id)} />
      ))}
    </group>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
interface Props {
  activeMuscles: string[];
  size?: number;
  autoRotate?: boolean;
}

export function MuscleFigure3D({ activeMuscles, size = 200, autoRotate = false }: Props) {
  const height = size * 2.4;
  const hasActive = activeMuscles.length > 0;

  return (
    <div style={{ width: size, height, userSelect: "none" }}>
      <Canvas
        camera={{ position: [0, 0.50, 2.65], fov: 42 }}
        style={{ background: "transparent" }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[2.5, 4, 3.5]} intensity={1.2} color="#ffffff" castShadow />
        <directionalLight position={[-2, 2, -3]} intensity={0.45} color="#7090bb" />
        <directionalLight position={[0, -2, 2]} intensity={0.20} color="#334466" />
        {hasActive && (
          <pointLight position={[0, 1.1, 1.4]} intensity={1.1} color={PRIMARY} distance={4.5} />
        )}
        <HumanFigure activeMuscles={activeMuscles} />
        <OrbitControls
          autoRotate={autoRotate}
          autoRotateSpeed={1.4}
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.85}
          target={[0, 0.45, 0]}
        />
      </Canvas>
    </div>
  );
}
