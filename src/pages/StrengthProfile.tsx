import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { EXERCISES, getExerciseById, isBodyweightExercise, LEVEL_COLORS, LEVEL_MESSAGES, type StrengthLevel } from '../data/strengthBenchmarks';
import { estimate1RM, calculateLiftResult, calculateOverallStrength, type LiftEntry, type LiftResult, type OverallStrength } from '../lib/strengthService';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import Button from '../components/Button';
import './StrengthProfile.css';

// Animated number display component
function AnimNum({ value, decimals = 0, suffix = '', delay = 0 }: { value: number; decimals?: number; suffix?: string; delay?: number }) {
  const animated = useAnimatedNumber(value, 900, delay, value > 0);
  return <>{animated.toFixed(decimals)}{suffix}</>;
}

// Analyzing overlay with scanning effect
function AnalyzingOverlay({ step }: { step: number }) {
  const steps = [
    'Scanning performance data...',
    'Calculating estimated 1RM...',
    'Comparing with strength standards...',
    'Building your strength profile...',
  ];

  return (
    <div className="strength-overlay">
      <div className="strength-overlay__scanner">
        <div className="strength-overlay__line" />
      </div>
      <div className="strength-overlay__content">
        <div className="strength-overlay__icon">⚡</div>
        <h2 className="strength-overlay__title">Analyzing Your Strength</h2>
        <div className="strength-overlay__steps">
          {steps.map((text, i) => (
            <div
              key={i}
              className={`strength-overlay__step ${i <= step ? 'strength-overlay__step--active' : ''} ${i < step ? 'strength-overlay__step--done' : ''}`}
            >
              <span className="strength-overlay__step-dot">
                {i < step ? '✓' : i === step ? <span className="strength-overlay__step-pulse" /> : ''}
              </span>
              {text}
            </div>
          ))}
        </div>
        <div className="strength-overlay__bar">
          <div
            className="strength-overlay__bar-fill"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Confetti burst for personal bests
function ConfettiBurst() {
  const particles = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="strength-confetti" aria-hidden="true">
      {particles.map((i) => (
        <span
          key={i}
          className="strength-confetti__particle"
          style={{
            '--angle': `${(i / particles.length) * 360}deg`,
            '--color': ['#2563EB', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444'][i % 5],
            '--delay': `${Math.random() * 0.2}s`,
            '--distance': `${40 + Math.random() * 60}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// Animated meter with sliding indicator
function StrengthMeter({ percentile, color, delay = 0 }: { percentile: number; color: string; delay?: number }) {
  return (
    <div className="strength-meter">
      <div className="strength-meter__track">
        <div
          className="strength-meter__fill"
          style={{ '--fill-width': `${percentile}%`, '--fill-color': color, '--fill-delay': `${delay}ms` } as React.CSSProperties}
        />
        <div
          className="strength-meter__indicator"
          style={{ '--indicator-pos': `${percentile}%`, '--indicator-color': color, '--indicator-delay': `${delay}ms` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

// Individual lift result card with stagger
function LiftCard({ result, index }: { result: LiftResult; index: number }) {
  const exercise = getExerciseById(result.exerciseId);
  if (!exercise) return null;
  const isBW = exercise.type === 'bodyweight';
  const animDelay = index * 120;

  return (
    <div
      className="strength-lift-card"
      style={{ '--card-delay': `${animDelay}ms` } as React.CSSProperties}
    >
      <div className="strength-lift-card__header">
        <h3 className="strength-lift-card__name">{exercise.name}</h3>
        <span
          className="strength-lift-card__badge"
          style={{ '--badge-color': LEVEL_COLORS[result.level] } as React.CSSProperties}
        >
          {result.level}
        </span>
      </div>

      <div className="strength-lift-card__stats">
        {isBW ? (
          <div className="strength-lift-card__stat">
            <span className="strength-lift-card__stat-label">Score</span>
            <span className="strength-lift-card__stat-value">
              <AnimNum value={result.estimated1RM} delay={animDelay + 300} /> pts
            </span>
          </div>
        ) : (
          <>
            <div className="strength-lift-card__stat">
              <span className="strength-lift-card__stat-label">Est. 1RM</span>
              <span className="strength-lift-card__stat-value">
                <AnimNum value={result.estimated1RM} delay={animDelay + 300} /> kg
              </span>
            </div>
            <div className="strength-lift-card__stat">
              <span className="strength-lift-card__stat-label">vs Bodyweight</span>
              <span className="strength-lift-card__stat-value">
                <AnimNum value={result.ratioToBodyweight || 0} decimals={2} delay={animDelay + 400} />x
              </span>
            </div>
          </>
        )}
      </div>

      <div className="strength-lift-card__meter-row">
        <StrengthMeter percentile={result.percentile} color={LEVEL_COLORS[result.level]} delay={animDelay + 200} />
        <span className="strength-lift-card__percentile-text">
          Top <AnimNum value={100 - result.percentile} decimals={0} delay={animDelay + 500} />%
        </span>
      </div>
    </div>
  );
}

// Strength level badge with pop animation
function LevelBadge({ level, delay = 0 }: { level: StrengthLevel; delay?: number }) {
  return (
    <div
      className="strength-level-badge"
      style={{ '--level-color': LEVEL_COLORS[level], '--badge-delay': `${delay}ms` } as React.CSSProperties}
    >
      <span className="strength-level-badge__text">{level.toUpperCase()}</span>
    </div>
  );
}

export default function StrengthProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const [lifts, setLifts] = useState<LiftEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<LiftResult[]>([]);
  const [overall, setOverall] = useState<OverallStrength | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [celebrating, setCelebrating] = useState(false);

  const [formExercise, setFormExercise] = useState('bench_press');
  const [formWeight, setFormWeight] = useState('');
  const [formReps, setFormReps] = useState('');
  const [formSets, setFormSets] = useState('');
  const [formExtraWeight, setFormExtraWeight] = useState('');

  const isBodyweight = isBodyweightExercise(formExercise);
  const analyzeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchLifts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_lifts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setLifts(data as LiftEntry[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLifts();
  }, [fetchLifts]);

  const computeResults = useCallback(() => {
    if (!profile?.weight || !lifts.length) {
      setResults([]);
      setOverall(null);
      return { liftResults: [], newOverall: null };
    }

    const bestByExercise = new Map<string, LiftEntry>();
    for (const lift of lifts) {
      const existing = bestByExercise.get(lift.exercise_id);
      if (!existing) {
        bestByExercise.set(lift.exercise_id, lift);
      } else {
        const isBW = isBodyweightExercise(lift.exercise_id);
        if (isBW) {
          const thisScore = lift.reps + (lift.extra_weight_kg || 0) * 0.5;
          const existScore = existing.reps + (existing.extra_weight_kg || 0) * 0.5;
          if (thisScore > existScore) bestByExercise.set(lift.exercise_id, lift);
        } else {
          if (estimate1RM(lift.weight_kg, lift.reps) > estimate1RM(existing.weight_kg, existing.reps)) {
            bestByExercise.set(lift.exercise_id, lift);
          }
        }
      }
    }

    const liftResults = Array.from(bestByExercise.values()).map((lift) =>
      calculateLiftResult(lift, profile.weight!)
    );
    const newOverall = calculateOverallStrength(lifts, profile.weight!);
    return { liftResults, newOverall };
  }, [lifts, profile?.weight]);

  // Run analysis with animation sequence
  const runAnalysis = useCallback(() => {
    setShowResults(false);
    setAnalyzing(true);
    setAnalyzeStep(0);

    analyzeTimerRef.current = setTimeout(() => setAnalyzeStep(1), 600);
    analyzeTimerRef.current = setTimeout(() => setAnalyzeStep(2), 1200);
    analyzeTimerRef.current = setTimeout(() => setAnalyzeStep(3), 1800);

    analyzeTimerRef.current = setTimeout(() => {
      const { liftResults, newOverall } = computeResults();
      setResults(liftResults);
      setOverall(newOverall);
      setAnalyzing(false);
      setAnalyzeStep(-1);
      setShowResults(true);
    }, 2400);
  }, [computeResults]);

  // Auto-analyze on load when lifts exist
  useEffect(() => {
    if (!loading && lifts.length > 0 && !showResults && !analyzing) {
      runAnalysis();
    } else if (!loading && lifts.length === 0) {
      setResults([]);
      setOverall(null);
    }
  }, [loading, lifts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    };
  }, []);

  const handleAddLift = async () => {
    setError('');
    setSuccess('');

    if (!user) {
      setError('You are not logged in.');
      return;
    }

    if (!profile?.weight) {
      setError('Please complete your weight in Edit Profile first.');
      return;
    }

    if (!formReps || parseInt(formReps) < 1) {
      setError('Please enter a valid number of reps.');
      return;
    }

    if (!isBodyweight && (!formWeight || parseFloat(formWeight) < 1)) {
      setError('Please enter the weight lifted.');
      return;
    }

    setAnalyzing(true);

    const payload = {
      user_id: user.id,
      exercise_id: formExercise,
      weight_kg: isBodyweight ? 0 : parseFloat(formWeight),
      reps: parseInt(formReps),
      sets: formSets ? parseInt(formSets) : null,
      extra_weight_kg: isBodyweight && formExtraWeight ? parseFloat(formExtraWeight) : null,
    };

    // Check if this is a personal best before saving
    const existingBest = lifts.filter((l) => l.exercise_id === formExercise);
    let isPB = true;
    if (existingBest.length > 0) {
      const newScore = isBodyweight
        ? payload.reps + (payload.extra_weight_kg || 0) * 0.5
        : estimate1RM(payload.weight_kg, payload.reps);
      isPB = existingBest.some((l) => {
        const oldScore = isBodyweight
          ? l.reps + (l.extra_weight_kg || 0) * 0.5
          : estimate1RM(l.weight_kg, l.reps);
        return newScore > oldScore;
      });
    } else {
      isPB = true; // First lift is always a "best"
    }

    const { error: insertError } = await supabase.from('user_lifts').insert(payload);

    if (insertError) {
      setError('Failed to save lift. Please try again.');
      setAnalyzing(false);
      return;
    }

    await refreshProfile();
    await fetchLifts();
    setSuccess('Lift saved successfully.');
    setShowForm(false);
    setFormWeight('');
    setFormReps('');
    setFormSets('');
    setFormExtraWeight('');
    setAnalyzing(false);

    if (isPB) {
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 2000);
    }
  };

  const handleDeleteLift = async (liftId: string) => {
    const { error } = await supabase.from('user_lifts').delete().eq('id', liftId);
    if (!error) {
      await fetchLifts();
      setShowResults(false);
      setTimeout(() => runAnalysis(), 100);
    }
  };

  const bestResults = results;
  const hasCompoundLifts = results.some((r) => ['bench_press', 'squat', 'deadlift'].includes(r.exerciseId));

  if (loading) {
    return (
      <div className="strength-page">
        <div className="strength-page__loading">
          <div className="strength-spinner" />
          <p>Loading your strength data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="strength-page">
      <div className="strength-page__card">
        <div className="strength-page__header">
          <div className="strength-page__title-row">
            <h1 className="strength-page__title">⚡ Strength Profile</h1>
            {!showForm && !analyzing && (
              <Button onClick={() => setShowForm(true)}>Add Lift</Button>
            )}
          </div>
          <p className="strength-page__subtitle">
            See how your strength compares. Estimated based on available strength standards.
          </p>
        </div>

        {error && <div className="strength-error">{error}</div>}
        {success && <div className="strength-success">{success}</div>}

        {/* Analyzing overlay */}
        {analyzing && <AnalyzingOverlay step={analyzeStep} />}

        {/* Form */}
        {showForm && !analyzing && (
          <div className="strength-form">
            <h2 className="strength-form__title">Log a Lift</h2>
            <div className="strength-form__grid">
              <div className="strength-form__group">
                <label className="strength-form__label">Exercise</label>
                <select
                  className="strength-form__select"
                  value={formExercise}
                  onChange={(e) => {
                    setFormExercise(e.target.value);
                    setFormWeight('');
                    setFormReps('');
                    setFormExtraWeight('');
                  }}
                >
                  {EXERCISES.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>

              {!isBodyweight && (
                <div className="strength-form__group">
                  <label className="strength-form__label">Weight (kg)</label>
                  <input
                    className="strength-form__input"
                    type="number"
                    placeholder="e.g. 80"
                    value={formWeight}
                    onChange={(e) => setFormWeight(e.target.value)}
                  />
                </div>
              )}

              <div className="strength-form__group">
                <label className="strength-form__label">Reps</label>
                <input
                  className="strength-form__input"
                  type="number"
                  placeholder="e.g. 8"
                  value={formReps}
                  onChange={(e) => setFormReps(e.target.value)}
                />
              </div>

              <div className="strength-form__group">
                <label className="strength-form__label">Sets (optional)</label>
                <input
                  className="strength-form__input"
                  type="number"
                  placeholder="e.g. 3"
                  value={formSets}
                  onChange={(e) => setFormSets(e.target.value)}
                />
              </div>

              {isBodyweight && (
                <div className="strength-form__group">
                  <label className="strength-form__label">Extra Weight (kg, optional)</label>
                  <input
                    className="strength-form__input"
                    type="number"
                    placeholder="e.g. 10"
                    value={formExtraWeight}
                    onChange={(e) => setFormExtraWeight(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="strength-form__actions">
              <Button variant="secondary" onClick={() => { setShowForm(false); setError(''); }}>
                Cancel
              </Button>
              <Button onClick={handleAddLift}>
                {analyzing ? 'Saving...' : 'Save Lift'}
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        {!analyzing && showResults && bestResults.length > 0 && (
          <div className="strength-results">
            {/* Overall strength */}
            {overall && (
              <div className="strength-overall">
                {celebrating && <ConfettiBurst />}
                <div className="strength-overall__header">
                  <span className="strength-overall__icon">⚡</span>
                  <h2 className="strength-overall__title">Overall Strength</h2>
                </div>
                <div className="strength-overall__score">
                  <div className="strength-overall__percentile">
                    <span className="strength-overall__percentile-label">TOP</span>
                    <span className="strength-overall__percentile-number">
                      <AnimNum value={100 - overall.percentile} delay={200} />%
                    </span>
                  </div>
                  <LevelBadge level={overall.level} delay={600} />
                  <p className="strength-overall__ratio">
                    Total Lift Score: <AnimNum value={overall.totalScore} delay={400} /> kg ·{' '}
                    <AnimNum value={overall.bodyweightRatio} decimals={1} delay={500} />x bodyweight
                  </p>
                  <p className="strength-overall__desc">
                    Estimated stronger than <AnimNum value={overall.percentile} delay={300} />% of comparable users.
                  </p>
                </div>
                <p className="strength-overall__message">{LEVEL_MESSAGES[overall.level]}</p>
              </div>
            )}

            {!overall && hasCompoundLifts && (
              <div className="strength-overall strength-overall--locked">
                <p>Add more major lifts (Bench Press, Squat, Deadlift) to unlock your Overall Strength Score.</p>
              </div>
            )}

            {/* Individual lift cards */}
            <div className="strength-lifts-grid">
              {bestResults.map((result, i) => (
                <LiftCard key={result.exerciseId} result={result} index={i} />
              ))}
            </div>

            <p className="strength-disclaimer">
              Strength estimates are based on the performance you enter and are not a substitute for proper coaching or safe lifting practices.
            </p>
          </div>
        )}

        {/* Lift history */}
        {!analyzing && lifts.length > 0 && (
          <div className="strength-history">
            <h2 className="strength-history__title">Lift History</h2>
            <div className="strength-history__list">
              {lifts.map((lift) => {
                const exercise = getExerciseById(lift.exercise_id);
                if (!exercise) return null;
                const isBW = isBodyweightExercise(lift.exercise_id);
                return (
                  <div key={lift.id} className="strength-history__item">
                    <div className="strength-history__info">
                      <span className="strength-history__exercise">{exercise.name}</span>
                      <span className="strength-history__detail">
                        {isBW
                          ? `${lift.reps} reps${lift.extra_weight_kg ? ` + ${lift.extra_weight_kg} kg` : ''}`
                          : `${lift.weight_kg} kg × ${lift.reps} reps`}
                        {lift.sets ? ` × ${lift.sets} sets` : ''}
                      </span>
                      <span className="strength-history__date">
                        {new Date(lift.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      className="strength-history__delete"
                      onClick={() => handleDeleteLift(lift.id)}
                      title="Delete lift"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!analyzing && lifts.length === 0 && (
          <div className="strength-empty">
            <div className="strength-empty__icon">⚡</div>
            <h3 className="strength-empty__title">No lifts recorded yet</h3>
            <p className="strength-empty__desc">
              Add your first lift to see your estimated strength profile and how you compare.
            </p>
            <Button onClick={() => setShowForm(true)}>Add Your First Lift</Button>
          </div>
        )}
      </div>
    </div>
  );
}
