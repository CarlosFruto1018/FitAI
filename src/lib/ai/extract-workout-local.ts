import type { ExtractedWorkout } from "./extract-workout";

// ---------------------------------------------------------------------------
// Alias → canonical mapping (mirrors the Claude prompt)
// ---------------------------------------------------------------------------
const ALIASES: [RegExp, string, string][] = [
  [/press\s*(de\s*)?banca|press\s*plano|banca\b|bench/i, "bench_press", "Press de Banca"],
  [/press\s*inclinado|incline/i, "incline_bench_press", "Press Inclinado"],
  [/press\s*declinado|decline/i, "decline_bench_press", "Press Declinado"],
  [/sentadilla|squat|cuclillas/i, "squat", "Sentadilla"],
  [/peso\s*muerto|deadlift\b|pd\b/i, "deadlift", "Peso Muerto"],
  [/dominadas?|pull.?up|jalón/i, "pull_up", "Dominadas"],
  [/remo\s*(con\s*barra|barra)?|barbell\s*row/i, "barbell_row", "Remo con Barra"],
  [/press\s*militar|press\s*hombro|overhead\s*press|ohp/i, "overhead_press", "Press Militar"],
  [/curl\s*b[ií]ceps?|curl\b|b[ií]ceps/i, "bicep_curl", "Curl Bíceps"],
  [/fondos?\b|dips?/i, "tricep_dip", "Fondos"],
  [/hip\s*thrust|empuje\s*(de\s*)?cadera/i, "hip_thrust", "Hip Thrust"],
  [/cinta\b|trotadora|treadmill|correr|trote/i, "treadmill", "Cinta"],
  [/el[ií]ptica|elliptical/i, "elliptical", "Elíptica"],
  [/biciclet[ae]|bike|spinning/i, "stationary_bike", "Bicicleta"],
  [/press\s*frances|skull\s*crusher/i, "skull_crusher", "Press Francés"],
  [/extensi[oó]n\s*(de\s*)?tr[ií]ceps?|tr[ií]ceps?/i, "tricep_extension", "Extensión Tríceps"],
  [/face\s*pull/i, "face_pull", "Face Pull"],
  [/peso\s*muerto\s*rum[ae]no|rdl/i, "romanian_deadlift", "Peso Muerto Rumano"],
  [/leg\s*press|prensa/i, "leg_press", "Leg Press"],
  [/leg\s*curl|curl\s*(de\s*)?pierna/i, "leg_curl", "Leg Curl"],
  [/leg\s*extension|extensi[oó]n\s*(de\s*)?pierna/i, "leg_extension", "Extensión de Pierna"],
  [/press\s*hombro\s*(mancuernas?|dumbell)?|hombros?/i, "shoulder_press", "Press Hombro"],
  [/elevaci[oó]n\s*lateral|lateral\s*raise/i, "lateral_raise", "Elevación Lateral"],
  [/jalón\s*al\s*pecho|lat\s*pulldown/i, "lat_pulldown", "Jalón al Pecho"],
  [/remo\s*(en\s*polea|polea)|cable\s*row/i, "cable_row", "Remo en Polea"],
  [/plancha|plank/i, "plank", "Plancha"],
  [/abdominales?|crunch|sit.?up/i, "crunch", "Abdominales"],
  [/zancadas?|lunges?/i, "lunge", "Zancadas"],
  [/peso\s*muerto\s*sumo|sumo\s*deadlift/i, "sumo_deadlift", "Peso Muerto Sumo"],
  [/hip\s*abducci[oó]n|abductor/i, "hip_abduction", "Abducción de Cadera"],
];

