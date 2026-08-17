import type { WorkoutDayWithExercises } from '../types/workout';

interface UserProfile {
  goal: string | null;
  fitness_level: string | null;
  training_days_per_week: number | null;
  workout_duration: string | null;
  training_location: string | null;
  equipment: string | null;
  sport: string | null;
  health_conditions: string | null;
}

interface ExerciseTemplate {
  name: string;
  target: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  instructions: string;
}

interface WorkoutTemplate {
  day_of_week: string;
  workout_name: string;
  workout_type: string;
  is_recovery_day: boolean;
  exercises: ExerciseTemplate[];
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getDurationMultiplier(duration: string | null): number {
  switch (duration) {
    case '30': return 0.6;
    case '45': return 0.8;
    case '60': return 1.0;
    case '90': return 1.3;
    default: return 1.0;
  }
}

function getSplitsForDays(days: number, goal: string): string[] {
  if (days <= 2) {
    return ['Full Body', 'Full Body'];
  }
  if (days === 3) {
    if (goal === 'Build Muscle' || goal === 'Competition Prep') {
      return ['Push', 'Pull', 'Legs'];
    }
    if (goal === 'Get Stronger') {
      return ['Upper', 'Lower', 'Full Body'];
    }
    if (goal === 'Endurance') {
      return ['Upper Body', 'Lower Body', 'Cardio & Core'];
    }
    return ['Upper', 'Lower', 'Full Body'];
  }
  if (days === 4) {
    if (goal === 'Build Muscle' || goal === 'Competition Prep') {
      return ['Upper', 'Lower', 'Push', 'Pull'];
    }
    if (goal === 'Get Stronger') {
      return ['Upper', 'Lower', 'Upper', 'Lower'];
    }
    if (goal === 'Endurance') {
      return ['Upper', 'Lower', 'Cardio', 'Full Body'];
    }
    return ['Upper', 'Lower', 'Upper', 'Lower'];
  }
  if (days === 5) {
    if (goal === 'Build Muscle' || goal === 'Competition Prep') {
      return ['Push', 'Pull', 'Legs', 'Upper', 'Lower'];
    }
    if (goal === 'Get Stronger') {
      return ['Upper', 'Lower', 'Upper', 'Lower', 'Full Body'];
    }
    if (goal === 'Endurance') {
      return ['Upper', 'Lower', 'Cardio & Core', 'Upper', 'Lower'];
    }
    if (goal === 'Sports Performance') {
      return ['Upper', 'Lower', 'Power & Speed', 'Upper', 'Lower'];
    }
    return ['Push', 'Pull', 'Legs', 'Upper', 'Lower'];
  }
  // 6 days
  if (goal === 'Build Muscle' || goal === 'Competition Prep') {
    return ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'];
  }
  if (goal === 'Get Stronger') {
    return ['Upper', 'Lower', 'Upper', 'Lower', 'Upper', 'Lower'];
  }
  if (goal === 'Endurance') {
    return ['Upper', 'Lower', 'Cardio', 'Upper', 'Lower', 'Cardio'];
  }
  if (goal === 'Sports Performance') {
    return ['Upper', 'Lower', 'Power', 'Upper', 'Lower', 'Speed & Agility'];
  }
  return ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'];
}

function getEquipmentFilter(equipment: string | null): (ex: ExerciseTemplate) => boolean {
  const isBodyweight = equipment === 'bodyweight';
  const isMinimal = equipment === 'minimal';

  return (ex: ExerciseTemplate) => {
    if (isBodyweight) {
      const bodyweightKeywords = ['Push-up', 'Squat', 'Lunge', 'Plank', 'Burpee', 'Dip', 'Chin-up', 'Pull-up',
        'Sit-up', 'Crunch', 'Leg Raise', 'Glute Bridge', 'Calf Raise', 'Wall Sit', 'Mountain Climber',
        'Jumping Jack', 'High Knees', 'Butt Kick', 'Step-up', 'Pike Push-up', 'Diamond Push-up',
        'Decline Push-up', 'Body Row', 'Inverted Row', 'Lateral Lunge', 'Curtsy Lunge',
        'Single Leg Deadlift', 'Nordic Curl', 'Ab Rollout', 'Dead Hang', 'Hanging Knee Raise',
        'Bear Crawl', 'Crab Walk', 'Jump Squat', 'Broad Jump', 'Box Jump', 'Pistol Squat',
        'Handstand Hold', 'Hindu Push-up', 'Archer Push-up'];
      return bodyweightKeywords.some(kw => ex.name.toLowerCase().includes(kw.toLowerCase()));
    }
    if (isMinimal) {
      const minimalKeywords = [...['Push-up', 'Squat', 'Lunge', 'Plank', 'Burpee', 'Dip', 'Chin-up', 'Pull-up',
        'Sit-up', 'Crunch', 'Leg Raise', 'Glute Bridge', 'Calf Raise', 'Wall Sit', 'Mountain Climber',
        'Jumping Jack', 'High Knees', 'Step-up', 'Body Row', 'Inverted Row', 'Lateral Lunge',
        'Curtsy Lunge', 'Single Leg Deadlift', 'Jump Squat', 'Broad Jump', 'Pistol Squat',
        'Hindu Push-up', 'Archer Push-up', 'Dead Hang', 'Hanging Knee Raise', 'Bear Crawl',
        'Crab Walk', 'Nordic Curl', 'Ab Rollout'],
        ...['Dumbbell', 'Kettlebell', 'Resistance Band', 'Pull-up Bar', 'Jump Rope', 'Medicine Ball',
        'Ab Wheel', 'Suspension', 'TRX', 'Foam Roller']];
      return minimalKeywords.some(kw => ex.name.toLowerCase().includes(kw.toLowerCase()));
    }
    return true; // Home gym or full gym - everything
  };
}

function buildExercisePool(_goal: string, equipment: string | null, _location: string | null): Record<string, ExerciseTemplate[]> {

  const pushExercises: ExerciseTemplate[] = [
    { name: 'Bench Press', target: 'Chest', sets: 4, reps: '8-10', rest_seconds: 180, instructions: 'Lie on bench, lower bar to chest, press up with control.' },
    { name: 'Incline Dumbbell Press', target: 'Upper Chest', sets: 3, reps: '8-12', rest_seconds: 120, instructions: 'Set bench to 30-45 degrees, press dumbbells up from chest level.' },
    { name: 'Shoulder Press', target: 'Shoulders', sets: 4, reps: '8-10', rest_seconds: 150, instructions: 'Press weight overhead from shoulder height, lock out at top.' },
    { name: 'Lateral Raise', target: 'Side Delts', sets: 3, reps: '12-15', rest_seconds: 75, instructions: 'Raise arms out to sides until parallel with floor, control the descent.' },
    { name: 'Triceps Pushdown', target: 'Triceps', sets: 3, reps: '10-15', rest_seconds: 75, instructions: 'Push cable or band down until arms are fully extended.' },
    { name: 'Overhead Triceps Extension', target: 'Triceps', sets: 3, reps: '10-12', rest_seconds: 75, instructions: 'Extend weight overhead from behind the neck, squeeze triceps at top.' },
    { name: 'Chest Fly', target: 'Chest', sets: 3, reps: '12-15', rest_seconds: 75, instructions: 'Open arms wide with slight elbow bend, bring hands together in arc.' },
    { name: 'Push-up', target: 'Chest', sets: 3, reps: '12-20', rest_seconds: 60, instructions: 'Lower chest to floor, push back up with core braced.' },
    { name: 'Pike Push-up', target: 'Shoulders', sets: 3, reps: '8-12', rest_seconds: 90, instructions: 'Elevate hips, lower head toward floor, push back up.' },
    { name: 'Dumbbell Fly', target: 'Chest', sets: 3, reps: '10-15', rest_seconds: 75, instructions: 'Lie on bench, lower dumbbells out to sides, bring them together above chest.' },
    { name: 'Arnold Press', target: 'Shoulders', sets: 3, reps: '8-12', rest_seconds: 120, instructions: 'Start with palms facing you, rotate and press overhead.' },
  ];

  const pullExercises: ExerciseTemplate[] = [
    { name: 'Barbell Row', target: 'Back', sets: 4, reps: '8-10', rest_seconds: 180, instructions: 'Hinge at hips, pull bar to lower chest, squeeze shoulder blades.' },
    { name: 'Pull-up', target: 'Lats', sets: 4, reps: '6-12', rest_seconds: 150, instructions: 'Hang from bar, pull chin over bar, control the descent.' },
    { name: 'Lat Pulldown', target: 'Lats', sets: 3, reps: '10-12', rest_seconds: 120, instructions: 'Pull bar to upper chest, squeeze lats at bottom.' },
    { name: 'Seated Cable Row', target: 'Mid Back', sets: 3, reps: '10-12', rest_seconds: 90, instructions: 'Pull handle to abdomen, retract shoulder blades.' },
    { name: 'Dumbbell Curl', target: 'Biceps', sets: 3, reps: '10-12', rest_seconds: 75, instructions: 'Curl dumbbells up, squeeze biceps at top, lower slowly.' },
    { name: 'Hammer Curl', target: 'Biceps', sets: 3, reps: '10-12', rest_seconds: 75, instructions: 'Curl with palms facing each other, target brachialis.' },
    { name: 'Face Pull', target: 'Rear Delts', sets: 3, reps: '12-15', rest_seconds: 60, instructions: 'Pull rope to face level, squeeze rear delts.' },
    { name: 'Chin-up', target: 'Biceps & Lats', sets: 3, reps: '6-10', rest_seconds: 120, instructions: 'Pull up with palms facing you, squeeze at top.' },
    { name: 'Body Row', target: 'Back', sets: 3, reps: '8-12', rest_seconds: 90, instructions: 'Lie under bar, pull chest to bar, squeeze shoulder blades.' },
    { name: 'Inverted Row', target: 'Back', sets: 3, reps: '8-12', rest_seconds: 90, instructions: 'Grip bar at waist height, pull chest to bar keeping body straight.' },
    { name: 'Resistance Band Curl', target: 'Biceps', sets: 3, reps: '12-15', rest_seconds: 60, instructions: 'Stand on band, curl handles toward shoulders.' },
    { name: 'Dead Hang', target: 'Grip & Back', sets: 3, reps: '30-60 sec', rest_seconds: 60, instructions: 'Hang from bar with straight arms, maintain grip for time.' },
  ];

  const legExercises: ExerciseTemplate[] = [
    { name: 'Barbell Squat', target: 'Quads & Glutes', sets: 4, reps: '6-10', rest_seconds: 180, instructions: 'Squat below parallel, drive up through heels, keep chest up.' },
    { name: 'Romanian Deadlift', target: 'Hamstrings', sets: 4, reps: '8-10', rest_seconds: 150, instructions: 'Hinge at hips with slight knee bend, feel stretch in hamstrings.' },
    { name: 'Leg Press', target: 'Quads', sets: 3, reps: '10-12', rest_seconds: 120, instructions: 'Lower sled to 90 degrees, press up without locking knees.' },
    { name: 'Walking Lunge', target: 'Quads & Glutes', sets: 3, reps: '10-12 each', rest_seconds: 90, instructions: 'Step forward, lower back knee toward floor, push through front heel.' },
    { name: 'Leg Curl', target: 'Hamstrings', sets: 3, reps: '10-12', rest_seconds: 90, instructions: 'Curl weight up with hamstrings, control the negative.' },
    { name: 'Leg Extension', target: 'Quads', sets: 3, reps: '12-15', rest_seconds: 75, instructions: 'Extend legs fully, squeeze quads at top.' },
    { name: 'Calf Raise', target: 'Calves', sets: 4, reps: '15-20', rest_seconds: 60, instructions: 'Rise onto toes, squeeze calves, lower slowly for full stretch.' },
    { name: 'Glute Bridge', target: 'Glutes', sets: 3, reps: '12-15', rest_seconds: 75, instructions: 'Drive hips up, squeeze glutes at top, lower with control.' },
    { name: 'Bulgarian Split Squat', target: 'Quads & Glutes', sets: 3, reps: '8-10 each', rest_seconds: 90, instructions: 'Rear foot elevated, lower until front thigh is parallel.' },
    { name: 'Squat', target: 'Quads & Glutes', sets: 3, reps: '15-20', rest_seconds: 60, instructions: 'Bodyweight squat to full depth, control the movement.' },
    { name: 'Lunge', target: 'Quads & Glutes', sets: 3, reps: '10-12 each', rest_seconds: 60, instructions: 'Step forward into lunge, lower back knee, push back up.' },
    { name: 'Jump Squat', target: 'Legs (Power)', sets: 3, reps: '8-10', rest_seconds: 90, instructions: 'Squat down, explode up into jump, land softly.' },
    { name: 'Nordic Curl', target: 'Hamstrings', sets: 3, reps: '5-8', rest_seconds: 120, instructions: 'Kneel with feet anchored, lower body forward using hamstrings.' },
    { name: 'Single Leg Deadlift', target: 'Hamstrings & Balance', sets: 3, reps: '8-10 each', rest_seconds: 90, instructions: 'Stand on one leg, hinge forward, extend free leg behind.' },
  ];

  const coreExercises: ExerciseTemplate[] = [
    { name: 'Plank', target: 'Core', sets: 3, reps: '30-60 sec', rest_seconds: 60, instructions: 'Hold body straight from head to heels, brace core.' },
    { name: 'Hanging Leg Raise', target: 'Lower Abs', sets: 3, reps: '10-15', rest_seconds: 75, instructions: 'Hang from bar, raise legs to parallel or higher.' },
    { name: 'Ab Rollout', target: 'Core', sets: 3, reps: '8-12', rest_seconds: 75, instructions: 'Roll wheel forward extending body, pull back with core.' },
    { name: 'Russian Twist', target: 'Obliques', sets: 3, reps: '12-15 each side', rest_seconds: 60, instructions: 'Lean back slightly, rotate torso side to side.' },
    { name: 'Mountain Climber', target: 'Core & Cardio', sets: 3, reps: '20-30', rest_seconds: 60, instructions: 'Alternate driving knees to chest in plank position.' },
    { name: 'Dead Bug', target: 'Core', sets: 3, reps: '10 each side', rest_seconds: 60, instructions: 'Lie on back, extend opposite arm and leg, keep back flat.' },
    { name: 'Side Plank', target: 'Obliques', sets: 3, reps: '20-40 sec each', rest_seconds: 60, instructions: 'Hold body straight on one side, keep hips elevated.' },
    { name: 'Sit-up', target: 'Core', sets: 3, reps: '15-20', rest_seconds: 60, instructions: 'Lie on back, curl torso up toward knees.' },
    { name: 'Crunch', target: 'Abs', sets: 3, reps: '15-20', rest_seconds: 60, instructions: 'Lie on back, lift shoulders off ground using abs.' },
    { name: 'Leg Raise', target: 'Lower Abs', sets: 3, reps: '12-15', rest_seconds: 60, instructions: 'Lie flat, raise legs to 90 degrees, lower slowly.' },
    { name: 'Bear Crawl', target: 'Core & Coordination', sets: 3, reps: '20-30 sec', rest_seconds: 60, instructions: 'Crawl forward on hands and toes keeping back flat.' },
  ];

  const cardioExercises: ExerciseTemplate[] = [
    { name: 'Jump Rope', target: 'Cardio', sets: 3, reps: '3-5 min', rest_seconds: 60, instructions: 'Maintain steady rhythm, stay light on feet.' },
    { name: 'Burpee', target: 'Full Body Cardio', sets: 3, reps: '10-15', rest_seconds: 90, instructions: 'Drop to push-up, jump feet to hands, explode up.' },
    { name: 'High Knees', target: 'Cardio', sets: 3, reps: '30 sec', rest_seconds: 45, instructions: 'Run in place driving knees high, pump arms.' },
    { name: 'Box Jump', target: 'Power & Cardio', sets: 3, reps: '8-10', rest_seconds: 90, instructions: 'Jump onto box, stand tall, step back down.' },
    { name: 'Rowing Machine', target: 'Full Body Cardio', sets: 1, reps: '10-20 min', rest_seconds: 0, instructions: 'Maintain steady pace, drive with legs first.' },
    { name: 'Cycling', target: 'Cardio', sets: 1, reps: '15-30 min', rest_seconds: 0, instructions: 'Maintain moderate intensity, adjust resistance as needed.' },
    { name: 'Treadmill Run', target: 'Cardio', sets: 1, reps: '15-30 min', rest_seconds: 0, instructions: 'Maintain comfortable pace, increase speed gradually.' },
    { name: 'Broad Jump', target: 'Power', sets: 3, reps: '6-8', rest_seconds: 90, instructions: 'Swing arms, explode forward, land softly with bent knees.' },
    { name: 'Sprint Intervals', target: 'Speed & Cardio', sets: 6, reps: '20 sec sprint / 40 sec rest', rest_seconds: 40, instructions: 'All-out sprint for 20 seconds, recover for 40 seconds.' },
  ];

  const powerExercises: ExerciseTemplate[] = [
    { name: 'Power Clean', target: 'Full Body Power', sets: 5, reps: '3-5', rest_seconds: 180, instructions: 'Explosively pull bar from floor to shoulders in one motion.' },
    { name: 'Hang Clean', target: 'Power', sets: 4, reps: '3-5', rest_seconds: 150, instructions: 'Start from hang position, explosive pull to shoulders.' },
    { name: 'Push Press', target: 'Shoulders & Power', sets: 4, reps: '5-6', rest_seconds: 150, instructions: 'Dip at knees, drive weight up explosively overhead.' },
    { name: 'Box Jump', target: 'Lower Body Power', sets: 4, reps: '5-8', rest_seconds: 120, instructions: 'Explosive jump onto box, stand tall, step down.' },
    { name: 'Kettlebell Swing', target: 'Hips & Power', sets: 3, reps: '12-15', rest_seconds: 90, instructions: 'Hinge at hips, swing kettlebell to eye level.' },
    { name: 'Medicine Ball Slam', target: 'Core & Power', sets: 3, reps: '10-12', rest_seconds: 75, instructions: 'Raise ball overhead, slam down with full force.' },
  ];

  const sportExercises: ExerciseTemplate[] = [
    { name: 'Lateral Bound', target: 'Lateral Power', sets: 3, reps: '8 each side', rest_seconds: 75, instructions: 'Leap laterally, land softly on outside foot.' },
    { name: 'Agility Ladder Drill', target: 'Footwork', sets: 3, reps: '30 sec', rest_seconds: 60, instructions: 'Move feet quickly through ladder patterns.' },
    { name: 'Cone Drill', target: 'Change of Direction', sets: 3, reps: '4-6 reps', rest_seconds: 90, instructions: 'Sprint to cone, touch, change direction quickly.' },
    { name: 'Sled Push', target: 'Leg Power', sets: 4, reps: '20-30m', rest_seconds: 120, instructions: 'Drive sled forward with explosive leg drive.' },
    { name: 'Plyometric Push-up', target: 'Upper Body Power', sets: 3, reps: '8-10', rest_seconds: 90, instructions: 'Lower into push-up, explode up so hands leave ground.' },
    { name: 'Tuck Jump', target: 'Lower Body Power', sets: 3, reps: '8-10', rest_seconds: 75, instructions: 'Jump explosively, tuck knees to chest, land softly.' },
  ];

  // Build pool based on equipment
  const filter = getEquipmentFilter(equipment);

  const pool: Record<string, ExerciseTemplate[]> = {
    push: [...pushExercises, ...coreExercises.filter(filter)].filter(filter),
    pull: [...pullExercises, ...coreExercises.filter(filter)].filter(filter),
    legs: [...legExercises, ...coreExercises.filter(filter)].filter(filter),
    core: coreExercises.filter(filter),
    cardio: cardioExercises.filter(filter),
    power: [...powerExercises, ...sportExercises].filter(filter),
    sport: sportExercises.filter(filter),
    full_body: [...pushExercises.slice(0, 2), ...pullExercises.slice(0, 2), ...legExercises.slice(0, 2), ...coreExercises.slice(0, 2)].filter(filter),
  };

  return pool;
}

function selectExercises(pool: Record<string, ExerciseTemplate[]>, type: string, count: number): ExerciseTemplate[] {
  const available = pool[type] || pool.full_body;
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function buildDayTemplate(
  splitName: string,
  _goal: string,
  exercises: ExerciseTemplate[],
): WorkoutTemplate {
  const isRecovery = splitName.toLowerCase().includes('recovery');
  if (isRecovery) {
    return {
      day_of_week: '',
      workout_name: 'Recovery',
      workout_type: 'recovery',
      is_recovery_day: true,
      exercises: [],
    };
  }

  const typeMap: Record<string, string> = {
    'Push': 'push',
    'Pull': 'pull',
    'Legs': 'legs',
    'Upper': 'push',
    'Lower': 'legs',
    'Full Body': 'full_body',
    'Cardio': 'cardio',
    'Cardio & Core': 'cardio',
    'Power': 'power',
    'Power & Speed': 'power',
    'Speed & Agility': 'sport',
    'Upper Body': 'push',
    'Lower Body': 'legs',
  };

  return {
    day_of_week: '',
    workout_name: splitName,
    workout_type: typeMap[splitName] || 'full_body',
    is_recovery_day: false,
    exercises,
  };
}

function getExercisesForDay(
  splitName: string,
  _goal: string,
  pool: Record<string, ExerciseTemplate[]>,
  exerciseCount: number,
): ExerciseTemplate[] {

  if (splitName === 'Push') {
    return [
      ...selectExercises(pool, 'push', Math.ceil(exerciseCount * 0.6)),
      ...selectExercises(pool, 'core', Math.floor(exerciseCount * 0.4)),
    ];
  }
  if (splitName === 'Pull') {
    return [
      ...selectExercises(pool, 'pull', Math.ceil(exerciseCount * 0.7)),
      ...selectExercises(pool, 'core', Math.floor(exerciseCount * 0.3)),
    ];
  }
  if (splitName === 'Legs') {
    return [
      ...selectExercises(pool, 'legs', Math.ceil(exerciseCount * 0.75)),
      ...selectExercises(pool, 'core', Math.floor(exerciseCount * 0.25)),
    ];
  }
  if (splitName === 'Upper' || splitName === 'Upper Body') {
    return [
      ...selectExercises(pool, 'push', Math.ceil(exerciseCount * 0.35)),
      ...selectExercises(pool, 'pull', Math.ceil(exerciseCount * 0.35)),
      ...selectExercises(pool, 'core', Math.floor(exerciseCount * 0.3)),
    ];
  }
  if (splitName === 'Lower' || splitName === 'Lower Body') {
    return [
      ...selectExercises(pool, 'legs', Math.ceil(exerciseCount * 0.7)),
      ...selectExercises(pool, 'core', Math.floor(exerciseCount * 0.3)),
    ];
  }
  if (splitName === 'Full Body') {
    return [
      ...selectExercises(pool, 'push', 2),
      ...selectExercises(pool, 'pull', 2),
      ...selectExercises(pool, 'legs', 2),
      ...selectExercises(pool, 'core', 1),
    ];
  }
  if (splitName === 'Cardio' || splitName === 'Cardio & Core') {
    return [
      ...selectExercises(pool, 'cardio', Math.ceil(exerciseCount * 0.6)),
      ...selectExercises(pool, 'core', Math.floor(exerciseCount * 0.4)),
    ];
  }
  if (splitName === 'Power' || splitName === 'Power & Speed') {
    return [
      ...selectExercises(pool, 'power', Math.ceil(exerciseCount * 0.6)),
      ...selectExercises(pool, 'core', Math.floor(exerciseCount * 0.4)),
    ];
  }
  if (splitName === 'Speed & Agility') {
    return [
      ...selectExercises(pool, 'sport', Math.ceil(exerciseCount * 0.6)),
      ...selectExercises(pool, 'cardio', Math.floor(exerciseCount * 0.4)),
    ];
  }

  return selectExercises(pool, 'full_body', exerciseCount);
}

export function generateWorkoutPlan(profile: UserProfile): WorkoutDayWithExercises[] {
  const days = profile.training_days_per_week || 3;
  const goal = profile.goal || 'General Fitness';
  const duration = profile.workout_duration || '60';
  const durationMult = getDurationMultiplier(duration);

  const splits = getSplitsForDays(days, goal);
  const pool = buildExercisePool(goal, profile.equipment, profile.training_location);

  const baseExercises = goal === 'Build Muscle' || goal === 'Competition Prep' ? 6 : 5;
  const exerciseCount = Math.max(4, Math.round(baseExercises * durationMult));

  const result: WorkoutDayWithExercises[] = [];
  let dayIndex = 0;

  for (let i = 0; i < 7; i++) {
    if (dayIndex < splits.length) {
      const split = splits[dayIndex];
      const template = buildDayTemplate(split, goal, []);

      if (!template.is_recovery_day) {
        const exercises = getExercisesForDay(split, goal, pool, exerciseCount);
        template.exercises = exercises;
      }

      result.push({
        id: '',
        workout_plan_id: '',
        day_of_week: DAYS_OF_WEEK[i],
        workout_name: template.workout_name,
        workout_type: template.workout_type,
        is_recovery_day: template.is_recovery_day,
        order_index: i,
        exercises: template.exercises.map((ex, idx) => ({
          id: '',
          workout_day_id: '',
          exercise_name: ex.name,
          target: ex.target,
          sets: ex.sets,
          reps: ex.reps,
          rest_seconds: ex.rest_seconds,
          instructions: ex.instructions,
          order_index: idx,
        })),
      });
      dayIndex++;
    } else {
      // Remaining days are recovery
      result.push({
        id: '',
        workout_plan_id: '',
        day_of_week: DAYS_OF_WEEK[i],
        workout_name: 'Recovery',
        workout_type: 'recovery',
        is_recovery_day: true,
        order_index: i,
        exercises: [],
      });
    }
  }

  return result;
}
