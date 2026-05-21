#!/usr/bin/env node
/**
 * Full seed: creates 100+ exercises + 50+ workout plans.
 * Usage: node scripts/seed-full.mjs
 * Requires DATABASE_URL env var.
 */
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// ─────────────────────────────────────────────────────────────
// EXERCISES  (120 total)
// ─────────────────────────────────────────────────────────────
const exercises = [
  // CHEST (16)
  { name: "Barbell Bench Press", category: "strength", muscleGroup: "chest", equipment: "barbell", description: "Classic flat bench press with a barbell." },
  { name: "Incline Barbell Press", category: "strength", muscleGroup: "chest", equipment: "barbell", description: "Upper chest emphasis on incline bench." },
  { name: "Decline Barbell Press", category: "strength", muscleGroup: "chest", equipment: "barbell", description: "Lower chest emphasis on decline bench." },
  { name: "Dumbbell Bench Press", category: "strength", muscleGroup: "chest", equipment: "dumbbell", description: "Greater range of motion than barbell press." },
  { name: "Incline Dumbbell Press", category: "strength", muscleGroup: "chest", equipment: "dumbbell", description: "Incline press with dumbbells." },
  { name: "Cable Flye", category: "strength", muscleGroup: "chest", equipment: "cable", description: "Cable crossover isolation for pec stretch." },
  { name: "Dumbbell Flye", category: "strength", muscleGroup: "chest", equipment: "dumbbell", description: "Pec isolation with wide arc motion." },
  { name: "Push-Up", category: "strength", muscleGroup: "chest", equipment: "bodyweight", description: "Classic push-up, compound chest + triceps." },
  { name: "Wide Push-Up", category: "strength", muscleGroup: "chest", equipment: "bodyweight", description: "Wide hand placement for more chest activation." },
  { name: "Pec Deck Machine", category: "strength", muscleGroup: "chest", equipment: "machine", description: "Chest fly isolation on pec deck." },
  { name: "Smith Machine Bench Press", category: "strength", muscleGroup: "chest", equipment: "machine", description: "Bench press on guided Smith machine." },
  { name: "Chest Dip", category: "strength", muscleGroup: "chest", equipment: "bodyweight", description: "Parallel bar dip leaning forward for chest." },
  { name: "Landmine Press", category: "strength", muscleGroup: "chest", equipment: "barbell", description: "Angled press using a landmine attachment." },
  { name: "Svend Press", category: "strength", muscleGroup: "chest", equipment: "other", description: "Plate press with constant squeeze." },
  { name: "Cable Low Flye", category: "strength", muscleGroup: "chest", equipment: "cable", description: "Low cable flye hitting upper chest." },
  { name: "Hex Press", category: "strength", muscleGroup: "chest", equipment: "dumbbell", description: "Close-grip dumbbell press squeezing plates together." },

  // BACK (16)
  { name: "Deadlift", category: "strength", muscleGroup: "back", equipment: "barbell", description: "King of all lifts — full posterior chain." },
  { name: "Romanian Deadlift", category: "strength", muscleGroup: "back", equipment: "barbell", description: "Hip-hinge deadlift targeting hamstrings and lower back." },
  { name: "Barbell Row", category: "strength", muscleGroup: "back", equipment: "barbell", description: "Bent-over row for upper back thickness." },
  { name: "T-Bar Row", category: "strength", muscleGroup: "back", equipment: "barbell", description: "Landmine row for mid-back thickness." },
  { name: "Seated Cable Row", category: "strength", muscleGroup: "back", equipment: "cable", description: "Seated row targeting mid and lower traps." },
  { name: "Lat Pulldown", category: "strength", muscleGroup: "back", equipment: "cable", description: "Wide grip lat pulldown for width." },
  { name: "Close Grip Pulldown", category: "strength", muscleGroup: "back", equipment: "cable", description: "Neutral grip for lower lat focus." },
  { name: "Pull-Up", category: "strength", muscleGroup: "back", equipment: "bodyweight", description: "Wide grip bodyweight pull-up." },
  { name: "Chin-Up", category: "strength", muscleGroup: "back", equipment: "bodyweight", description: "Underhand grip, more bicep involvement." },
  { name: "One-Arm Dumbbell Row", category: "strength", muscleGroup: "back", equipment: "dumbbell", description: "Unilateral row for lat and rhomboid." },
  { name: "Face Pull", category: "strength", muscleGroup: "back", equipment: "cable", description: "Rear delt and external rotation pull." },
  { name: "Good Morning", category: "strength", muscleGroup: "back", equipment: "barbell", description: "Hip hinge with barbell for erectors." },
  { name: "Cable Straight-Arm Pulldown", category: "strength", muscleGroup: "back", equipment: "cable", description: "Isolation for lats with straight arms." },
  { name: "Pendlay Row", category: "strength", muscleGroup: "back", equipment: "barbell", description: "Strict row from the floor each rep." },
  { name: "Rack Pull", category: "strength", muscleGroup: "back", equipment: "barbell", description: "Partial range deadlift from knee height." },
  { name: "Machine Row", category: "strength", muscleGroup: "back", equipment: "machine", description: "Chest-supported row machine." },

  // LEGS (16)
  { name: "Barbell Back Squat", category: "strength", muscleGroup: "legs", equipment: "barbell", description: "King of leg movements. High bar or low bar." },
  { name: "Front Squat", category: "strength", muscleGroup: "legs", equipment: "barbell", description: "Quad-dominant squat with bar in front rack." },
  { name: "Leg Press", category: "strength", muscleGroup: "legs", equipment: "machine", description: "Machine leg press, great for volume." },
  { name: "Hack Squat", category: "strength", muscleGroup: "legs", equipment: "machine", description: "Angled squat machine targeting quads." },
  { name: "Bulgarian Split Squat", category: "strength", muscleGroup: "legs", equipment: "dumbbell", description: "Rear foot elevated split squat." },
  { name: "Leg Extension", category: "strength", muscleGroup: "legs", equipment: "machine", description: "Quad isolation on leg extension machine." },
  { name: "Lying Leg Curl", category: "strength", muscleGroup: "legs", equipment: "machine", description: "Hamstring isolation lying down." },
  { name: "Seated Leg Curl", category: "strength", muscleGroup: "legs", equipment: "machine", description: "Seated hamstring curl machine." },
  { name: "Standing Calf Raise", category: "strength", muscleGroup: "legs", equipment: "machine", description: "Calf raise on standing machine." },
  { name: "Seated Calf Raise", category: "strength", muscleGroup: "legs", equipment: "machine", description: "Seated calf raise targeting soleus." },
  { name: "Romanian Deadlift (DB)", category: "strength", muscleGroup: "legs", equipment: "dumbbell", description: "Dumbbell RDL for hamstrings." },
  { name: "Goblet Squat", category: "strength", muscleGroup: "legs", equipment: "dumbbell", description: "Dumbbell goblet squat, great for beginners." },
  { name: "Walking Lunge", category: "strength", muscleGroup: "legs", equipment: "dumbbell", description: "Alternating lunges with dumbbells." },
  { name: "Sumo Squat", category: "strength", muscleGroup: "legs", equipment: "dumbbell", description: "Wide-stance squat for inner thighs." },
  { name: "Nordic Curl", category: "strength", muscleGroup: "legs", equipment: "bodyweight", description: "Eccentric hamstring dominant bodyweight exercise." },
  { name: "Hip Thrust", category: "strength", muscleGroup: "legs", equipment: "barbell", description: "Barbell hip thrust for glutes." },

  // SHOULDERS (12)
  { name: "Overhead Press", category: "strength", muscleGroup: "shoulders", equipment: "barbell", description: "Standing barbell press above head." },
  { name: "Seated Dumbbell Press", category: "strength", muscleGroup: "shoulders", equipment: "dumbbell", description: "Seated overhead press with dumbbells." },
  { name: "Lateral Raise", category: "strength", muscleGroup: "shoulders", equipment: "dumbbell", description: "Side delt isolation with dumbbells." },
  { name: "Cable Lateral Raise", category: "strength", muscleGroup: "shoulders", equipment: "cable", description: "Side delt isolation with constant tension." },
  { name: "Front Raise", category: "strength", muscleGroup: "shoulders", equipment: "dumbbell", description: "Anterior delt raise with dumbbells." },
  { name: "Rear Delt Flye", category: "strength", muscleGroup: "shoulders", equipment: "dumbbell", description: "Bent-over rear delt flye." },
  { name: "Arnold Press", category: "strength", muscleGroup: "shoulders", equipment: "dumbbell", description: "Rotating dumbbell press developed by Arnold." },
  { name: "Upright Row", category: "strength", muscleGroup: "shoulders", equipment: "barbell", description: "Barbell upright row for side delts and traps." },
  { name: "Machine Shoulder Press", category: "strength", muscleGroup: "shoulders", equipment: "machine", description: "Guided overhead press on a machine." },
  { name: "Cable Face Pull", category: "strength", muscleGroup: "shoulders", equipment: "cable", description: "Face pull for rear delts and external rotation." },
  { name: "Barbell Shrug", category: "strength", muscleGroup: "shoulders", equipment: "barbell", description: "Trap isolation with heavy shrugs." },
  { name: "Dumbbell Shrug", category: "strength", muscleGroup: "shoulders", equipment: "dumbbell", description: "Trap isolation with dumbbells." },

  // ARMS (16)
  { name: "Barbell Curl", category: "strength", muscleGroup: "arms", equipment: "barbell", description: "Classic bicep curl with straight bar." },
  { name: "EZ Bar Curl", category: "strength", muscleGroup: "arms", equipment: "barbell", description: "Curl with EZ bar to reduce wrist stress." },
  { name: "Dumbbell Curl", category: "strength", muscleGroup: "arms", equipment: "dumbbell", description: "Alternating or simultaneous dumbbell curls." },
  { name: "Hammer Curl", category: "strength", muscleGroup: "arms", equipment: "dumbbell", description: "Neutral grip curl for brachialis." },
  { name: "Preacher Curl", category: "strength", muscleGroup: "arms", equipment: "barbell", description: "Strict curl on preacher bench." },
  { name: "Concentration Curl", category: "strength", muscleGroup: "arms", equipment: "dumbbell", description: "Seated isolation curl for peak contraction." },
  { name: "Cable Curl", category: "strength", muscleGroup: "arms", equipment: "cable", description: "Constant tension bicep curl with cable." },
  { name: "Incline Dumbbell Curl", category: "strength", muscleGroup: "arms", equipment: "dumbbell", description: "Curl on incline bench for full stretch." },
  { name: "Close Grip Bench Press", category: "strength", muscleGroup: "arms", equipment: "barbell", description: "Narrow grip bench for tricep focus." },
  { name: "Tricep Pushdown", category: "strength", muscleGroup: "arms", equipment: "cable", description: "Cable pushdown for tricep isolation." },
  { name: "Overhead Tricep Extension", category: "strength", muscleGroup: "arms", equipment: "dumbbell", description: "Dumbbell tricep extension overhead." },
  { name: "Skull Crusher", category: "strength", muscleGroup: "arms", equipment: "barbell", description: "Lying tricep extension — EZ bar or barbell." },
  { name: "Dips (Tricep)", category: "strength", muscleGroup: "arms", equipment: "bodyweight", description: "Upright dips with elbows close for triceps." },
  { name: "Kickback", category: "strength", muscleGroup: "arms", equipment: "dumbbell", description: "Bent-over tricep kickback for full extension." },
  { name: "Rope Pushdown", category: "strength", muscleGroup: "arms", equipment: "cable", description: "Rope attachment for lateral heads of tricep." },
  { name: "Reverse Curl", category: "strength", muscleGroup: "arms", equipment: "barbell", description: "Overhand grip curl for brachialis and forearms." },

  // CORE (12)
  { name: "Plank", category: "core", muscleGroup: "core", equipment: "bodyweight", description: "Isometric core hold in push-up position." },
  { name: "Side Plank", category: "core", muscleGroup: "core", equipment: "bodyweight", description: "Lateral plank for oblique strength." },
  { name: "Crunches", category: "core", muscleGroup: "core", equipment: "bodyweight", description: "Classic crunch for rectus abdominis." },
  { name: "Bicycle Crunch", category: "core", muscleGroup: "core", equipment: "bodyweight", description: "Rotational crunch for obliques." },
  { name: "Leg Raise", category: "core", muscleGroup: "core", equipment: "bodyweight", description: "Hanging or lying leg raise for lower abs." },
  { name: "Cable Crunch", category: "core", muscleGroup: "core", equipment: "cable", description: "Kneeling cable crunch for weighted ab work." },
  { name: "Ab Wheel Rollout", category: "core", muscleGroup: "core", equipment: "other", description: "Full core engagement with ab wheel." },
  { name: "Russian Twist", category: "core", muscleGroup: "core", equipment: "other", description: "Weighted rotational movement for obliques." },
  { name: "Dragon Flag", category: "core", muscleGroup: "core", equipment: "bodyweight", description: "Advanced full body core movement." },
  { name: "Pallof Press", category: "core", muscleGroup: "core", equipment: "cable", description: "Anti-rotation cable press for core stability." },
  { name: "Dead Bug", category: "core", muscleGroup: "core", equipment: "bodyweight", description: "Controlled core bracing and limb extension." },
  { name: "Hollow Body Hold", category: "core", muscleGroup: "core", equipment: "bodyweight", description: "Gymnastic-style posterior pelvic tilt hold." },

  // FULL BODY / CARDIO / COMPOUND (16)
  { name: "Barbell Clean", category: "olympic", muscleGroup: "full_body", equipment: "barbell", description: "Olympic lift pulling bar from floor to rack." },
  { name: "Power Clean", category: "olympic", muscleGroup: "full_body", equipment: "barbell", description: "Explosive pull ending in quarter squat." },
  { name: "Clean and Jerk", category: "olympic", muscleGroup: "full_body", equipment: "barbell", description: "Full Olympic clean and press overhead." },
  { name: "Snatch", category: "olympic", muscleGroup: "full_body", equipment: "barbell", description: "Single-movement Olympic lift overhead." },
  { name: "Thruster", category: "strength", muscleGroup: "full_body", equipment: "barbell", description: "Front squat to push press combination." },
  { name: "Burpee", category: "cardio", muscleGroup: "full_body", equipment: "bodyweight", description: "High-intensity squat thrust movement." },
  { name: "Box Jump", category: "plyometrics", muscleGroup: "full_body", equipment: "other", description: "Explosive jump onto a plyometric box." },
  { name: "Kettlebell Swing", category: "strength", muscleGroup: "full_body", equipment: "kettlebell", description: "Hip-hinge explosive swing with kettlebell." },
  { name: "Kettlebell Clean", category: "strength", muscleGroup: "full_body", equipment: "kettlebell", description: "Single-arm kettlebell clean to rack position." },
  { name: "Turkish Get-Up", category: "strength", muscleGroup: "full_body", equipment: "kettlebell", description: "Multi-step full body stability movement." },
  { name: "Battle Rope Waves", category: "cardio", muscleGroup: "full_body", equipment: "other", description: "Alternating rope waves for conditioning." },
  { name: "Sled Push", category: "cardio", muscleGroup: "full_body", equipment: "other", description: "Pushing a weighted sled for conditioning." },
  { name: "Rowing Machine", category: "cardio", muscleGroup: "full_body", equipment: "machine", description: "Ergometer rowing for full body cardio." },
  { name: "Jump Rope", category: "cardio", muscleGroup: "full_body", equipment: "other", description: "Skipping rope for cardiovascular endurance." },
  { name: "Mountain Climbers", category: "cardio", muscleGroup: "full_body", equipment: "bodyweight", description: "Alternating knee drives in plank position." },
  { name: "Bear Crawl", category: "cardio", muscleGroup: "full_body", equipment: "bodyweight", description: "Quadrupedal locomotion for full body conditioning." },

  // CARDIO MACHINES (6)
  { name: "Treadmill Run", category: "cardio", muscleGroup: "full_body", equipment: "machine", description: "Running on a treadmill." },
  { name: "Stationary Bike", category: "cardio", muscleGroup: "legs", equipment: "machine", description: "Seated cycling for cardiovascular fitness." },
  { name: "Elliptical", category: "cardio", muscleGroup: "full_body", equipment: "machine", description: "Low-impact elliptical trainer." },
  { name: "Stair Climber", category: "cardio", muscleGroup: "legs", equipment: "machine", description: "Step mill stair climbing for glutes and cardio." },
  { name: "Assault Bike", category: "cardio", muscleGroup: "full_body", equipment: "machine", description: "Air resistance bike for high intensity intervals." },
  { name: "Ski Erg", category: "cardio", muscleGroup: "full_body", equipment: "machine", description: "SkiErg for upper body dominant cardio." },

  // MOBILITY / FLEXIBILITY (10)
  { name: "Hip Flexor Stretch", category: "mobility", muscleGroup: "legs", equipment: "bodyweight", description: "Kneeling lunge hip flexor stretch." },
  { name: "Hamstring Stretch", category: "mobility", muscleGroup: "legs", equipment: "bodyweight", description: "Standing or seated hamstring stretch." },
  { name: "Thoracic Extension", category: "mobility", muscleGroup: "back", equipment: "other", description: "T-spine extension over foam roller." },
  { name: "World's Greatest Stretch", category: "mobility", muscleGroup: "full_body", equipment: "bodyweight", description: "Multi-plane mobility drill." },
  { name: "90/90 Hip Stretch", category: "mobility", muscleGroup: "legs", equipment: "bodyweight", description: "Seated internal and external hip rotation." },
  { name: "Pigeon Pose", category: "mobility", muscleGroup: "legs", equipment: "bodyweight", description: "Hip opener targeting external rotators." },
  { name: "Lat Stretch", category: "mobility", muscleGroup: "back", equipment: "other", description: "Overhead lat stretch hanging or at rack." },
  { name: "Chest Opener", category: "mobility", muscleGroup: "chest", equipment: "bodyweight", description: "Pec stretch with arms behind back." },
  { name: "Ankle Mobility Drill", category: "mobility", muscleGroup: "legs", equipment: "bodyweight", description: "Wall drill to improve ankle dorsiflexion." },
  { name: "Cat-Cow", category: "mobility", muscleGroup: "back", equipment: "bodyweight", description: "Spinal flexion and extension on all fours." },
];

