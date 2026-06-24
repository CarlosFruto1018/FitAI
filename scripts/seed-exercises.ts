import { db } from "../src/lib/db/client";
import { exercises, exerciseAliases } from "../src/lib/db/schema";

const EXERCISES = [
  // --- Pecho ---
  {
    canonicalName: "bench_press",
    displayName: "Press de Banca",
    muscleGroups: ["chest", "triceps", "shoulders"],
    equipment: "barbell",
    category: "strength",
    aliases: ["press plano", "banca", "bench", "press banca", "press de banca"],
  },
  {
    canonicalName: "incline_bench_press",
    displayName: "Press Inclinado",
    muscleGroups: ["chest", "triceps", "shoulders"],
    equipment: "barbell",
    category: "strength",
    aliases: ["press inclinado", "incline bench", "inclinado"],
  },
  {
    canonicalName: "dumbbell_fly",
    displayName: "Aperturas con Mancuernas",
    muscleGroups: ["chest"],
    equipment: "dumbbell",
    category: "strength",
    aliases: ["aperturas", "flyes", "apertura pecho", "fly pecho"],
  },
  // --- Espalda ---
  {
    canonicalName: "deadlift",
    displayName: "Peso Muerto",
    muscleGroups: ["back", "glutes", "hamstrings"],
    equipment: "barbell",
    category: "strength",
    aliases: ["peso muerto", "deadlift", "pd", "muerto"],
  },
  {
    canonicalName: "pull_up",
    displayName: "Dominadas",
    muscleGroups: ["back", "biceps"],
    equipment: "bodyweight",
    category: "strength",
    aliases: ["dominadas", "pull-up", "pullup", "jalón", "chin-up"],
  },
  {
    canonicalName: "barbell_row",
    displayName: "Remo con Barra",
    muscleGroups: ["back", "biceps"],
    equipment: "barbell",
    category: "strength",
    aliases: ["remo con barra", "remo", "remo barra", "barbell row"],
  },
  {
    canonicalName: "lat_pulldown",
    displayName: "Jalón al Pecho",
    muscleGroups: ["back", "biceps"],
    equipment: "cable",
    category: "strength",
    aliases: ["jalón al pecho", "jalón", "lat pulldown", "jalón frontal"],
  },
  // --- Piernas ---
  {
    canonicalName: "squat",
    displayName: "Sentadilla",
    muscleGroups: ["quads", "glutes", "hamstrings"],
    equipment: "barbell",
    category: "strength",
    aliases: ["sentadilla", "squat", "cuclillas", "sentadillas"],
  },
  {
    canonicalName: "leg_press",
    displayName: "Prensa de Piernas",
    muscleGroups: ["quads", "glutes"],
    equipment: "machine",
    category: "strength",
    aliases: ["prensa", "leg press", "prensa de piernas", "prensa pierna"],
  },
  {
    canonicalName: "romanian_deadlift",
    displayName: "Peso Muerto Rumano",
    muscleGroups: ["hamstrings", "glutes"],
    equipment: "barbell",
    category: "strength",
    aliases: ["rumano", "peso muerto rumano", "rdl", "romanian"],
  },
  {
    canonicalName: "hip_thrust",
    displayName: "Hip Thrust",
    muscleGroups: ["glutes", "hamstrings"],
    equipment: "barbell",
    category: "strength",
    aliases: ["hip thrust", "empuje de cadera", "empuje cadera", "glúteos"],
  },
  {
    canonicalName: "lunge",
    displayName: "Zancadas",
    muscleGroups: ["quads", "glutes"],
    equipment: "bodyweight",
    category: "strength",
    aliases: ["zancadas", "lunge", "estocadas"],
  },
  // --- Hombros ---
  {
    canonicalName: "overhead_press",
    displayName: "Press Militar",
    muscleGroups: ["shoulders", "triceps"],
    equipment: "barbell",
    category: "strength",
    aliases: ["press militar", "press hombro", "military press", "ohp", "press sobre cabeza"],
  },
  {
    canonicalName: "lateral_raise",
    displayName: "Elevaciones Laterales",
    muscleGroups: ["shoulders"],
    equipment: "dumbbell",
    category: "strength",
    aliases: ["elevaciones laterales", "laterales", "lateral raise"],
  },
  // --- Bíceps ---
  {
    canonicalName: "bicep_curl",
    displayName: "Curl de Bíceps",
    muscleGroups: ["biceps"],
    equipment: "dumbbell",
    category: "strength",
    aliases: ["curl bíceps", "curl de bíceps", "curl", "bíceps", "bicep curl"],
  },
  {
    canonicalName: "hammer_curl",
    displayName: "Curl Martillo",
    muscleGroups: ["biceps", "forearms"],
    equipment: "dumbbell",
    category: "strength",
    aliases: ["curl martillo", "hammer curl", "martillo"],
  },
  // --- Tríceps ---
  {
    canonicalName: "tricep_dip",
    displayName: "Fondos de Tríceps",
    muscleGroups: ["triceps"],
    equipment: "bodyweight",
    category: "strength",
    aliases: ["fondos", "dips", "fondos tríceps"],
  },
  {
    canonicalName: "tricep_pushdown",
    displayName: "Extensión de Tríceps en Polea",
    muscleGroups: ["triceps"],
    equipment: "cable",
    category: "strength",
    aliases: ["polea tríceps", "extensión tríceps", "tricep pushdown", "jalón tríceps"],
  },
  // --- Cardio ---
  {
    canonicalName: "treadmill",
    displayName: "Cinta de Correr",
    muscleGroups: ["legs", "cardio"],
    equipment: "machine",
    category: "cardio",
    aliases: ["cinta", "correr", "trotadora", "treadmill", "running"],
  },
  {
    canonicalName: "stationary_bike",
    displayName: "Bicicleta Estática",
    muscleGroups: ["legs", "cardio"],
    equipment: "machine",
    category: "cardio",
    aliases: ["bicicleta", "bike", "bici", "bicicleta estática"],
  },
  {
    canonicalName: "elliptical",
    displayName: "Elíptica",
    muscleGroups: ["legs", "cardio"],
    equipment: "machine",
    category: "cardio",
    aliases: ["elíptica", "eliptica", "elliptical"],
  },
  {
    canonicalName: "rowing_machine",
    displayName: "Remo (Máquina)",
    muscleGroups: ["back", "arms", "cardio"],
    equipment: "machine",
    category: "cardio",
    aliases: ["remo máquina", "rowing", "remo ergómetro"],
  },
  // --- Core ---
  {
    canonicalName: "plank",
    displayName: "Plancha",
    muscleGroups: ["core"],
    equipment: "bodyweight",
    category: "strength",
    aliases: ["plancha", "plank", "isométrico"],
  },
  {
    canonicalName: "crunch",
    displayName: "Abdominales",
    muscleGroups: ["core"],
    equipment: "bodyweight",
    category: "strength",
    aliases: ["abdominales", "crunch", "abdominals", "abs"],
  },
];

async function seed() {
  console.log("🌱 Seeding exercises...");

  for (const ex of EXERCISES) {
    const { aliases, ...exerciseData } = ex;

    // Upsert exercise
    const [inserted] = await db
      .insert(exercises)
      .values(exerciseData)
      .onConflictDoUpdate({
        target: exercises.canonicalName,
        set: { displayName: exerciseData.displayName, muscleGroups: exerciseData.muscleGroups },
      })
      .returning({ id: exercises.id });

    // Insert global aliases
    for (const alias of aliases) {
      await db
        .insert(exerciseAliases)
        .values({ exerciseId: inserted.id, alias: alias.toLowerCase() })
        .onConflictDoNothing();
    }

    console.log(`  ✅ ${exerciseData.displayName}`);
  }

  console.log(`\n✅ Seeded ${EXERCISES.length} exercises`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
