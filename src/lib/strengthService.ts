import {
  WEIGHTED_BENCHMARKS,
  BODYWEIGHT_BENCHMARKS,
  COMPOUND_LIFT_IDS,
  type StrengthLevel,
} from '../data/strengthBenchmarks';

export interface LiftEntry {
  id: string;
  user_id: string;
  exercise_id: string;
  weight_kg: number;
  reps: number;
  sets: number | null;
  extra_weight_kg: number | null;
  created_at: string;
}

export interface LiftResult {
  exerciseId: string;
  estimated1RM: number;
  level: StrengthLevel;
  percentile: number;
  ratioToBodyweight: number | null;
}

export interface OverallStrength {
  totalScore: number;
  bodyweightRatio: number;
  level: StrengthLevel;
  percentile: number;
}

// Epley formula: estimated 1RM = weight * (1 + reps / 30)
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

// For bodyweight exercises, "score" is just the reps completed
// with optional extra weight factored in
export function bodyweightScore(reps: number, extraWeightKg: number): number {
  return reps + extraWeightKg * 0.5; // each extra kg counts as ~0.5 "reps equivalent"
}

export function getWeightedLevel(
  exerciseId: string,
  estimated1RM: number,
  bodyWeight: number
): { level: StrengthLevel; percentile: number } {
  const benchmark = WEIGHTED_BENCHMARKS[exerciseId];
  if (!benchmark || !bodyWeight) {
    return { level: 'Beginner', percentile: 10 };
  }

  const ratio = estimated1RM / bodyWeight;
  const { levels, percentiles } = benchmark;

  if (ratio >= levels.Elite) return { level: 'Elite', percentile: percentiles.Elite };
  if (ratio >= levels.Advanced) return { level: 'Advanced', percentile: percentiles.Advanced };
  if (ratio >= levels.Intermediate) return { level: 'Intermediate', percentile: percentiles.Intermediate };
  if (ratio >= levels.Novice) return { level: 'Novice', percentile: percentiles.Novice };
  return { level: 'Beginner', percentile: percentiles.Beginner };
}

export function getBodyweightLevel(
  exerciseId: string,
  score: number
): { level: StrengthLevel; percentile: number } {
  const benchmark = BODYWEIGHT_BENCHMARKS[exerciseId];
  if (!benchmark) {
    return { level: 'Beginner', percentile: 10 };
  }

  const { levels, percentiles } = benchmark;

  if (score >= levels.Elite) return { level: 'Elite', percentile: percentiles.Elite };
  if (score >= levels.Advanced) return { level: 'Advanced', percentile: percentiles.Advanced };
  if (score >= levels.Intermediate) return { level: 'Intermediate', percentile: percentiles.Intermediate };
  if (score >= levels.Novice) return { level: 'Novice', percentile: percentiles.Novice };
  return { level: 'Beginner', percentile: percentiles.Beginner };
}

export function calculateLiftResult(
  lift: LiftEntry,
  bodyWeight: number
): LiftResult {
  const isBodyweight = ['pull_ups', 'push_ups'].includes(lift.exercise_id);

  if (isBodyweight) {
    const extra = lift.extra_weight_kg || 0;
    const score = bodyweightScore(lift.reps, extra);
    const { level, percentile } = getBodyweightLevel(lift.exercise_id, score);
    return {
      exerciseId: lift.exercise_id,
      estimated1RM: lift.weight_kg || 0,
      level,
      percentile,
      ratioToBodyweight: null,
    };
  }

  const oneRM = estimate1RM(lift.weight_kg, lift.reps);
  const ratio = bodyWeight ? oneRM / bodyWeight : 0;
  const { level, percentile } = getWeightedLevel(lift.exercise_id, oneRM, bodyWeight);

  return {
    exerciseId: lift.exercise_id,
    estimated1RM: Math.round(oneRM * 10) / 10,
    level,
    percentile,
    ratioToBodyweight: Math.round(ratio * 100) / 100,
  };
}

export function calculateOverallStrength(
  lifts: LiftEntry[],
  bodyWeight: number
): OverallStrength | null {
  if (!bodyWeight) return null;

  // Get best lift for each compound exercise
  const bestLifts: Record<string, LiftEntry> = {};
  for (const lift of lifts) {
    if (!COMPOUND_LIFT_IDS.includes(lift.exercise_id)) continue;
    const existing = bestLifts[lift.exercise_id];
    const this1RM = estimate1RM(lift.weight_kg, lift.reps);
    const existing1RM = existing ? estimate1RM(existing.weight_kg, existing.reps) : 0;
    if (this1RM > existing1RM) {
      bestLifts[lift.exercise_id] = lift;
    }
  }

  // Need at least bench + squat + deadlift for overall score
  const hasAll = COMPOUND_LIFT_IDS.every((id) => bestLifts[id]);
  if (!hasAll) return null;

  const totalScore =
    estimate1RM(bestLifts.bench_press.weight_kg, bestLifts.bench_press.reps) +
    estimate1RM(bestLifts.squat.weight_kg, bestLifts.squat.reps) +
    estimate1RM(bestLifts.deadlift.weight_kg, bestLifts.deadlift.reps);

  const bodyweightRatio = totalScore / bodyWeight;

  // Overall level thresholds based on total/BW ratio
  let level: StrengthLevel;
  let percentile: number;

  if (bodyweightRatio >= 5.0) {
    level = 'Elite';
    percentile = 95;
  } else if (bodyweightRatio >= 4.0) {
    level = 'Advanced';
    percentile = 80;
  } else if (bodyweightRatio >= 3.0) {
    level = 'Intermediate';
    percentile = 55;
  } else if (bodyweightRatio >= 2.0) {
    level = 'Novice';
    percentile = 30;
  } else {
    level = 'Beginner';
    percentile = 12;
  }

  return {
    totalScore: Math.round(totalScore),
    bodyweightRatio: Math.round(bodyweightRatio * 100) / 100,
    level,
    percentile,
  };
}
