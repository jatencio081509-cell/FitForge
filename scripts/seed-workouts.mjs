const BASE = process.env.API_URL || "https://f171b0d5-de41-4af8-a21c-251fde98a577-00-3tya4zr8vvy7d.spock.replit.dev/api";

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed ${res.status}: ${text}`);
  }
  return res.json();
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed ${res.status}`);
  return res.json();
}

const exercises = await get("/exercises");
const byName = Object.fromEntries(exercises.map(e => [e.name, e.id]));
console.log(`Found ${exercises.length} exercises`);

const workouts = [
  {
    name: "Upper Body Power",
    description: "Build a powerful chest, shoulders, and arms with this compound-focused push/pull session.",
    difficulty: "intermediate",
    estimatedMinutes: 50,
    category: "strength",
    exercises: [
      { exerciseId: byName["Barbell Bench Press"], sets: 4, reps: 8, restSeconds: 90, orderIndex: 0 },
      { exerciseId: byName["Incline Dumbbell Press"], sets: 3, reps: 10, restSeconds: 60, orderIndex: 1 },
      { exerciseId: byName["Dumbbell Lateral Raise"], sets: 3, reps: 12, restSeconds: 45, orderIndex: 2 },
      { exerciseId: byName["Barbell Curl"], sets: 3, reps: 12, restSeconds: 60, orderIndex: 3 },
      { exerciseId: byName["Tricep Pushdown"], sets: 3, reps: 12, restSeconds: 60, orderIndex: 4 },
    ].filter(e => e.exerciseId),
  },
  {
    name: "Leg Day Destroyer",
    description: "Develop quad, hamstring, and glute strength with heavy compound lifts.",
    difficulty: "advanced",
    estimatedMinutes: 55,
    category: "strength",
    exercises: [
      { exerciseId: byName["Barbell Back Squat"], sets: 4, reps: 6, restSeconds: 120, orderIndex: 0 },
      { exerciseId: byName["Romanian Deadlift"], sets: 3, reps: 10, restSeconds: 90, orderIndex: 1 },
      { exerciseId: byName["Lunges"], sets: 3, reps: 12, restSeconds: 60, orderIndex: 2 },
      { exerciseId: byName["Goblet Squat"], sets: 3, reps: 15, restSeconds: 60, orderIndex: 3 },
    ].filter(e => e.exerciseId),
  },
  {
    name: "Full Body Forge",
    description: "A complete full-body workout hitting every major muscle group. Great for 3x per week training.",
    difficulty: "beginner",
    estimatedMinutes: 45,
    category: "strength",
    exercises: [
      { exerciseId: byName["Deadlift"], sets: 3, reps: 5, restSeconds: 120, orderIndex: 0 },
      { exerciseId: byName["Pull-Up"], sets: 3, reps: 8, restSeconds: 90, orderIndex: 1 },
      { exerciseId: byName["Overhead Press"], sets: 3, reps: 10, restSeconds: 90, orderIndex: 2 },
      { exerciseId: byName["Push-Up"], sets: 3, reps: 15, restSeconds: 45, orderIndex: 3 },
      { exerciseId: byName["Plank"], sets: 3, reps: 60, restSeconds: 45, orderIndex: 4 },
    ].filter(e => e.exerciseId),
  },
  {
    name: "HIIT Cardio Blast",
    description: "High-intensity interval training to torch calories and boost endurance in under 30 minutes.",
    difficulty: "intermediate",
    estimatedMinutes: 30,
    category: "cardio",
    exercises: [
      { exerciseId: byName["Burpee"], sets: 4, reps: 15, restSeconds: 30, orderIndex: 0 },
      { exerciseId: byName["Box Jump"], sets: 4, reps: 10, restSeconds: 30, orderIndex: 1 },
      { exerciseId: byName["Kettlebell Swing"], sets: 4, reps: 20, restSeconds: 30, orderIndex: 2 },
      { exerciseId: byName["Jump Rope"], sets: 3, reps: 100, restSeconds: 30, orderIndex: 3 },
    ].filter(e => e.exerciseId),
  },
  {
    name: "Back & Biceps",
    description: "Pull day focused on building a wide, thick back with bicep finishers.",
    difficulty: "intermediate",
    estimatedMinutes: 45,
    category: "strength",
    exercises: [
      { exerciseId: byName["Pull-Up"], sets: 4, reps: 8, restSeconds: 90, orderIndex: 0 },
      { exerciseId: byName["Barbell Row"], sets: 4, reps: 8, restSeconds: 90, orderIndex: 1 },
      { exerciseId: byName["Lat Pulldown"], sets: 3, reps: 12, restSeconds: 60, orderIndex: 2 },
      { exerciseId: byName["Seated Cable Row"], sets: 3, reps: 12, restSeconds: 60, orderIndex: 3 },
      { exerciseId: byName["Barbell Curl"], sets: 3, reps: 12, restSeconds: 60, orderIndex: 4 },
    ].filter(e => e.exerciseId),
  },
];

for (const w of workouts) {
  try {
    const result = await post("/workouts", w);
    console.log(`✓ Created: ${result.name} (${result.exerciseCount} exercises)`);
  } catch (e) {
    console.log(`✗ Failed to create ${w.name}: ${e.message}`);
  }
}
console.log("Done!");