function resolveExercise(text: string): { canonical: string; displayName: string } | null {
  for (const [re, canonical, displayName] of ALIASES) {
    if (re.test(text)) return { canonical, displayName };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Number helpers
// ---------------------------------------------------------------------------
const NUM = String.raw`(\d+(?:[.,]\d+)?)`;

// "3x10", "3×10", "3 x 10"
const SET_REP_RE = new RegExp(String.raw`${NUM}\s*[x×]\s*${NUM}`, "gi");
// "3 series de 10", "3 series 10 reps"
const SERIES_REPS_RE = new RegExp(
  String.raw`${NUM}\s*series?\s*(de\s*)?${NUM}\s*(rep(?:eticiones?)?|reps?)?`,
  "gi"
);
// "10 repeticiones"
const REPS_RE = new RegExp(String.raw`${NUM}\s*rep(?:eticiones?|s)?`, "gi");
// "80 kg", "80kg", "80 kilos"
const WEIGHT_RE = new RegExp(String.raw`${NUM}\s*(?:kg|kgs|kilos?|lb|lbs|libras?)`, "gi");
// "20 minutos", "20min"
const DURATION_RE = new RegExp(String.raw`${NUM}\s*(?:minutos?|mins?|min\b)`, "gi");
// "500 metros", "5 km"
const DISTANCE_RE = new RegExp(
  String.raw`${NUM}\s*(?:metros?|mts?|km|kil[oó]metros?)`,
  "gi"
);

function parseNum(s: string): number {
  return parseFloat(s.replace(",", "."));
}

function firstMatch(re: RegExp, text: string): RegExpExecArray | null {
  re.lastIndex = 0;
  return re.exec(text);
}

// ---------------------------------------------------------------------------
// Segment a sentence into exercise chunks
// ---------------------------------------------------------------------------
function segmentBySeparators(text: string): string[] {
  return text
    .split(/[,;]|\sy\s|\sluego\s|\sdespués\s|\stambién\s/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Parse one segment into sets
// ---------------------------------------------------------------------------
interface ParsedSet {
  reps: number | null;
  weight_kg: number | null;
  duration_sec: number | null;
  distance_m: number | null;
  rpe: number | null;
}

function parseSets(segment: string): { sets: ParsedSet[]; alias: string; canonical: string } | null {
  const ex = resolveExercise(segment);
  if (!ex) return null;

  let numSets = 1;
  let reps: number | null = null;
  let weightKg: number | null = null;
  let durationSec: number | null = null;
  let distanceM: number | null = null;

  // "3x10"
  const sxr = firstMatch(SET_REP_RE, segment);
  if (sxr) {
    numSets = Math.round(parseNum(sxr[1]));
    reps = Math.round(parseNum(sxr[2]));
  } else {
    // "3 series de 10"
    const sr = firstMatch(SERIES_REPS_RE, segment);
    if (sr) {
      numSets = Math.round(parseNum(sr[1]));
      reps = Math.round(parseNum(sr[2]));
    } else {
      // standalone reps
      const r = firstMatch(REPS_RE, segment);
      if (r) reps = Math.round(parseNum(r[1]));
    }
  }

  // Weight
  const w = firstMatch(WEIGHT_RE, segment);
  if (w) {
    const val = parseNum(w[1]);
    const unit = w[0].toLowerCase();
    weightKg = unit.includes("lb") || unit.includes("libra") ? val * 0.453592 : val;
  }

  // Duration
  const d = firstMatch(DURATION_RE, segment);
  if (d) durationSec = Math.round(parseNum(d[1]) * 60);

  // Distance
  const dist = firstMatch(DISTANCE_RE, segment);
  if (dist) {
    const val = parseNum(dist[1]);
    distanceM = dist[0].toLowerCase().includes("km") ? val * 1000 : val;
  }

  // Need at least one metric to be meaningful
  if (!reps && !durationSec && !distanceM) {
    // Infer 1 set with no metrics if weight given (e.g. "press banca 80kg")
    if (!weightKg) return null;
  }

  const set: ParsedSet = {
    reps: reps ?? null,
    weight_kg: weightKg ?? null,
    duration_sec: durationSec ?? null,
    distance_m: distanceM ?? null,
    rpe: null,
  };

  return {
    alias: ex.displayName,
    canonical: ex.canonical,
    sets: Array.from({ length: numSets }, () => ({ ...set })),
  };
}

// ---------------------------------------------------------------------------
// Detect intent keywords
// ---------------------------------------------------------------------------
function detectIntent(text: string): ExtractedWorkout["intent"] {
  if (/\?|cu[aá]nto|cu[aá]l|historial|ver|mostrar|dime|sabes/i.test(text)) return "query";
  if (/termin[eé]|listo|fin\b|acab[eé]|ya\s*no\s*m[aá]s/i.test(text)) return "end_session";
  if (/corrig[eo]|era\s|fue\s|corrijo|cambia/i.test(text)) return "correction";
  return "log";
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
export function extractWorkoutLocal(input: string): ExtractedWorkout {
  const intent = detectIntent(input);

  if (intent !== "log") {
    return {
      intent,
      exercises: [],
      session_metrics: { duration_min: null, calories: null, heart_rate_avg: null },
      query: intent === "query" ? input : null,
      raw_message: input,
    };
  }

  const segments = segmentBySeparators(input);
  const exercises: ExtractedWorkout["exercises"] = [];

  for (const seg of segments) {
    const parsed = parseSets(seg);
    if (parsed) {
      exercises.push({
        alias: parsed.alias,
        canonical: parsed.canonical,
        sets: parsed.sets,
        notes: null,
      });
    }
  }

  return {
    intent: exercises.length > 0 ? "log" : "unknown",
    exercises,
    session_metrics: { duration_min: null, calories: null, heart_rate_avg: null },
    query: null,
    raw_message: exercises.length === 0 ? input : null,
  };
}
