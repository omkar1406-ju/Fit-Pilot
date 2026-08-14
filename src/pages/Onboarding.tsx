import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import './Onboarding.css';

const STEPS = ['Personal', 'Fitness', 'Goal', 'Preferences'];

const goalOptions = [
  { icon: '🏋️', label: 'Muscle Building' },
  { icon: '💪', label: 'Strength' },
  { icon: '⚽', label: 'Sports Performance' },
  { icon: '🏃', label: 'Endurance' },
  { icon: '✨', label: 'General Fitness' },
  { icon: '🏆', label: 'Competition Prep' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);

  const goNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="onboarding">
      <div className="onboarding__card">
        <div className="onboarding__header">
          <Link to="/" className="onboarding__logo">
            <span className="onboarding__logo-mark">FP</span>
            FitPilot
          </Link>
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
          {step === 0 && (
            <>
              <h2 className="onboarding__form-title">Personal Information</h2>
              <p className="onboarding__form-subtitle">Tell us a bit about yourself so we can personalize your experience.</p>
              <div className="onboarding__form-grid">
                <div className="onboarding__form-group">
                  <label className="onboarding__form-label">Age</label>
                  <input className="onboarding__form-input" type="number" placeholder="e.g. 25" />
                </div>
                <div className="onboarding__form-group">
                  <label className="onboarding__form-label">Gender</label>
                  <select className="onboarding__form-select">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not">Prefer not to say</option>
                  </select>
                </div>
                <div className="onboarding__form-group">
                  <label className="onboarding__form-label">Height</label>
                  <input className="onboarding__form-input" type="text" placeholder="e.g. 175 cm" />
                </div>
                <div className="onboarding__form-group">
                  <label className="onboarding__form-label">Weight</label>
                  <input className="onboarding__form-input" type="text" placeholder="e.g. 70 kg" />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="onboarding__form-title">Fitness Profile</h2>
              <p className="onboarding__form-subtitle">Help us understand your current fitness level and availability.</p>
              <div className="onboarding__form-grid">
                <div className="onboarding__form-group">
                  <label className="onboarding__form-label">Experience Level</label>
                  <select className="onboarding__form-select">
                    <option value="">Select</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                <div className="onboarding__form-group">
                  <label className="onboarding__form-label">Activity Level</label>
                  <select className="onboarding__form-select">
                    <option value="">Select</option>
                    <option value="sedentary">Sedentary</option>
                    <option value="light">Lightly Active</option>
                    <option value="moderate">Moderately Active</option>
                    <option value="very">Very Active</option>
                  </select>
                </div>
                <div className="onboarding__form-group">
                  <label className="onboarding__form-label">Training Days per Week</label>
                  <select className="onboarding__form-select">
                    <option value="">Select</option>
                    <option value="2">2 days</option>
                    <option value="3">3 days</option>
                    <option value="4">4 days</option>
                    <option value="5">5 days</option>
                    <option value="6">6 days</option>
                  </select>
                </div>
                <div className="onboarding__form-group">
                  <label className="onboarding__form-label">Available Equipment</label>
                  <select className="onboarding__form-select">
                    <option value="">Select</option>
                    <option value="bodyweight">Bodyweight only</option>
                    <option value="home">Home gym</option>
                    <option value="full">Full gym</option>
                    <option value="minimal">Minimal equipment</option>
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
                  <div className="onboarding__goal-option" key={g.label}>
                    <div className="onboarding__goal-icon">{g.icon}</div>
                    <div className="onboarding__goal-label">{g.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="onboarding__form-title">Preferences</h2>
              <p className="onboarding__form-subtitle">Fine-tune your plan with training and dietary preferences.</p>
              <div className="onboarding__form-grid">
                <div className="onboarding__form-group onboarding__form-group--full">
                  <label className="onboarding__form-label">Training Preferences</label>
                  <select className="onboarding__form-select">
                    <option value="">Select</option>
                    <option value="gym">Gym workouts</option>
                    <option value="home">Home workouts</option>
                    <option value="outdoor">Outdoor training</option>
                    <option value="mixed">Mixed training</option>
                  </select>
                </div>
                <div className="onboarding__form-group onboarding__form-group--full">
                  <label className="onboarding__form-label">Dietary Preferences</label>
                  <select className="onboarding__form-select">
                    <option value="">Select</option>
                    <option value="none">No restrictions</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="keto">Keto</option>
                    <option value="paleo">Paleo</option>
                  </select>
                </div>
                <div className="onboarding__form-group onboarding__form-group--full">
                  <label className="onboarding__form-label">Health Information (optional)</label>
                  <input className="onboarding__form-input" type="text" placeholder="Any injuries or conditions we should know about?" />
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
              <Link to="/dashboard" style={{ flex: 1 }}>
                <Button fullWidth size="lg">
                  Complete Setup
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
