import { useRef, useState, useCallback, useEffect } from "react";

interface Props {
  activeMuscles: string[];
  size?: number;
  autoRotate?: boolean;
}

const FRONT_MUSCLE_MAP: Record<string, string[]> = {
  chest: ["left-pec", "right-pec"],
  shoulders: ["left-delt", "right-delt"],
  arms: ["left-bicep", "right-bicep", "left-forearm", "right-forearm"],
  core: ["abs-1", "abs-2", "abs-3", "abs-4", "abs-5", "abs-6", "left-oblique", "right-oblique"],
  legs: ["left-quad", "right-quad", "left-knee", "right-knee", "left-shin", "right-shin"],
  full_body: [
    "left-pec", "right-pec", "left-delt", "right-delt",
    "left-bicep", "right-bicep", "left-forearm", "right-forearm",
    "abs-1", "abs-2", "abs-3", "abs-4", "abs-5", "abs-6",
    "left-oblique", "right-oblique",
    "left-quad", "right-quad", "left-knee", "right-knee",
    "left-shin", "right-shin",
  ],
};

const BACK_MUSCLE_MAP: Record<string, string[]> = {
  back: ["traps", "left-lat", "right-lat", "left-rhomboid", "right-rhomboid", "lower-back-l", "lower-back-r"],
  shoulders: ["left-rear-delt", "right-rear-delt", "traps"],
  arms: ["left-tricep", "right-tricep", "left-forearm-b", "right-forearm-b"],
  legs: ["left-glute", "right-glute", "left-hamstring", "right-hamstring", "left-calf", "right-calf"],
  full_body: [
    "traps", "left-lat", "right-lat", "left-rhomboid", "right-rhomboid",
    "lower-back-l", "lower-back-r", "left-rear-delt", "right-rear-delt",
    "left-tricep", "right-tricep", "left-forearm-b", "right-forearm-b",
    "left-glute", "right-glute", "left-hamstring", "right-hamstring",
    "left-calf", "right-calf",
  ],
};

function buildActiveSet(muscleMap: Record<string, string[]>, activeMuscles: string[]) {
  const s = new Set<string>();
  for (const mg of activeMuscles) {
    for (const region of muscleMap[mg] ?? []) s.add(region);
  }
  return s;
}

