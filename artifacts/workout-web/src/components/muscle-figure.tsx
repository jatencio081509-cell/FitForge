interface MuscleFigureProps {
  activeMuscles: string[];
  size?: number;
}

const MUSCLE_REGIONS: Record<string, string[]> = {
  chest: ["left-pec", "right-pec"],
  back: ["left-trap", "right-trap"],
  legs: ["left-quad", "right-quad", "left-calf", "right-calf"],
  shoulders: ["left-delt", "right-delt", "left-trap", "right-trap"],
  arms: ["left-bicep", "right-bicep", "left-forearm", "right-forearm"],
  core: ["abs-tl", "abs-tr", "abs-ml", "abs-mr", "abs-bl", "abs-br", "left-oblique", "right-oblique"],
  full_body: [
    "left-pec", "right-pec", "left-delt", "right-delt", "left-trap", "right-trap",
    "left-bicep", "right-bicep", "left-forearm", "right-forearm",
    "abs-tl", "abs-tr", "abs-ml", "abs-mr", "abs-bl", "abs-br",
    "left-oblique", "right-oblique",
    "left-quad", "right-quad", "left-calf", "right-calf",
  ],
};

export function MuscleFigure({ activeMuscles, size = 180 }: MuscleFigureProps) {
  const activeSet = new Set<string>();
  for (const mg of activeMuscles) {
    for (const region of MUSCLE_REGIONS[mg] ?? []) activeSet.add(region);
  }

  const fill = (region: string) => activeSet.has(region) ? "hsl(var(--primary))" : "#1e2a3a";
  const opacity = (region: string) => activeSet.has(region) ? 0.9 : 0.55;

  const bodyFill = "#1e2a3a";
  const bodyOpacity = 0.7;

  return (
    <svg
      viewBox="0 0 140 360"
      width={size}
      height={size * (360 / 140)}
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 0 8px rgba(0,230,210,0.1))" }}
    >
      {/* ── HEAD ─────────────────────────────────────────── */}
      <circle cx="70" cy="18" r="15" fill={bodyFill} fillOpacity={bodyOpacity} />

      {/* ── NECK ─────────────────────────────────────────── */}
      <path d="M 63,32 L 77,32 L 75,46 L 65,46 Z" fill={bodyFill} fillOpacity={bodyOpacity} />

      {/* ── TRAPEZIUS (visible from front) ───────────────── */}
      <path
        id="left-trap"
        d="M 65,44 Q 44,50 24,66 Q 16,74 14,86 L 24,90 Q 26,80 40,70 Q 56,58 68,50 Z"
        fill={fill("left-trap")} fillOpacity={opacity("left-trap")}
      />
      <path
        id="right-trap"
        d="M 75,44 Q 96,50 116,66 Q 124,74 126,86 L 116,90 Q 114,80 100,70 Q 84,58 72,50 Z"
        fill={fill("right-trap")} fillOpacity={opacity("right-trap")}
      />

      {/* ── DELTOIDS ─────────────────────────────────────── */}
      <ellipse
        id="left-delt"
        cx="17" cy="86" rx="10" ry="13"
        fill={fill("left-delt")} fillOpacity={opacity("left-delt")}
      />
      <ellipse
        id="right-delt"
        cx="123" cy="86" rx="10" ry="13"
        fill={fill("right-delt")} fillOpacity={opacity("right-delt")}
      />

      {/* ── BICEPS ───────────────────────────────────────── */}
      <path
        id="left-bicep"
        d="M 11,96 Q 4,110 4,128 Q 4,142 12,146 Q 22,150 28,140 Q 34,126 30,102 Z"
        fill={fill("left-bicep")} fillOpacity={opacity("left-bicep")}
      />
      <path
        id="right-bicep"
        d="M 129,96 Q 136,110 136,128 Q 136,142 128,146 Q 118,150 112,140 Q 106,126 110,102 Z"
        fill={fill("right-bicep")} fillOpacity={opacity("right-bicep")}
      />

      {/* ── FOREARMS ─────────────────────────────────────── */}
      <path
        id="left-forearm"
        d="M 10,148 Q 2,164 4,182 Q 6,194 16,196 Q 26,196 30,184 Q 32,170 28,152 Z"
        fill={fill("left-forearm")} fillOpacity={opacity("left-forearm")}
      />
      <path
        id="right-forearm"
        d="M 130,148 Q 138,164 136,182 Q 134,194 124,196 Q 114,196 110,184 Q 108,170 112,152 Z"
        fill={fill("right-forearm")} fillOpacity={opacity("right-forearm")}
      />

      {/* ── PECTORALS ─────────────────────────────────────── */}
      <path
        id="left-pec"
        d="M 36,66 Q 24,74 22,92 Q 20,106 32,114 Q 46,120 60,114 Q 68,108 68,94 L 68,66 Z"
        fill={fill("left-pec")} fillOpacity={opacity("left-pec")}
      />
      <path
        id="right-pec"
        d="M 104,66 Q 116,74 118,92 Q 120,106 108,114 Q 94,120 80,114 Q 72,108 72,94 L 72,66 Z"
        fill={fill("right-pec")} fillOpacity={opacity("right-pec")}
      />

      {/* ── ABS (6-pack) ─────────────────────────────────── */}
      <rect id="abs-tl" x="54" y="116" width="13" height="12" rx="3"
        fill={fill("abs-tl")} fillOpacity={opacity("abs-tl")} />
      <rect id="abs-tr" x="73" y="116" width="13" height="12" rx="3"
        fill={fill("abs-tr")} fillOpacity={opacity("abs-tr")} />
      <rect id="abs-ml" x="54" y="132" width="13" height="12" rx="3"
        fill={fill("abs-ml")} fillOpacity={opacity("abs-ml")} />
      <rect id="abs-mr" x="73" y="132" width="13" height="12" rx="3"
        fill={fill("abs-mr")} fillOpacity={opacity("abs-mr")} />
      <rect id="abs-bl" x="54" y="148" width="13" height="11" rx="3"
        fill={fill("abs-bl")} fillOpacity={opacity("abs-bl")} />
      <rect id="abs-br" x="73" y="148" width="13" height="11" rx="3"
        fill={fill("abs-br")} fillOpacity={opacity("abs-br")} />

      {/* ── OBLIQUES ─────────────────────────────────────── */}
      <path
        id="left-oblique"
        d="M 34,112 Q 24,134 26,162 L 50,166 L 52,118 Z"
        fill={fill("left-oblique")} fillOpacity={opacity("left-oblique")}
      />
      <path
        id="right-oblique"
        d="M 106,112 Q 116,134 114,162 L 90,166 L 88,118 Z"
        fill={fill("right-oblique")} fillOpacity={opacity("right-oblique")}
      />

      {/* ── HIP / PELVIS CONNECTOR ───────────────────────── */}
      <path d="M 32,182 Q 26,192 30,202 L 110,202 Q 114,192 108,182 Z"
        fill={bodyFill} fillOpacity={bodyOpacity} />

      {/* ── QUADRICEPS ────────────────────────────────────── */}
      <path
        id="left-quad"
        d="M 30,202 Q 20,224 20,256 Q 20,276 30,284 Q 44,292 56,286 Q 68,278 70,256 Q 72,230 68,208 L 68,202 Z"
        fill={fill("left-quad")} fillOpacity={opacity("left-quad")}
      />
      <path
        id="right-quad"
        d="M 72,202 L 72,208 Q 68,230 70,256 Q 72,278 84,286 Q 96,292 110,284 Q 120,276 120,256 Q 120,224 110,202 Z"
        fill={fill("right-quad")} fillOpacity={opacity("right-quad")}
      />

      {/* ── CALVES ───────────────────────────────────────── */}
      <path
        id="left-calf"
        d="M 28,288 Q 18,308 20,328 Q 22,344 34,348 Q 48,352 56,342 Q 64,330 62,308 Q 58,292 46,288 Z"
        fill={fill("left-calf")} fillOpacity={opacity("left-calf")}
      />
      <path
        id="right-calf"
        d="M 112,288 Q 122,308 120,328 Q 118,344 106,348 Q 92,352 84,342 Q 76,330 78,308 Q 82,292 94,288 Z"
        fill={fill("right-calf")} fillOpacity={opacity("right-calf")}
      />

      {/* ── BODY OUTLINE (stroke only, on top) ───────────── */}
      <circle cx="70" cy="18" r="15" fill="none" stroke="#334155" strokeWidth="1" />
      <path d="M 63,32 L 77,32 L 75,46 L 65,46 Z" fill="none" stroke="#334155" strokeWidth="0.8" />
      {/* torso outline */}
      <path d="M 26,66 Q 18,80 20,102 L 30,184 Q 34,196 48,200 L 92,200 Q 106,196 110,184 L 120,102 Q 122,80 114,66 L 26,66 Z"
        fill="none" stroke="#334155" strokeWidth="1" />
      {/* left arm */}
      <path d="M 14,76 Q 2,96 2,132 Q 2,168 8,190 Q 12,200 22,200"
        fill="none" stroke="#334155" strokeWidth="1" />
      {/* right arm */}
      <path d="M 126,76 Q 138,96 138,132 Q 138,168 132,190 Q 128,200 118,200"
        fill="none" stroke="#334155" strokeWidth="1" />
      {/* left leg */}
      <path d="M 30,202 Q 16,230 16,260 Q 16,290 22,316 Q 26,346 40,352"
        fill="none" stroke="#334155" strokeWidth="1" />
      {/* right leg */}
      <path d="M 110,202 Q 124,230 124,260 Q 124,290 118,316 Q 114,346 100,352"
        fill="none" stroke="#334155" strokeWidth="1" />
    </svg>
  );
}

export function getMusclesForWorkout(exercises: Array<{ muscleGroup?: string | null }>): string[] {
  const groups = new Set<string>();
  for (const ex of exercises) {
    if (ex.muscleGroup) groups.add(ex.muscleGroup);
  }
  return Array.from(groups);
}
