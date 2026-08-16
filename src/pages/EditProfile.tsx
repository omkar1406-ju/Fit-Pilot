import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import './EditProfile.css';

export default function EditProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
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

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        age: profile.age != null ? String(profile.age) : '',
        height: profile.height != null ? String(profile.height) : '',
        weight: profile.weight != null ? String(profile.weight) : '',
        fitness_level: profile.fitness_level || '',
        activity_level: profile.activity_level || '',
        training_days_per_week: profile.training_days_per_week != null ? String(profile.training_days_per_week) : '',
        goal: profile.goal || '',
        sport: profile.sport || '',
        workout_duration: profile.workout_duration || '',
        training_location: profile.training_location || '',
        equipment: profile.equipment || '',
        dietary_preference: profile.dietary_preference || '',
        allergies: profile.allergies || '',
        health_conditions: profile.health_conditions || '',
      });
    }
  }, [profile]);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('You are not logged in.');
      return;
    }

    if (!formData.name.trim()) {
      setError('Name is required.');
      return;
    }

    setLoading(true);

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      console.error('[PROFILE] Auth error:', authError?.message, authError?.code);
      setError('Authentication error. Please log in again.');
      setLoading(false);
      return;
    }

    const payload = {
      id: authUser.id,
      name: formData.name.trim(),
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
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase.from('profiles').upsert(payload);

    setLoading(false);

    if (updateError) {
      console.error('[PROFILE] ====== SUPABASE UPDATE ERROR ======');
      console.error('[PROFILE] error.message:', updateError.message);
      console.error('[PROFILE] error.code:', updateError.code);
      console.error('[PROFILE] error.details:', updateError.details);
      console.error('[PROFILE] error.hint:', updateError.hint);
      console.error('[PROFILE] ====== END ERROR ======');
      setError('Failed to update your profile. Please try again.');
      return;
    }

    await refreshProfile();
    setSuccess('Profile updated successfully.');
  };

  return (
    <div className="edit-profile">
      <div className="edit-profile__card">
        <div className="edit-profile__header">
          <h1 className="edit-profile__title">Edit Profile</h1>
          <p className="edit-profile__subtitle">Update your personal information and preferences.</p>
        </div>

        <form className="edit-profile__form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="edit-profile__success">{success}</div>}

          <h2 className="edit-profile__section-title">About You</h2>
          <div className="edit-profile__grid">
            <div className="edit-profile__group edit-profile__group--full">
              <label className="edit-profile__label">Name</label>
              <input className="edit-profile__input" type="text" placeholder="Your name" value={formData.name} onChange={(e) => updateField('name', e.target.value)} />
            </div>
            <div className="edit-profile__group">
              <label className="edit-profile__label">Age</label>
              <input className="edit-profile__input" type="number" placeholder="e.g. 25" value={formData.age} onChange={(e) => updateField('age', e.target.value)} />
            </div>
            <div className="edit-profile__group">
              <label className="edit-profile__label">Height (cm)</label>
              <input className="edit-profile__input" type="number" placeholder="e.g. 175" value={formData.height} onChange={(e) => updateField('height', e.target.value)} />
            </div>
            <div className="edit-profile__group edit-profile__group--full">
              <label className="edit-profile__label">Weight (kg)</label>
              <input className="edit-profile__input" type="number" placeholder="e.g. 70" value={formData.weight} onChange={(e) => updateField('weight', e.target.value)} />
            </div>
          </div>

          <h2 className="edit-profile__section-title">Fitness Level</h2>
          <div className="edit-profile__grid">
            <div className="edit-profile__group edit-profile__group--full">
              <label className="edit-profile__label">Experience Level</label>
              <select className="edit-profile__select" value={formData.fitness_level} onChange={(e) => updateField('fitness_level', e.target.value)}>
                <option value="">Select</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="edit-profile__group edit-profile__group--full">
              <label className="edit-profile__label">Activity Level</label>
              <select className="edit-profile__select" value={formData.activity_level} onChange={(e) => updateField('activity_level', e.target.value)}>
                <option value="">Select</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="edit-profile__group edit-profile__group--full">
              <label className="edit-profile__label">Training Days per Week</label>
              <select className="edit-profile__select" value={formData.training_days_per_week} onChange={(e) => updateField('training_days_per_week', e.target.value)}>
                <option value="">Select</option>
                <option value="2">2 days</option>
                <option value="3">3 days</option>
                <option value="4">4 days</option>
                <option value="5">5 days</option>
                <option value="6">6 days</option>
              </select>
            </div>
          </div>

          <h2 className="edit-profile__section-title">Goal</h2>
          <div className="edit-profile__grid">
            <div className="edit-profile__group edit-profile__group--full">
              <label className="edit-profile__label">Fitness Goal</label>
              <select className="edit-profile__select" value={formData.goal} onChange={(e) => updateField('goal', e.target.value)}>
                <option value="">Select</option>
                <option value="Build Muscle">Build Muscle</option>
                <option value="Get Stronger">Get Stronger</option>
                <option value="General Fitness">General Fitness</option>
                <option value="Sports Performance">Sports Performance</option>
                <option value="Endurance">Endurance</option>
                <option value="Competition Prep">Competition Prep</option>
              </select>
            </div>
            {(formData.goal === 'Sports Performance' || formData.goal === 'Competition Prep') && (
              <div className="edit-profile__group edit-profile__group--full">
                <label className="edit-profile__label">Sport / Competition</label>
                <input className="edit-profile__input" type="text" placeholder="e.g. Basketball, Marathon" value={formData.sport} onChange={(e) => updateField('sport', e.target.value)} />
              </div>
            )}
          </div>

          <h2 className="edit-profile__section-title">Training</h2>
          <div className="edit-profile__grid">
            <div className="edit-profile__group edit-profile__group--full">
              <label className="edit-profile__label">Workout Duration</label>
              <select className="edit-profile__select" value={formData.workout_duration} onChange={(e) => updateField('workout_duration', e.target.value)}>
                <option value="">Select</option>
                <option value="30">Around 30 minutes</option>
                <option value="45">Around 45 minutes</option>
                <option value="60">Around 60 minutes</option>
                <option value="90">90+ minutes</option>
              </select>
            </div>
            <div className="edit-profile__group edit-profile__group--full">
              <label className="edit-profile__label">Training Location</label>
              <select className="edit-profile__select" value={formData.training_location} onChange={(e) => updateField('training_location', e.target.value)}>
                <option value="">Select</option>
                <option value="gym">Gym</option>
                <option value="home">Home</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="edit-profile__group edit-profile__group--full">
              <label className="edit-profile__label">Available Equipment</label>
              <select className="edit-profile__select" value={formData.equipment} onChange={(e) => updateField('equipment', e.target.value)}>
                <option value="">Select</option>
                <option value="bodyweight">Bodyweight only</option>
                <option value="minimal">Minimal equipment</option>
                <option value="home">Home gym</option>
                <option value="full">Full gym</option>
              </select>
            </div>
          </div>

          <h2 className="edit-profile__section-title">Preferences</h2>
          <div className="edit-profile__grid">
            <div className="edit-profile__group edit-profile__group--full">
              <label className="edit-profile__label">Dietary Preference</label>
              <select className="edit-profile__select" value={formData.dietary_preference} onChange={(e) => updateField('dietary_preference', e.target.value)}>
                <option value="">Select</option>
                <option value="none">No restrictions</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="keto">Keto</option>
                <option value="paleo">Paleo</option>
              </select>
            </div>
            <div className="edit-profile__group edit-profile__group--full">
              <label className="edit-profile__label">Food Allergies / Intolerances</label>
              <input className="edit-profile__input" type="text" placeholder="e.g. Gluten, Lactose, Nuts" value={formData.allergies} onChange={(e) => updateField('allergies', e.target.value)} />
            </div>
            <div className="edit-profile__group edit-profile__group--full">
              <label className="edit-profile__label">Relevant Health Conditions</label>
              <input className="edit-profile__input" type="text" placeholder="e.g. Knee injury, Back pain" value={formData.health_conditions} onChange={(e) => updateField('health_conditions', e.target.value)} />
            </div>
          </div>

          <div className="edit-profile__actions">
            <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
