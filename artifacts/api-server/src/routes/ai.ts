import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { db, exercisesTable, workoutsTable, workoutExercisesTable } from "@workspace/db";
import {
  AiChatBody,
  AiGenerateWorkoutBody,
  AiChatResponse,
  AiGenerateWorkoutResponse,
  AiSuggestExercisesBody,
  AiSuggestExercisesResponse,
  AiWeightAdviceBody,
  AiWeightAdviceResponse,
} from "@workspace/api-zod";
import { serializeDates } from "../lib/serialize";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL ?? "https://openrouter.ai/api/v1",
});

const MODEL = "openai/gpt-4o-mini";

const router: IRouter = Router();

router.post("/ai/chat", async (req, res): Promise<void> => {
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, context } = parsed.data;

  const systemPrompt = `You are FitForge, an expert AI workout coach. You help users with:
- Exercise form, technique, and safety
- Workout programming and periodization
- Nutrition guidance for fitness goals
- Recovery, rest, and injury prevention
- Motivation and mindset

Be concise, practical, and encouraging. Use scientific backing where relevant. Keep responses under 300 words unless a detailed breakdown is needed.${context ? `\n\nUser context: ${context}` : ""}`;

  const completion = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 512,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
  });

  const reply = completion.choices[0]?.message?.content ?? "Sorry, I couldn't generate a response. Please try again.";
  res.json(AiChatResponse.parse({ reply, timestamp: new Date().toISOString() }));
});

router.post("/ai/generate-workout", async (req, res): Promise<void> => {
  const parsed = AiGenerateWorkoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { goal, fitnessLevel, availableEquipment, durationMinutes, muscleGroups } = parsed.data;
  const exercises = await db.select().from(exercisesTable);
  const exerciseList = exercises.slice(0, 30).map(e => `${e.id}: ${e.name} (${e.muscleGroup}, ${e.equipment})`).join("\n");

  const prompt = `Generate a workout plan:
- Goal: ${goal}
- Fitness Level: ${fitnessLevel}
- Duration: ${durationMinutes ?? 45} minutes
- Equipment: ${availableEquipment?.join(", ") || "any"}
- Target muscles: ${muscleGroups?.join(", ") || "full body"}

Available exercises:
${exerciseList}

Respond ONLY with valid JSON (no markdown):
{
  "name": "Workout name",
  "description": "Brief description",
  "difficulty": "${fitnessLevel}",
  "estimatedMinutes": ${durationMinutes ?? 45},
  "category": "strength",
  "exercises": [
    { "exerciseId": <id>, "sets": 3, "reps": 10, "restSeconds": 60, "orderIndex": 0 }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const rawJson = completion.choices[0]?.message?.content ?? "{}";
  let workoutData: {
    name: string; description: string; difficulty: string;
    estimatedMinutes: number; category: string;
    exercises: Array<{ exerciseId: number; sets: number; reps: number; restSeconds: number; orderIndex: number }>;
  };

  try {
    workoutData = JSON.parse(rawJson.replace(/```json\n?|```\n?/g, "").trim());
  } catch {
    req.log.error({ rawJson }, "Failed to parse AI workout JSON");
    res.status(500).json({ error: "Failed to generate workout. Please try again." });
    return;
  }

  const [workout] = await db.insert(workoutsTable).values({
    name: workoutData.name, description: workoutData.description,
    difficulty: workoutData.difficulty, estimatedMinutes: workoutData.estimatedMinutes,
    category: workoutData.category, isAiGenerated: true,
  }).returning();

  if (workoutData.exercises?.length > 0) {
    const validIds = new Set(exercises.map(e => e.id));
    const validExercises = workoutData.exercises.filter(e => validIds.has(e.exerciseId));
    if (validExercises.length > 0) {
      await db.insert(workoutExercisesTable).values(
        validExercises.map(e => ({
          workoutId: workout.id, exerciseId: e.exerciseId,
          sets: e.sets, reps: e.reps, restSeconds: e.restSeconds ?? 60, orderIndex: e.orderIndex ?? 0,
        }))
      );
    }
  }

  const exerciseCount = workoutData.exercises?.length ?? 0;
  res.json(AiGenerateWorkoutResponse.parse(serializeDates({ ...workout, exerciseCount })));
});

router.post("/ai/suggest-exercises", async (req, res): Promise<void> => {
  const parsed = AiSuggestExercisesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { query, muscleGroups, equipment } = parsed.data;
  const exercises = await db.select().from(exercisesTable);
  const exerciseList = exercises.map(e =>
    `${e.id}|${e.name}|${e.muscleGroup}|${e.equipment}|${e.category}`
  ).join("\n");

  const prompt = `You are a fitness expert. The user wants: "${query}"
${muscleGroups?.length ? `Target muscles: ${muscleGroups.join(", ")}` : ""}
${equipment?.length ? `Available equipment: ${equipment.join(", ")}` : ""}

Available exercises (id|name|muscleGroup|equipment|category):
${exerciseList}

Return the top 5-8 most relevant exercise IDs as JSON array only (no markdown):
{ "exerciseIds": [1, 2, 3], "explanation": "Brief reason why these exercises are ideal" }`;

  const completion = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const rawJson = completion.choices[0]?.message?.content ?? "{}";
  let result: { exerciseIds: number[]; explanation: string };

  try {
    result = JSON.parse(rawJson.replace(/```json\n?|```\n?/g, "").trim());
  } catch {
    res.status(500).json({ error: "Failed to parse AI response." });
    return;
  }

  const suggested = exercises.filter(e => result.exerciseIds.includes(e.id));
  res.json(AiSuggestExercisesResponse.parse(serializeDates({
    exercises: suggested,
    explanation: result.explanation,
  })));
});

router.post("/ai/weight-advice", async (req, res): Promise<void> => {
  const parsed = AiWeightAdviceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { currentWeight, goalWeight, unit, fitnessGoal, fitnessLevel, weeklyWorkouts } = parsed.data;
  const diff = goalWeight - currentWeight;
  const direction = diff < 0 ? "lose" : "gain";
  const absDiff = Math.abs(diff).toFixed(1);

  const prompt = `The user wants to ${direction} ${absDiff}${unit} (current: ${currentWeight}${unit}, goal: ${goalWeight}${unit}).
Fitness goal: ${fitnessGoal}, level: ${fitnessLevel}, trains ${weeklyWorkouts} days/week.

Give a concise, actionable 3-part plan (max 250 words):
1. Weekly calorie/nutrition strategy
2. Workout adjustments  
3. Realistic timeline and milestones

Be specific with numbers. Be encouraging but realistic.`;

  const completion = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 512,
    messages: [
      { role: "system", content: "You are FitForge, a science-backed AI fitness coach." },
      { role: "user", content: prompt },
    ],
  });

  const advice = completion.choices[0]?.message?.content ?? "Unable to generate advice at this time.";
  res.json(AiWeightAdviceResponse.parse({ advice, timestamp: new Date().toISOString() }));
});

export default router;