function FrontBodySVG({ activeMuscles }: { activeMuscles: string[] }) {
  const active = buildActiveSet(FRONT_MUSCLE_MAP, activeMuscles);
  const c = (id: string) => active.has(id) ? "hsl(var(--primary))" : "hsl(220 15% 25%)";
  const o = (id: string) => active.has(id) ? 0.92 : 0.65;
  const glow = (id: string) => active.has(id) ? "url(#glow)" : undefined;
  const skin = "hsl(220 15% 18%)";
  const skinStroke = "hsl(220 15% 30%)";

  return (
    <svg viewBox="0 0 200 480" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <defs>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="bodyGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(220 15% 22%)" />
          <stop offset="100%" stopColor="hsl(220 15% 14%)" />
        </radialGradient>
      </defs>

      {/* ── Body outline / silhouette ── */}
      {/* Head */}
      <ellipse cx="100" cy="36" rx="26" ry="30" fill={skin} stroke={skinStroke} strokeWidth="1.2" />
      {/* Neck */}
      <rect x="89" y="64" width="22" height="22" rx="4" fill={skin} stroke={skinStroke} strokeWidth="1" />
      {/* Shoulders bar */}
      <rect x="55" y="85" width="90" height="12" rx="6" fill={skin} stroke={skinStroke} strokeWidth="1" />
      {/* Upper torso */}
      <path d="M 68,88 L 55,88 L 55,96 L 68,100 Z" fill={skin} />
      <path d="M 132,88 L 145,88 L 145,96 L 132,100 Z" fill={skin} />
      {/* Torso */}
      <path d="M 68,98 L 132,98 L 135,200 L 130,235 L 100,240 L 70,235 L 65,200 Z" fill={skin} stroke={skinStroke} strokeWidth="1" />
      {/* Hips */}
      <path d="M 65,200 L 135,200 L 132,240 L 68,240 Z" fill={skin} stroke={skinStroke} strokeWidth="1" />
      {/* Left arm */}
      <path d="M 55,88 L 43,92 L 38,160 L 42,230 L 52,230 L 54,165 L 62,100 Z" fill={skin} stroke={skinStroke} strokeWidth="1" />
      {/* Right arm */}
      <path d="M 145,88 L 157,92 L 162,160 L 158,230 L 148,230 L 146,165 L 138,100 Z" fill={skin} stroke={skinStroke} strokeWidth="1" />
      {/* Left thigh */}
      <path d="M 68,240 L 68,348 L 92,348 L 100,240 Z" fill={skin} stroke={skinStroke} strokeWidth="1" />
      {/* Right thigh */}
      <path d="M 132,240 L 132,348 L 108,348 L 100,240 Z" fill={skin} stroke={skinStroke} strokeWidth="1" />
      {/* Left lower leg */}
      <path d="M 68,348 L 68,448 L 90,448 L 92,348 Z" fill={skin} stroke={skinStroke} strokeWidth="1" />
      {/* Right lower leg */}
      <path d="M 132,348 L 132,448 L 110,448 L 108,348 Z" fill={skin} stroke={skinStroke} strokeWidth="1" />
      {/* Feet */}
      <ellipse cx="79" cy="452" rx="16" ry="7" fill={skin} stroke={skinStroke} strokeWidth="1" />
      <ellipse cx="121" cy="452" rx="16" ry="7" fill={skin} stroke={skinStroke} strokeWidth="1" />

      {/* ── Muscle groups ── */}
      {/* Left deltoid */}
      <ellipse cx="55" cy="102" rx="16" ry="18" fill={c("left-delt")} opacity={o("left-delt")} filter={glow("left-delt")} />
      {/* Right deltoid */}
      <ellipse cx="145" cy="102" rx="16" ry="18" fill={c("right-delt")} opacity={o("right-delt")} filter={glow("right-delt")} />

      {/* Left pec */}
      <path d="M 68,102 C 68,98 82,96 96,105 C 100,108 100,128 97,132 C 85,136 68,130 65,118 C 63,110 65,105 68,102 Z"
        fill={c("left-pec")} opacity={o("left-pec")} filter={glow("left-pec")} />
      {/* Right pec */}
      <path d="M 132,102 C 132,98 118,96 104,105 C 100,108 100,128 103,132 C 115,136 132,130 135,118 C 137,110 135,105 132,102 Z"
        fill={c("right-pec")} opacity={o("right-pec")} filter={glow("right-pec")} />

      {/* Left bicep */}
      <ellipse cx="44" cy="148" rx="10" ry="24" fill={c("left-bicep")} opacity={o("left-bicep")} filter={glow("left-bicep")} />
      {/* Right bicep */}
      <ellipse cx="156" cy="148" rx="10" ry="24" fill={c("right-bicep")} opacity={o("right-bicep")} filter={glow("right-bicep")} />

      {/* Left forearm */}
      <ellipse cx="43" cy="200" rx="8" ry="20" fill={c("left-forearm")} opacity={o("left-forearm")} filter={glow("left-forearm")} />
      {/* Right forearm */}
      <ellipse cx="157" cy="200" rx="8" ry="20" fill={c("right-forearm")} opacity={o("right-forearm")} filter={glow("right-forearm")} />

      {/* Abs — 6 blocks */}
      <rect x="83" y="140" width="14" height="16" rx="4" fill={c("abs-1")} opacity={o("abs-1")} filter={glow("abs-1")} />
      <rect x="103" y="140" width="14" height="16" rx="4" fill={c("abs-2")} opacity={o("abs-2")} filter={glow("abs-2")} />
      <rect x="83" y="160" width="14" height="16" rx="4" fill={c("abs-3")} opacity={o("abs-3")} filter={glow("abs-3")} />
      <rect x="103" y="160" width="14" height="16" rx="4" fill={c("abs-4")} opacity={o("abs-4")} filter={glow("abs-4")} />
      <rect x="83" y="180" width="14" height="16" rx="4" fill={c("abs-5")} opacity={o("abs-5")} filter={glow("abs-5")} />
      <rect x="103" y="180" width="14" height="16" rx="4" fill={c("abs-6")} opacity={o("abs-6")} filter={glow("abs-6")} />

      {/* Left oblique */}
      <ellipse cx="70" cy="172" rx="8" ry="28" fill={c("left-oblique")} opacity={o("left-oblique")} filter={glow("left-oblique")} />
      {/* Right oblique */}
      <ellipse cx="130" cy="172" rx="8" ry="28" fill={c("right-oblique")} opacity={o("right-oblique")} filter={glow("right-oblique")} />

      {/* Left quad */}
      <path d="M 70,248 L 68,342 L 91,345 L 99,248 Z"
        fill={c("left-quad")} opacity={o("left-quad")} filter={glow("left-quad")} />
      {/* Right quad */}
      <path d="M 130,248 L 132,342 L 109,345 L 101,248 Z"
        fill={c("right-quad")} opacity={o("right-quad")} filter={glow("right-quad")} />

      {/* Left knee */}
      <ellipse cx="80" cy="353" rx="13" ry="10" fill={c("left-knee")} opacity={o("left-knee")} />
      {/* Right knee */}
      <ellipse cx="120" cy="353" rx="13" ry="10" fill={c("right-knee")} opacity={o("right-knee")} />

      {/* Left shin */}
      <path d="M 70,364 L 68,440 L 88,440 L 90,364 Z"
        fill={c("left-shin")} opacity={o("left-shin")} filter={glow("left-shin")} />
      {/* Right shin */}
      <path d="M 130,364 L 132,440 L 112,440 L 110,364 Z"
        fill={c("right-shin")} opacity={o("right-shin")} filter={glow("right-shin")} />

      {/* Separator lines */}
      <line x1="100" y1="105" x2="100" y2="135" stroke="hsl(220 15% 12%)" strokeWidth="1" opacity="0.6" />
      <line x1="80" y1="135" x2="120" y2="135" stroke="hsl(220 15% 12%)" strokeWidth="1" opacity="0.5" />
      <line x1="80" y1="156" x2="120" y2="156" stroke="hsl(220 15% 12%)" strokeWidth="1" opacity="0.5" />
      <line x1="80" y1="176" x2="120" y2="176" stroke="hsl(220 15% 12%)" strokeWidth="1" opacity="0.5" />
      <line x1="100" y1="135" x2="100" y2="196" stroke="hsl(220 15% 12%)" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

function BackBodySVG({ activeMuscles }: { activeMuscles: string[] }) {
  const active = buildActiveSet(BACK_MUSCLE_MAP, activeMuscles);
  const c = (id: string) => active.has(id) ? "hsl(var(--primary))" : "hsl(220 15% 25%)";
  const o = (id: string) => active.has(id) ? 0.92 : 0.65;
  const glow = (id: string) => active.has(id) ? "url(#glow-b)" : undefined;
  const skin = "hsl(220 15% 18%)";
  const skinStroke = "hsl(220 15% 30%)";

  return (
    <svg viewBox="0 0 200 480" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <defs>
        <filter id="glow-b" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Body silhouette */}
      <ellipse cx="100" cy="36" rx="26" ry="30" fill={skin} stroke={skinStroke} strokeWidth="1.2" />
      <rect x="89" y="64" width="22" height="22" rx="4" fill={skin} stroke={skinStroke} strokeWidth="1" />
      <rect x="55" y="85" width="90" height="12" rx="6" fill={skin} stroke={skinStroke} strokeWidth="1" />
      <path d="M 68,98 L 132,98 L 135,200 L 130,235 L 100,240 L 70,235 L 65,200 Z" fill={skin} stroke={skinStroke} strokeWidth="1" />
      <path d="M 65,200 L 135,200 L 132,240 L 68,240 Z" fill={skin} stroke={skinStroke} strokeWidth="1" />
      <path d="M 55,88 L 43,92 L 38,160 L 42,230 L 52,230 L 54,165 L 62,100 Z" fill={skin} stroke={skinStroke} strokeWidth="1" />
      <path d="M 145,88 L 157,92 L 162,160 L 158,230 L 148,230 L 146,165 L 138,100 Z" fill={skin} stroke={skinStroke} strokeWidth="1" />
      <path d="M 68,240 L 68,348 L 92,348 L 100,240 Z" fill={skin} stroke={skinStroke} strokeWidth="1" />
      <path d="M 132,240 L 132,348 L 108,348 L 100,240 Z" fill={skin} stroke={skinStroke} strokeWidth="1" />
      <path d="M 68,348 L 68,448 L 90,448 L 92,348 Z" fill={skin} stroke={skinStroke} strokeWidth="1" />
      <path d="M 132,348 L 132,448 L 110,448 L 108,348 Z" fill={skin} stroke={skinStroke} strokeWidth="1" />
      <ellipse cx="79" cy="452" rx="16" ry="7" fill={skin} stroke={skinStroke} strokeWidth="1" />
      <ellipse cx="121" cy="452" rx="16" ry="7" fill={skin} stroke={skinStroke} strokeWidth="1" />

      {/* Trapezius */}
      <path d="M 90,66 C 85,75 68,88 55,100 C 70,112 88,118 100,120 C 112,118 130,112 145,100 C 132,88 115,75 110,66 Z"
        fill={c("traps")} opacity={o("traps")} filter={glow("traps")} />

      {/* Left rear delt */}
      <ellipse cx="50" cy="104" rx="14" ry="16" fill={c("left-rear-delt")} opacity={o("left-rear-delt")} filter={glow("left-rear-delt")} />
      {/* Right rear delt */}
      <ellipse cx="150" cy="104" rx="14" ry="16" fill={c("right-rear-delt")} opacity={o("right-rear-delt")} filter={glow("right-rear-delt")} />

      {/* Left lat */}
      <path d="M 55,102 C 48,115 44,140 48,175 C 52,195 63,210 72,218 C 75,205 75,185 73,163 C 71,142 64,120 55,102 Z"
        fill={c("left-lat")} opacity={o("left-lat")} filter={glow("left-lat")} />
      {/* Right lat */}
      <path d="M 145,102 C 152,115 156,140 152,175 C 148,195 137,210 128,218 C 125,205 125,185 127,163 C 129,142 136,120 145,102 Z"
        fill={c("right-lat")} opacity={o("right-lat")} filter={glow("right-lat")} />

      {/* Left rhomboid */}
      <path d="M 80,120 L 100,125 L 100,148 L 76,140 Z"
        fill={c("left-rhomboid")} opacity={o("left-rhomboid")} filter={glow("left-rhomboid")} />
      {/* Right rhomboid */}
      <path d="M 120,120 L 100,125 L 100,148 L 124,140 Z"
        fill={c("right-rhomboid")} opacity={o("right-rhomboid")} filter={glow("right-rhomboid")} />

      {/* Left tricep */}
      <ellipse cx="44" cy="152" rx="10" ry="26" fill={c("left-tricep")} opacity={o("left-tricep")} filter={glow("left-tricep")} />
      {/* Right tricep */}
      <ellipse cx="156" cy="152" rx="10" ry="26" fill={c("right-tricep")} opacity={o("right-tricep")} filter={glow("right-tricep")} />

      {/* Left forearm back */}
      <ellipse cx="43" cy="200" rx="8" ry="20" fill={c("left-forearm-b")} opacity={o("left-forearm-b")} filter={glow("left-forearm-b")} />
      {/* Right forearm back */}
      <ellipse cx="157" cy="200" rx="8" ry="20" fill={c("right-forearm-b")} opacity={o("right-forearm-b")} filter={glow("right-forearm-b")} />

      {/* Lower back left erector */}
      <rect x="88" y="195" width="10" height="44" rx="5" fill={c("lower-back-l")} opacity={o("lower-back-l")} filter={glow("lower-back-l")} />
      {/* Lower back right erector */}
      <rect x="102" y="195" width="10" height="44" rx="5" fill={c("lower-back-r")} opacity={o("lower-back-r")} filter={glow("lower-back-r")} />

      {/* Left glute */}
      <path d="M 68,242 C 65,258 64,278 68,295 C 72,308 84,314 96,312 C 100,308 100,296 100,282 L 100,250 C 100,244 90,240 78,242 Z"
        fill={c("left-glute")} opacity={o("left-glute")} filter={glow("left-glute")} />
      {/* Right glute */}
      <path d="M 132,242 C 135,258 136,278 132,295 C 128,308 116,314 104,312 C 100,308 100,296 100,282 L 100,250 C 100,244 110,240 122,242 Z"
        fill={c("right-glute")} opacity={o("right-glute")} filter={glow("right-glute")} />

      {/* Left hamstring */}
      <path d="M 70,315 L 69,345 L 91,348 L 99,315 Z"
        fill={c("left-hamstring")} opacity={o("left-hamstring")} filter={glow("left-hamstring")} />
      {/* Right hamstring */}
      <path d="M 130,315 L 131,345 L 109,348 L 101,315 Z"
        fill={c("right-hamstring")} opacity={o("right-hamstring")} filter={glow("right-hamstring")} />

      {/* Left calf */}
      <path d="M 70,364 C 68,382 68,415 70,440 L 88,440 C 90,415 90,382 90,364 C 87,362 74,362 70,364 Z"
        fill={c("left-calf")} opacity={o("left-calf")} filter={glow("left-calf")} />
      {/* Right calf */}
      <path d="M 130,364 C 132,382 132,415 130,440 L 112,440 C 110,415 110,382 110,364 C 113,362 126,362 130,364 Z"
        fill={c("right-calf")} opacity={o("right-calf")} filter={glow("right-calf")} />

      {/* Spine line */}
      <line x1="100" y1="90" x2="100" y2="238" stroke="hsl(220 15% 12%)" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}

export function MuscleFigure3D({ activeMuscles, size = 200, autoRotate = false }: Props) {
  const [rotation, setRotation] = useState(0);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const rafId = useRef<number>(0);
  const autoRotateRef = useRef(autoRotate);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    if (!autoRotate) return;
    let angle = rotation;
    const tick = () => {
      angle += 0.4;
      setRotation(angle);
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [autoRotate]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
    cancelAnimationFrame(rafId.current);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    setRotation(r => r + dx * 0.6);
  }, []);

  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    lastX.current = e.touches[0].clientX;
    cancelAnimationFrame(rafId.current);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - lastX.current;
    lastX.current = e.touches[0].clientX;
    setRotation(r => r + dx * 0.6);
  }, []);

  const onTouchEnd = useCallback(() => { isDragging.current = false; }, []);

  const height = size * (480 / 200);

  return (
    <div
      style={{ width: size, height, userSelect: "none", cursor: "grab" }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div style={{ perspective: "800px", width: "100%", height: "100%" }}>
        <div style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `rotateY(${rotation}deg)`,
          transition: isDragging.current ? "none" : "transform 0.05s linear",
        }}>
          {/* Front face */}
          <div style={{
            position: "absolute", inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}>
            <FrontBodySVG activeMuscles={activeMuscles} />
          </div>
          {/* Back face */}
          <div style={{
            position: "absolute", inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}>
            <BackBodySVG activeMuscles={activeMuscles} />
          </div>
        </div>
      </div>
    </div>
  );
}
