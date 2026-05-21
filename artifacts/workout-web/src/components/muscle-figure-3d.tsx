import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";

const PRIMARY = "#00E6D2";
const INACTIVE = "#252b3b";
const SKIN = "#1c2130";

interface MusclePart {
  id: string;
  type: "sphere" | "cylinder" | "box";
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: [number, number, number];
  isSkin?: boolean;
}

const PARTS: MusclePart[] = [
  // ── Skin / skeleton ──────────────────────────────────────────────────────
  { id: "head",      type: "sphere",   position: [0, 1.75, 0],       scale: [0.22, 0.26, 0.22], isSkin: true },
  { id: "neck",      type: "cylinder", position: [0, 1.46, 0],       scale: [0.09, 0.14, 0.09], isSkin: true },
  { id: "torso",     type: "box",      position: [0, 0.92, 0],       scale: [0.5, 0.66, 0.28],  isSkin: true },
  { id: "hips",      type: "box",      position: [0, 0.52, 0],       scale: [0.44, 0.22, 0.27], isSkin: true },
  { id: "u_arm_l",   type: "cylinder", position: [-0.38, 1.1, 0],    scale: [0.09, 0.36, 0.09], isSkin: true },
  { id: "u_arm_r",   type: "cylinder", position: [0.38, 1.1, 0],     scale: [0.09, 0.36, 0.09], isSkin: true },
  { id: "l_arm_l",   type: "cylinder", position: [-0.38, 0.68, 0],   scale: [0.08, 0.34, 0.08], isSkin: true },
  { id: "l_arm_r",   type: "cylinder", position: [0.38, 0.68, 0],    scale: [0.08, 0.34, 0.08], isSkin: true },
  { id: "hand_l",    type: "sphere",   position: [-0.38, 0.46, 0],   scale: [0.08, 0.1, 0.06],  isSkin: true },
  { id: "hand_r",    type: "sphere",   position: [0.38, 0.46, 0],    scale: [0.08, 0.1, 0.06],  isSkin: true },
  { id: "thigh_l",   type: "cylinder", position: [-0.16, 0.07, 0],   scale: [0.13, 0.5, 0.13],  isSkin: true },
  { id: "thigh_r",   type: "cylinder", position: [0.16, 0.07, 0],    scale: [0.13, 0.5, 0.13],  isSkin: true },
  { id: "shin_l",    type: "cylinder", position: [-0.16, -0.56, 0],  scale: [0.09, 0.44, 0.09], isSkin: true },
  { id: "shin_r",    type: "cylinder", position: [0.16, -0.56, 0],   scale: [0.09, 0.44, 0.09], isSkin: true },
  { id: "foot_l",    type: "box",      position: [-0.16, -0.85, 0.06], scale: [0.11, 0.07, 0.2], isSkin: true },
  { id: "foot_r",    type: "box",      position: [0.16, -0.85, 0.06],  scale: [0.11, 0.07, 0.2], isSkin: true },

  // ── Muscle groups ─────────────────────────────────────────────────────────
  // Chest
  { id: "chest_l",   type: "sphere",   position: [-0.12, 1.1, 0.14],  scale: [0.17, 0.13, 0.1]  },
  { id: "chest_r",   type: "sphere",   position: [0.12, 1.1, 0.14],   scale: [0.17, 0.13, 0.1]  },
  // Shoulders
  { id: "shoulder_l", type: "sphere",  position: [-0.3, 1.28, 0.02],  scale: [0.14, 0.13, 0.13] },
  { id: "shoulder_r", type: "sphere",  position: [0.3, 1.28, 0.02],   scale: [0.14, 0.13, 0.13] },
  // Arms
  { id: "bicep_l",   type: "cylinder", position: [-0.38, 1.12, 0.04], scale: [0.09, 0.2, 0.09]  },
  { id: "bicep_r",   type: "cylinder", position: [0.38, 1.12, 0.04],  scale: [0.09, 0.2, 0.09]  },
  { id: "tricep_l",  type: "cylinder", position: [-0.38, 1.08, -0.05], scale: [0.09, 0.2, 0.09] },
  { id: "tricep_r",  type: "cylinder", position: [0.38, 1.08, -0.05],  scale: [0.09, 0.2, 0.09] },
  { id: "forearm_l", type: "cylinder", position: [-0.38, 0.7, 0.02],  scale: [0.08, 0.28, 0.08] },
  { id: "forearm_r", type: "cylinder", position: [0.38, 0.7, 0.02],   scale: [0.08, 0.28, 0.08] },
  // Core
  { id: "abs_upper", type: "box",      position: [0, 1.13, 0.145],   scale: [0.16, 0.09, 0.04]  },
  { id: "abs_mid",   type: "box",      position: [0, 1.0, 0.145],    scale: [0.16, 0.1, 0.04]   },
  { id: "abs_lower", type: "box",      position: [0, 0.86, 0.145],   scale: [0.16, 0.1, 0.04]   },
  { id: "oblique_l", type: "cylinder", position: [-0.2, 0.99, 0.1],  rotation: [0, 0, 0.3],  scale: [0.065, 0.26, 0.065] },
  { id: "oblique_r", type: "cylinder", position: [0.2, 0.99, 0.1],   rotation: [0, 0, -0.3], scale: [0.065, 0.26, 0.065] },
  // Back
  { id: "trap",      type: "box",      position: [0, 1.37, -0.12],   scale: [0.44, 0.18, 0.12]  },
  { id: "lat_l",     type: "sphere",   position: [-0.24, 1.02, -0.11], scale: [0.1, 0.28, 0.1]  },
  { id: "lat_r",     type: "sphere",   position: [0.24, 1.02, -0.11],  scale: [0.1, 0.28, 0.1]  },
  { id: "lo_back_l", type: "cylinder", position: [-0.08, 0.84, -0.13], scale: [0.065, 0.22, 0.065] },
  { id: "lo_back_r", type: "cylinder", position: [0.08, 0.84, -0.13],  scale: [0.065, 0.22, 0.065] },
  // Legs
  { id: "glute_l",   type: "sphere",   position: [-0.14, 0.52, -0.15], scale: [0.18, 0.16, 0.14] },
  { id: "glute_r",   type: "sphere",   position: [0.14, 0.52, -0.15],  scale: [0.18, 0.16, 0.14] },
  { id: "quad_l",    type: "cylinder", position: [-0.16, 0.1, 0.06],  scale: [0.12, 0.42, 0.12]  },
  { id: "quad_r",    type: "cylinder", position: [0.16, 0.1, 0.06],   scale: [0.12, 0.42, 0.12]  },
  { id: "hamstr_l",  type: "cylinder", position: [-0.16, 0.07, -0.08], scale: [0.11, 0.42, 0.11] },
  { id: "hamstr_r",  type: "cylinder", position: [0.16, 0.07, -0.08],  scale: [0.11, 0.42, 0.11] },
  { id: "calf_l",    type: "cylinder", position: [-0.16, -0.52, -0.04], scale: [0.09, 0.36, 0.09] },
  { id: "calf_r",    type: "cylinder", position: [0.16, -0.52, -0.04],  scale: [0.09, 0.36, 0.09] },
];