// ─────────────────────────────────────────────────────────────
// WORKOUT PLANS  (54 total)
// ─────────────────────────────────────────────────────────────
const workouts = [
  // ── Beginner Programs (8) ────────────────────────────────
  { name: "Full Body Starter A", description: "Beginner full-body workout for foundational strength.", difficulty: "beginner", estimatedMinutes: 45, category: "strength" },
  { name: "Full Body Starter B", description: "Alternate with Starter A for a 3-day/week program.", difficulty: "beginner", estimatedMinutes: 45, category: "strength" },
  { name: "Bodyweight Basics", description: "No equipment needed. Perfect for beginners at home.", difficulty: "beginner", estimatedMinutes: 30, category: "bodyweight" },
  { name: "Dumbbell Only Beginner", description: "Full body workout using only a pair of dumbbells.", difficulty: "beginner", estimatedMinutes: 40, category: "strength" },
  { name: "Morning Mobility Flow", description: "Gentle 30-minute mobility and flexibility routine.", difficulty: "beginner", estimatedMinutes: 30, category: "mobility" },
  { name: "Beginner Cardio Conditioning", description: "Low intensity cardio intervals for base conditioning.", difficulty: "beginner", estimatedMinutes: 30, category: "cardio" },
  { name: "First Week Strength", description: "Simple intro to compound movements for week 1.", difficulty: "beginner", estimatedMinutes: 40, category: "strength" },
  { name: "Core Foundations", description: "Build a solid core foundation with beginner-friendly moves.", difficulty: "beginner", estimatedMinutes: 25, category: "core" },

  // ── Intermediate — Upper/Lower Split (8) ─────────────────
  { name: "Upper Body A", description: "Horizontal push/pull emphasis for upper body.", difficulty: "intermediate", estimatedMinutes: 55, category: "strength" },
  { name: "Upper Body B", description: "Vertical push/pull emphasis for upper body.", difficulty: "intermediate", estimatedMinutes: 55, category: "strength" },
  { name: "Lower Body A", description: "Squat-pattern dominant lower body session.", difficulty: "intermediate", estimatedMinutes: 55, category: "strength" },
  { name: "Lower Body B", description: "Hinge-pattern dominant lower body session.", difficulty: "intermediate", estimatedMinutes: 55, category: "strength" },
  { name: "Push Day", description: "Chest, shoulders, and triceps compound and isolation work.", difficulty: "intermediate", estimatedMinutes: 60, category: "strength" },
  { name: "Pull Day", description: "Back, biceps, and rear delts compound and isolation work.", difficulty: "intermediate", estimatedMinutes: 60, category: "strength" },
  { name: "Leg Day", description: "Quad, hamstring, glute, and calf comprehensive session.", difficulty: "intermediate", estimatedMinutes: 65, category: "strength" },
  { name: "Active Recovery", description: "Light movement, foam rolling, and mobility work.", difficulty: "beginner", estimatedMinutes: 30, category: "mobility" },

  // ── Intermediate — Hypertrophy (8) ───────────────────────
  { name: "Chest & Triceps Hypertrophy", description: "Volume-focused push session for muscle size.", difficulty: "intermediate", estimatedMinutes: 65, category: "hypertrophy" },
  { name: "Back & Biceps Hypertrophy", description: "High volume pulling session for back width and thickness.", difficulty: "intermediate", estimatedMinutes: 65, category: "hypertrophy" },
  { name: "Shoulder Hypertrophy", description: "All three delt heads with lateral raises and presses.", difficulty: "intermediate", estimatedMinutes: 50, category: "hypertrophy" },
  { name: "Legs Hypertrophy", description: "High volume quad and hamstring session.", difficulty: "intermediate", estimatedMinutes: 70, category: "hypertrophy" },
  { name: "Arm Specialization", description: "Dedicated bicep and tricep volume day.", difficulty: "intermediate", estimatedMinutes: 45, category: "hypertrophy" },
  { name: "Chest Specialization", description: "High volume chest with multiple angles and tempos.", difficulty: "intermediate", estimatedMinutes: 60, category: "hypertrophy" },
  { name: "Back Specialization", description: "Thickness and width focus with heavy rows and pulldowns.", difficulty: "intermediate", estimatedMinutes: 60, category: "hypertrophy" },
  { name: "Glute Focus", description: "Glute-dominant lower body session.", difficulty: "intermediate", estimatedMinutes: 55, category: "hypertrophy" },

  // ── Strength & Powerlifting (8) ───────────────────────────
  { name: "Squat Day (Strength)", description: "Squat-focused strength session with accessory work.", difficulty: "advanced", estimatedMinutes: 75, category: "powerlifting" },
  { name: "Bench Day (Strength)", description: "Bench press-focused session with tricep accessories.", difficulty: "advanced", estimatedMinutes: 70, category: "powerlifting" },
  { name: "Deadlift Day (Strength)", description: "Deadlift main lift with back accessories.", difficulty: "advanced", estimatedMinutes: 70, category: "powerlifting" },
  { name: "OHP Day (Strength)", description: "Overhead press as main movement.", difficulty: "advanced", estimatedMinutes: 65, category: "powerlifting" },
  { name: "5x5 Workout A", description: "StrongLifts 5x5 Workout A pattern.", difficulty: "intermediate", estimatedMinutes: 60, category: "strength" },
  { name: "5x5 Workout B", description: "StrongLifts 5x5 Workout B pattern.", difficulty: "intermediate", estimatedMinutes: 60, category: "strength" },
  { name: "Heavy Singles Day", description: "Max effort day working up to heavy singles.", difficulty: "advanced", estimatedMinutes: 80, category: "powerlifting" },
  { name: "Deload Week Workout", description: "Reduced intensity for recovery and adaptation.", difficulty: "beginner", estimatedMinutes: 40, category: "strength" },

  // ── Athletic & Conditioning (8) ──────────────────────────
  { name: "HIIT Circuit A", description: "High intensity interval training with bodyweight and kettlebells.", difficulty: "intermediate", estimatedMinutes: 35, category: "cardio" },
  { name: "HIIT Circuit B", description: "Metabolic conditioning circuit for fat loss.", difficulty: "intermediate", estimatedMinutes: 35, category: "cardio" },
  { name: "Athletic Power Development", description: "Box jumps, cleans, and explosive movements.", difficulty: "advanced", estimatedMinutes: 60, category: "athletic" },
  { name: "Kettlebell Conditioning", description: "Swings, cleans, snatches for full body conditioning.", difficulty: "intermediate", estimatedMinutes: 45, category: "conditioning" },
  { name: "Boxing Conditioning", description: "Shadow boxing, bag work, and footwork drills.", difficulty: "intermediate", estimatedMinutes: 45, category: "cardio" },
  { name: "Sprint Intervals", description: "Treadmill sprint intervals for speed and conditioning.", difficulty: "advanced", estimatedMinutes: 30, category: "cardio" },
  { name: "Functional Fitness", description: "Compound movements mimicking real-world patterns.", difficulty: "intermediate", estimatedMinutes: 50, category: "functional" },
  { name: "CrossFit-Style WOD", description: "Mixed modal workout combining strength and cardio.", difficulty: "advanced", estimatedMinutes: 40, category: "conditioning" },

  // ── Advanced Programs (8) ────────────────────────────────
  { name: "Advanced Push Day", description: "High-frequency heavy push with volume and intensity techniques.", difficulty: "advanced", estimatedMinutes: 75, category: "strength" },
  { name: "Advanced Pull Day", description: "Heavy rowing and pulling with accessory volume.", difficulty: "advanced", estimatedMinutes: 75, category: "strength" },
  { name: "Advanced Leg Day", description: "Squat, hinge, and single-leg work at high intensity.", difficulty: "advanced", estimatedMinutes: 80, category: "strength" },
  { name: "Olympic Lifting Session", description: "Snatch and clean & jerk technique and strength work.", difficulty: "advanced", estimatedMinutes: 75, category: "olympic" },
  { name: "Bodybuilding Chest Day", description: "Pre-exhaust techniques and high rep finishers.", difficulty: "advanced", estimatedMinutes: 70, category: "hypertrophy" },
  { name: "Mass Building Back Day", description: "Deadlifts, rows, and pulldowns for maximum back mass.", difficulty: "advanced", estimatedMinutes: 75, category: "hypertrophy" },
  { name: "Advanced Core & Abs", description: "Weighted core work, planks, and rotational strength.", difficulty: "advanced", estimatedMinutes: 40, category: "core" },
  { name: "Peak Week Pump Session", description: "Light weight, high rep pump work for show-day preparation.", difficulty: "intermediate", estimatedMinutes: 50, category: "hypertrophy" },

  // ── Speciality (6) ───────────────────────────────────────
  { name: "Mobility & Stretching Full Body", description: "Comprehensive 60-min flexibility and mobility session.", difficulty: "beginner", estimatedMinutes: 60, category: "mobility" },
  { name: "Posterior Chain Focus", description: "Deadlift, RDL, hamstring curls, and back extensions.", difficulty: "intermediate", estimatedMinutes: 60, category: "strength" },
  { name: "Core Stability Advanced", description: "Anti-rotation, anti-flexion, and stability challenges.", difficulty: "advanced", estimatedMinutes: 40, category: "core" },
  { name: "Shoulder Rehab & Prehab", description: "Rotator cuff strengthening and mobility.", difficulty: "beginner", estimatedMinutes: 30, category: "mobility" },
  { name: "Grip & Forearm Strength", description: "Wrist curls, farmer's carries, and plate pinches.", difficulty: "intermediate", estimatedMinutes: 25, category: "strength" },
  { name: "Mindful Yoga Flow", description: "Strength yoga blending flexibility with bodyweight resistance.", difficulty: "beginner", estimatedMinutes: 45, category: "yoga" },
];

