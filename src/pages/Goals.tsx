import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import './Goals.css';

const MOTIVATION: Record<string, string> = {
  'Build Muscle': 'Small improvements every week lead to big results.',
  'Get Stronger': 'Strength is earned, not given. Keep pushing.',
  'General Fitness': 'A healthy body fuels a healthy mind.',
  'Sports Performance': 'Train with purpose, recover with discipline.',
  'Endurance': 'One step at a time. Distance is built on consistency.',
  'Competition Prep': 'Discipline now, glory later.',
};

function getGoalStatus(goal: string | null): string {
  if (!goal) return 'Not started';
  return 'Active';
}

export default function Goals() {
  const { profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    goal: profile?.goal || '',
    fitness_level: profile?.fitness_level || '',
    weight: profile?.weight != null ? String(profile.weight) : '',
    height: profile?.height != null ? String(profile.height) : '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = () => {
    setFormData({
      goal: profile?.goal || '',
      fitness_level: profile?.fitness_level || '',
      weight: profile?.weight != null ? String(profile.weight) : '',
      height: profile?.height != null ? String(profile.height) : '',
    });
    setError('');
    setSuccess('');
    setEditing(true);
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      setError('Authentication error. Please log in again.');
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase.from('profiles').upsert({
      id: authUser.id,
      goal: formData.goal || null,
      fitness_level: formData.fitness_level || null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      height: formData.height ? parseFloat(formData.height) : null,
      updated_at: new Date().toISOString(),
    });

    if (updateError) {
      setError('Failed to update goals. Please try again.');
      setSaving(false);
      return;
    }

    await refreshProfile();
    setSuccess('Goals updated successfully.');
    setEditing(false);
    setSaving(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    setSuccess('');
  };

  if (!profile) return null;

  const goal = profile.goal;
  const motivation = goal ? MOTIVATION[goal] || 'Stay consistent and trust the process.' : 'Set a goal to start your journey.';
  const status = getGoalStatus(goal);

  return (
    <div className="goals-page">
      <div className="goals-page__card">
        <div className="goals-page__header">
          <div className="goals-page__title-row">
            <h1 className="goals-page__title">My Goals</h1>
            {!editing && (
              <button className="goals-page__edit-btn" onClick={handleEdit}>
                Edit Goals
              </button>
            )}
          </div>
          <p className="goals-page__subtitle">Your fitness journey at a glance.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="goals-page__success">{success}</div>}

        {!editing ? (
          <div className="goals-page__content">
            <div className="goals-page__main-goal">
              <div className="goals-page__goal-icon">🎯</div>
              <div>
                <div className="goals-page__goal-label">Main Fitness Goal</div>
                <div className="goals-page__goal-value">{goal || 'Not set'}</div>
              </div>
              <span className={`goals-page__status goals-page__status--${status === 'Active' ? 'active' : 'inactive'}`}>
                {status}
              </span>
            </div>

            <div className="goals-page__info-grid">
              {profile.weight != null && (
                <div className="goals-page__info-item">
                  <div className="goals-page__info-label">Weight</div>
                  <div className="goals-page__info-value">{profile.weight} kg</div>
                </div>
              )}
              {profile.height != null && (
                <div className="goals-page__info-item">
                  <div className="goals-page__info-label">Height</div>
                  <div className="goals-page__info-value">{profile.height} cm</div>
                </div>
              )}
              {profile.fitness_level && (
                <div className="goals-page__info-item">
                  <div className="goals-page__info-label">Fitness Level</div>
                  <div className="goals-page__info-value">{profile.fitness_level.charAt(0).toUpperCase() + profile.fitness_level.slice(1)}</div>
                </div>
              )}
              {profile.activity_level && (
                <div className="goals-page__info-item">
                  <div className="goals-page__info-label">Activity Level</div>
                  <div className="goals-page__info-value">{profile.activity_level.charAt(0).toUpperCase() + profile.activity_level.slice(1)}</div>
                </div>
              )}
            </div>

            {profile.weight != null && goal && (goal === 'Build Muscle' || goal === 'Get Stronger') && (
              <div className="goals-page__journey">
                <div className="goals-page__journey-title">Journey</div>
                <div className="goals-page__journey-item">
                  <span className="goals-page__journey-label">Current Weight</span>
                  <span className="goals-page__journey-value">{profile.weight} kg</span>
                </div>
              </div>
            )}

            <div className="goals-page__motivation">
              <div className="goals-page__motivation-icon">💬</div>
              <p className="goals-page__motivation-text">{motivation}</p>
            </div>
          </div>
        ) : (
          <div className="goals-page__edit">
            <h2 className="goals-page__section-title">Edit Goals</h2>
            <div className="goals-page__form-grid">
              <div className="goals-page__form-group">
                <label className="goals-page__label">Fitness Goal</label>
                <select className="goals-page__select" value={formData.goal} onChange={(e) => updateField('goal', e.target.value)}>
                  <option value="">Select</option>
                  <option value="Build Muscle">Build Muscle</option>
                  <option value="Get Stronger">Get Stronger</option>
                  <option value="General Fitness">General Fitness</option>
                  <option value="Sports Performance">Sports Performance</option>
                  <option value="Endurance">Endurance</option>
                  <option value="Competition Prep">Competition Prep</option>
                </select>
              </div>
              <div className="goals-page__form-group">
                <label className="goals-page__label">Fitness Level</label>
                <select className="goals-page__select" value={formData.fitness_level} onChange={(e) => updateField('fitness_level', e.target.value)}>
                  <option value="">Select</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="goals-page__form-group">
                <label className="goals-page__label">Weight (kg)</label>
                <input className="goals-page__input" type="number" placeholder="e.g. 70" value={formData.weight} onChange={(e) => updateField('weight', e.target.value)} />
              </div>
              <div className="goals-page__form-group">
                <label className="goals-page__label">Height (cm)</label>
                <input className="goals-page__input" type="number" placeholder="e.g. 175" value={formData.height} onChange={(e) => updateField('height', e.target.value)} />
              </div>
            </div>
            <div className="goals-page__actions">
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