const MUSCLE_GROUP_MAP: Record<string, string[]> = {
  chest:     ["chest_l", "chest_r"],
  shoulders: ["shoulder_l", "shoulder_r", "trap"],
  arms:      ["bicep_l", "bicep_r", "tricep_l", "tricep_r", "forearm_l", "forearm_r"],
  core:      ["abs_upper", "abs_mid", "abs_lower", "oblique_l", "oblique_r"],
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

function BodyMesh({ part, isActive }: { part: MusclePart; isActive: boolean }) {
  const color = part.isSkin ? SKIN : isActive ? PRIMARY : INACTIVE;
  const emissiveIntensity = isActive && !part.isSkin ? 0.35 : 0;

  const geo = useMemo(() => {
    if (part.type === "sphere")   return <sphereGeometry args={[1, 20, 14]} />;
    if (part.type === "cylinder") return <cylinderGeometry args={[0.9, 1, 1, 16]} />;
    return <boxGeometry args={[1, 1, 1]} />;
  }, [part.type]);

  return (
    <mesh
      position={part.position}
      rotation={part.rotation ?? [0, 0, 0]}
      scale={part.scale}
    >
      {geo}
      <meshStandardMaterial
        color={color}
        emissive={isActive && !part.isSkin ? PRIMARY : "#000000"}
        emissiveIntensity={emissiveIntensity}
        roughness={0.65}
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
        camera={{ position: [0, 0.55, 2.6], fov: 42 }}
        style={{ background: "transparent" }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 4, 3]} intensity={1.1} color="#ffffff" />
        <directionalLight position={[-2, 1, -3]} intensity={0.4} color="#8090cc" />
        {hasActive && <pointLight position={[0, 1.2, 1.2]} intensity={0.9} color={PRIMARY} distance={4} />}
        <HumanFigure activeMuscles={activeMuscles} />
        <OrbitControls
          autoRotate={autoRotate}
          autoRotateSpeed={1.6}
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.85}
          target={[0, 0.5, 0]}
        />
      </Canvas>
    </div>
  );
}