async function main() {
  console.log("🌱 Seeding exercises...");

  // Clear existing data
  await db.execute(sql`TRUNCATE TABLE workout_exercises, workout_logs CASCADE`);
  await db.execute(sql`DELETE FROM exercises WHERE is_custom = false`);

  // Insert exercises in batches
  const BATCH = 20;
  let inserted = 0;
  for (let i = 0; i < exercises.length; i += BATCH) {
    const batch = exercises.slice(i, i + BATCH);
    const values = batch.map(e =>
      `('${e.name.replace(/'/g, "''")}', '${(e.description ?? "").replace(/'/g, "''")}', '${e.category}', '${e.muscleGroup}', '${e.equipment}', false, NOW())`
    ).join(",\n");

    await db.execute(sql.raw(`
      INSERT INTO exercises (name, description, category, muscle_group, equipment, is_custom, created_at)
      VALUES ${values}
      ON CONFLICT (name) DO NOTHING
    `));
    inserted += batch.length;
    process.stdout.write(`  exercises: ${inserted}/${exercises.length}\r`);
  }
  console.log(`\n✅ ${inserted} exercises seeded`);

  console.log("🌱 Seeding workout plans...");
  let wInserted = 0;
  for (const w of workouts) {
    await db.execute(sql.raw(`
      INSERT INTO workouts (name, description, difficulty, estimated_minutes, category, is_ai_generated, created_at)
      VALUES ('${w.name.replace(/'/g, "''")}', '${(w.description ?? "").replace(/'/g, "''")}', '${w.difficulty}', ${w.estimatedMinutes}, '${w.category}', false, NOW())
      ON CONFLICT DO NOTHING
    `));
    wInserted++;
    process.stdout.write(`  workouts: ${wInserted}/${workouts.length}\r`);
  }
  console.log(`\n✅ ${wInserted} workout plans seeded`);

  await pool.end();
  console.log("🎉 Seed complete!");
}

main().catch(e => { console.error(e); process.exit(1); });
