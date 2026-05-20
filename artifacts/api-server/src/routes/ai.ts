import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db, exercisesTable, workoutsTable, workoutExercisesTable } from "@workspace/db";
import {
  AiChatBody,
  AiGenerateWorkoutBody,
  AiChatResponse,
  AiGenerateWorkoutResponse,
} from "@workspace/api-zod";

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
    model: "gpt-5-mini",
    max_completion_tokens: 512,
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

  // Fetch available exercises from DB to reference in AI prompt
  const exercises = await db.select().from(exercisesTable);
  const exerciseList = exercises.slice(0, 30).map(e => `${e.id}: ${e.name} (${e.muscleGroup}, ${e.equipment})`).join("\n");

  const prompt = `Generate a workout plan for the following parameters:
- Goal: ${goal}
- Fitness Level: ${fitnessLevel}
- Duration: ${durationMinutes ?? 45} minutes
- Equipment: ${availableEquipment?.join(", ") || "any"}
- Target muscles: ${muscleGroups?.join(", ") || "full body"}

Available exercises from our database:
${exerciseList}

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "name": "Workout name",
  "description": "Brief description",
  "difficulty": "${fitnessLevel}",
  "estimatedMinutes": ${durationMinutes ?? 45},
  "category": "strength or cardio or hiit or flexibility",
  "exercises": [
    { "exerciseId": <id from list above>, "sets": 3, "reps": 10, "restSeconds": 60, "orderIndex": 0 }
  ]
}

Select 4-7 exercises from the list that match the goal and equipment. Use actual exercise IDs from the list.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const rawJson = completion.choices[0]?.message?.content ?? "{}";

  let workoutData: {
    name: string;
    description: string;
    difficulty: string;
    estimatedMinutes: number;
    category: string;
    exercises: Array<{ exerciseId: number; sets: number; reps: number; restSeconds: number; orderIndex: number }>;
  };

  try {
    workoutData = JSON.parse(rawJson.replace(/```json\n?|```\n?/g, "").trim());
  } catch {
    req.log.error({ rawJson }, "Failed to parse AI workout JSON");
    res.status(500).json({ error: "Failed to generate workout. Please try again." });
    return;
  }

  // Save the generated workout to DB
  const [workout] = await db
    .insert(workoutsTable)
    .values({
      name: workoutData.name,
      description: workoutData.description,
      difficulty: workoutData.difficulty,
      estimatedMinutes: workoutData.estimatedMinutes,
      category: workoutData.category,
      isAiGenerated: true,
    })
    .returning();

  if (workoutData.exercises && workoutData.exercises.length > 0) {
    // Validate exercise IDs exist
    const validIds = new Set(exercises.map(e => e.id));
    const validExercises = workoutData.exercises.filter(e => validIds.has(e.exerciseId));

    if (validExercises.length > 0) {
      await db.insert(workoutExercisesTable).values(
        validExercises.map(e => ({
          workoutId: workout.id,
          exerciseId: e.exerciseId,
          sets: e.sets,
          reps: e.reps,
          restSeconds: e.restSeconds ?? 60,
          orderIndex: e.orderIndex ?? 0,
        }))
      );
    }
  }

  const exerciseCount = workoutData.exercises?.length ?? 0;
  res.json(AiGenerateWorkoutResponse.parse({ ...workout, exerciseCount }));
});

export default router;
