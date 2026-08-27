export type ExerciseType = 'weighted' | 'bodyweight';
export type StrengthLevel = 'Beginner' | 'Novice' | 'Intermediate' | 'Advanced' | 'Elite';

export interface ExerciseBenchmark {
  id: string;
  name: string;
  type: ExerciseType;
  isCompound: boolean;
}

export interface LevelThresholds {
  Beginner: number;
  Novice: number;
  Intermediate: number;
  Advanced: number;
  Elite: number;
}

// Estimated 1RM as percentage of bodyweight
export interface WeightedBenchmark {
  levels: LevelThresholds;
  // Percentile approximation at each level boundary
  percentiles: {
    Beginner: number;
    Novice: number;
    Intermediate: number;
    Advanced: number;
    Elite: number;
  };
}

// Reps completed for bodyweight exercises
export interface BodyweightBenchmark {
  levels: LevelThresholds;
  percentiles: {
    Beginner: number;
    Novice: number;
    Intermediate: number;
    Advanced: number;
    Elite: number;
  };
}

export const EXERCISES: ExerciseBenchmark[] = [
  { id: 'bench_press', name: 'Bench Press', type: 'weighted', isCompound: true },
  { id: 'squat', name: 'Squat', type: 'weighted', isCompound: true },
  { id: 'deadlift', name: 'Deadlift', type: 'weighted', isCompound: true },
  { id: 'overhead_press', name: 'Overhead Press', type: 'weighted', isCompound: true },
  { id: 'barbell_row', name: 'Barbell Row', type: 'weighted', isCompound: true },
  { id: 'bent_over_row', name: 'Bent-Over Row', type: 'weighted', isCompound: false },
  { id: 'dumbbell_curl', name: 'Dumbbell Curl', type: 'weighted', isCompound: false },
  { id: 'pull_ups', name: 'Pull-Ups', type: 'bodyweight', isCompound: true },
  { id: 'push_ups', name: 'Push-Ups', type: 'bodyweight', isCompound: false },
];

// Estimated 1RM / bodyweight ratio thresholds
export const WEIGHTED_BENCHMARKS: Record<string, WeightedBenchmark> = {
  bench_press: {
    levels: { Beginner: 0.5, Novice: 0.75, Intermediate: 1.0, Advanced: 1.25, Elite: 1.5 },
    percentiles: { Beginner: 15, Novice: 30, Intermediate: 50, Advanced: 75, Elite: 92 },
  },
  squat: {
    levels: { Beginner: 0.6, Novice: 0.9, Intermediate: 1.2, Advanced: 1.5, Elite: 1.8 },
    percentiles: { Beginner: 15, Novice: 30, Intermediate: 50, Advanced: 75, Elite: 92 },
  },
  deadlift: {
    levels: { Beginner: 0.7, Novice: 1.0, Intermediate: 1.3, Advanced: 1.6, Elite: 2.0 },
    percentiles: { Beginner: 15, Novice: 30, Intermediate: 50, Advanced: 75, Elite: 92 },
  },
  overhead_press: {
    levels: { Beginner: 0.3, Novice: 0.45, Intermediate: 0.6, Advanced: 0.75, Elite: 0.9 },
    percentiles: { Beginner: 15, Novice: 30, Intermediate: 50, Advanced: 75, Elite: 92 },
  },
  barbell_row: {
    levels: { Beginner: 0.4, Novice: 0.6, Intermediate: 0.8, Advanced: 1.0, Elite: 1.2 },
    percentiles: { Beginner: 15, Novice: 30, Intermediate: 50, Advanced: 75, Elite: 92 },
  },
  bent_over_row: {
    levels: { Beginner: 0.35, Novice: 0.5, Intermediate: 0.7, Advanced: 0.9, Elite: 1.1 },
    percentiles: { Beginner: 15, Novice: 30, Intermediate: 50, Advanced: 75, Elite: 92 },
  },
  dumbbell_curl: {
    levels: { Beginner: 0.15, Novice: 0.22, Intermediate: 0.3, Advanced: 0.38, Elite: 0.45 },
    percentiles: { Beginner: 15, Novice: 30, Intermediate: 50, Advanced: 75, Elite: 92 },
  },
};

// Reps completed (bodyweight only, no extra weight)
export const BODYWEIGHT_BENCHMARKS: Record<string, BodyweightBenchmark> = {
  pull_ups: {
    levels: { Beginner: 1, Novice: 5, Intermediate: 10, Advanced: 15, Elite: 20 },
    percentiles: { Beginner: 10, Novice: 25, Intermediate: 50, Advanced: 75, Elite: 93 },
  },
  push_ups: {
    levels: { Beginner: 10, Novice: 20, Intermediate: 35, Advanced: 50, Elite: 70 },
    percentiles: { Beginner: 10, Novice: 25, Intermediate: 50, Advanced: 75, Elite: 93 },
  },
};

export const LEVEL_COLORS: Record<StrengthLevel, string> = {
  Beginner: '#71717A',
  Novice: '#F59E0B',
  Intermediate: '#3B82F6',
  Advanced: '#8B5CF6',
  Elite: '#EF4444',
};

export const LEVEL_MESSAGES: Record<StrengthLevel, string> = {
  Beginner: "Everyone starts somewhere. Focus on form and consistency.",
  Novice: "You're building a foundation. Keep progressing steadily.",
  Intermediate: "Solid strength base. You're above average — keep pushing.",
  Advanced: "Impressive strength. You're in elite territory.",
  Elite: "Outstanding performance. You're among the strongest.",
};

export const COMPOUND_LIFT_IDS = ['bench_press', 'squat', 'deadlift'];

export function getExerciseById(id: string): ExerciseBenchmark | undefined {
  return EXERCISES.find((e) => e.id === id);
}

export function isBodyweightExercise(exerciseId: string): boolean {
  const ex = getExerciseById(exerciseId);
  return ex?.type === 'bodyweight';
}
