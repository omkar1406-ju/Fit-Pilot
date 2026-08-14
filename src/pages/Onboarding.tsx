import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import './Onboarding.css';

const STEPS = ['About You', 'Fitness', 'Goal', 'Training', 'Preferences'];

const goalOptions = [
  { icon: '🏋️', label: 'Build Muscle' },
  { icon: '💪', label: 'Get Stronger' },
  { icon: '✨', label: 'General Fitness' },
  { icon: '⚽', label: 'Sports Performance' },
  { icon: '🏃', label: 'Endurance' },
  { icon: '🏆', label: 'Competition Prep' },
];

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    age: '',
    height: '',
    weight: '',
    fitness_level: '',
    activity_level: '',
    training_days_per_week: '',
    goal: '',
    sport: '',
    workout_duration: '',
    training_location: '',
    equipment: '',
    dietary_preference: '',
    allergies: '',
    health_conditions: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const goNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    const { error: insertError } = await supabase.from('profiles').upsert({
      id: user.id,
      age: formData.age ? parseInt(formData.age) : null,
      height: formData.height ? parseFloat(formData.height) : null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      fitness_level: formData.fitness_level || null,
      activity_level: formData.activity_level || null,
      training_days_per_week: formData.training_days_per_week ? parseInt(formData.training_days_per_week) : null,
      goal: formData.goal || null,
      sport: formData.sport || null,
      workout_duration: formData.workout_duration || null,
      training_location: formData.training_location || null,
      equipment: formData.equipment || null,
      dietary_preference: formData.dietary_preference || null,
      allergies: formData.allergies || null,
      health_conditions: formData.health_conditions || null,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    });

    setLoading(false);

    if (insertError) {
      setError('Failed to save your profile. Please try again.');
      return;
    }

    await refreshProfile();
    navigate('/dashboard');
  };

  return (
    <div className="onboarding">
      <div className="onboarding__card">
        <div className="onboarding__header">
          <div className="onboarding__logo">
            <span className="onboarding__logo-mark">FP</span>
            FitPilot
          </div>
          <div className="onboarding__progress">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`onboarding__progress-step ${
                  i < step ? 'onboarding__progress-step--done' : i === step ? 'onboarding__progress-step--active' : ''
                }`}
              />
            ))}
          </div>
          <span className="onboarding__step-label">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </span>
        </div>

        <div className="onboarding__form">
          {error && <div className="auth-error">{error}</div>}

          {step === 0 && (
            <>
              <h2 className="onboarding__form-title">About You</h2>
              <p className="onboarding__form-subtitle">Tell us a bit about yourself so we can personalize your experience.</p>
              <div className="onboarding__form-grid">
                <div className="onboarding__form-group">
                  <label className="onboarding__form-label">Age</label>
                  <input className="onboarding__form-input" type="number" placeholder="e.g. 25" value={formData.age} onChange={(e) => updateField('age', e.target.value)} />
                </div>
                <div className="onboarding__form-group">
                  <label className="onboarding__form-label">Height (cm)</label>
                  <input className="onboarding__form-input" type="number" placeholder="e.g. 175" value={formData.height} onChange={(e) => updateField('height', e.target.value)} />
                </div>
                <div className="onboarding__form-group onboarding__form-group--full">
                  <label className="onboarding__form-label">Weight (kg)</label>
                  <input className="onboarding__form-input" type="number" placeholder="e.g. 70" value={formData.weight} onChange={(e) => updateField('weight', e.target.value)} />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="onboarding__form-title">Fitness Level</h2>
              <p className="onboarding__form-subtitle">Help us understand your current fitness level and availability.</p>
              <div className="onboarding__form-grid">
                <div className="onboarding__form-group onboarding__form-group--full">
                  <label className="onboarding__form-label">Experience Level</label>
                  <select className="onboarding__form-select" value={formData.fitness_level} onChange={(e) => updateField('fitness_level', e.target.value)}>
                    <option value="">Select</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="onboarding__form-group onboarding__form-group--full">
                  <label className="onboarding__form-label">Activity Level</label>
                  <select className="onboarding__form-select" value={formData.activity_level} onChange={(e) => updateField('activity_level', e.target.value)}>
                    <option value="">Select</option>
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="onboarding__form-group onboarding__form-group--full">
                  <label className="onboarding__form-label">Training Days per Week</label>
                  <select className="onboarding__form-select" value={formData.training_days_per_week} onChange={(e) => updateField('training_days_per_week', e.target.value)}>
                    <option value="">Select</option>
                    <option value="2">2 days</option>
                    <option value="3">3 days</option>
                    <option value="4">4 days</option>
                    <option value="5">5 days</option>
                    <option value="6">6 days</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="onboarding__form-title">Your Goal</h2>
              <p className="onboarding__form-subtitle">What do you want to achieve? Pick the one that matters most to you.</p>
              <div className="onboarding__goals-grid">
                {goalOptions.map((g) => (
                  <div
                    className={`onboarding__goal-option ${formData.goal === g.label ? 'onboarding__goal-option--selected' : ''}`}
                    key={g.label}
                    onClick={() => updateField('goal', g.label)}
                  >
                    <div className="onboarding__goal-icon">{g.icon}</div>
                    <div className="onboarding__goal-label">{g.label}</div>
                  </div>
                ))}
              </div>
              {formData.goal === 'Sports Performance' && (
                <div className="onboarding__form-group" style={{ marginTop: '16px' }}>
                  <label className="onboarding__form-label">What sport?</label>
                  <input className="onboarding__form-input" type="text" placeholder="e.g. Basketball, Soccer, Tennis" value={formData.sport} onChange={(e) => updateField('sport', e.target.value)} />
                </div>
              )}
              {formData.goal === 'Competition Prep' && (
                <div className="onboarding__form-group" style={{ marginTop: '16px' }}>
                  <label className="onboarding__form-label">What competition?</label>
                  <input className="onboarding__form-input" type="text" placeholder="e.g. Bodybuilding show, Marathon" value={formData.sport} onChange={(e) => updateField('sport', e.target.value)} />
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="onboarding__form-title">Training</h2>
              <p className="onboarding__form-subtitle">Tell us about your training setup and preferences.</p>
              <div className="onboarding__form-grid">
                <div className="onboarding__form-group onboarding__form-group--full">
                  <label className="onboarding__form-label">Available Training Days</label>
                  <select className="onboarding__form-select" value={formData.training_days_per_week} onChange={(e) => updateField('training_days_per_week', e.target.value)}>
                    <option value="">Select</option>
                    <option value="2">2 days</option>
                    <option value="3">3 days</option>
                    <option value="4">4 days</option>
                    <option value="5">5 days</option>
                    <option value="6">6 days</option>
                  </select>
                </div>
                <div className="onboarding__form-group onboarding__form-group--full">
                  <label className="onboarding__form-label">Approximate Workout Duration</label>
                  <select className="onboarding__form-select" value={formData.workout_duration} onChange={(e) => updateField('workout_duration', e.target.value)}>
                    <option value="">Select</option>
                    <option value="30">Around 30 minutes</option>
                    <option value="45">Around 45 minutes</option>
                    <option value="60">Around 60 minutes</option>
                    <option value="90">90+ minutes</option>
                  </select>
                </div>
                <div className="onboarding__form-group onboarding__form-group--full">
                  <label className="onboarding__form-label">Training Location</label>
                  <select className="onboarding__form-select" value={formData.training_location} onChange={(e) => updateField('training_location', e.target.value)}>
                    <option value="">Select</option>
                    <option value="gym">Gym</option>
                    <option value="home">Home</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div className="onboarding__form-group onboarding__form-group--full">
                  <label className="onboarding__form-label">Available Equipment</label>
                  <select className="onboarding__form-select" value={formData.equipment} onChange={(e) => updateField('equipment', e.target.value)}>
                    <option value="">Select</option>
                    <option value="bodyweight">Bodyweight only</option>
                    <option value="minimal">Minimal equipment</option>
                    <option value="home">Home gym</option>
                    <option value="full">Full gym</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="onboarding__form-title">Preferences</h2>
              <p className="onboarding__form-subtitle">Fine-tune your plan with dietary and health preferences.</p>
              <div className="onboarding__form-grid">
                <div className="onboarding__form-group onboarding__form-group--full">
                  <label className="onboarding__form-label">Dietary Preference</label>
                  <select className="onboarding__form-select" value={formData.dietary_preference} onChange={(e) => updateField('dietary_preference', e.target.value)}>
                    <option value="">Select</option>
                    <option value="none">No restrictions</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="keto">Keto</option>
                    <option value="paleo">Paleo</option>
                  </select>
                </div>
                <div className="onboarding__form-group onboarding__form-group--full">
                  <label className="onboarding__form-label">Food Allergies / Intolerances (optional)</label>
                  <input className="onboarding__form-input" type="text" placeholder="e.g. Gluten, Lactose, Nuts" value={formData.allergies} onChange={(e) => updateField('allergies', e.target.value)} />
                </div>
                <div className="onboarding__form-group onboarding__form-group--full">
                  <label className="onboarding__form-label">Relevant Health Conditions (optional)</label>
                  <input className="onboarding__form-input" type="text" placeholder="e.g. Knee injury, Back pain" value={formData.health_conditions} onChange={(e) => updateField('health_conditions', e.target.value)} />
                </div>
              </div>
            </>
          )}

          <div className="onboarding__actions">
            {step > 0 && (
              <Button variant="secondary" onClick={goBack}>
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={goNext} fullWidth={step === 0}>
                Continue
              </Button>
            ) : (
              <Button onClick={handleSubmit} fullWidth size="lg" disabled={loading}>
                {loading ? 'Saving...' : 'Complete Setup'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
