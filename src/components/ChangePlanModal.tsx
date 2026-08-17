import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import './WorkoutComponents.css';

interface ChangePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated: () => void;
  currentProfile: {
    goal: string | null;
    fitness_level: string | null;
    training_days_per_week: number | null;
    workout_duration: string | null;
    training_location: string | null;
    equipment: string | null;
  };
}

export default function ChangePlanModal({
  isOpen,
  onClose,
  onPlanCreated,
  currentProfile,
}: ChangePlanModalProps) {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [goal, setGoal] = useState(currentProfile.goal || '');
  const [fitnessLevel, setFitnessLevel] = useState(currentProfile.fitness_level || '');
  const [trainingDays, setTrainingDays] = useState(String(currentProfile.training_days_per_week || 3));
  const [duration, setDuration] = useState(currentProfile.workout_duration || '60');
  const [location, setLocation] = useState(currentProfile.training_location || 'gym');
  const [equipment, setEquipment] = useState(currentProfile.equipment || 'full');

  useEffect(() => {
    if (isOpen) {
      setGoal(currentProfile.goal || '');
      setFitnessLevel(currentProfile.fitness_level || '');
      setTrainingDays(String(currentProfile.training_days_per_week || 3));
      setDuration(currentProfile.workout_duration || '60');
      setLocation(currentProfile.training_location || 'gym');
      setEquipment(currentProfile.equipment || 'full');
      setError('');
    }
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!user) return;
    setError('');
    setLoading(true);

    // Update profile in Supabase first
    const { error: updateError } = await supabase.from('profiles').upsert({
      id: user.id,
      goal,
      fitness_level: fitnessLevel,
      training_days_per_week: parseInt(trainingDays),
      workout_duration: duration,
      training_location: location,
      equipment,
      updated_at: new Date().toISOString(),
    });

    if (updateError) {
      setError('Failed to update profile. Please try again.');
      setLoading(false);
      return;
    }

    await refreshProfile();

    // Deactivate old plan
    const { data: oldPlans } = await supabase
      .from('workout_plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('active', true);

    if (oldPlans) {
      for (const p of oldPlans) {
        await supabase
          .from('workout_plans')
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq('id', p.id);
      }
    }

    setLoading(false);
    onPlanCreated();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal__title">Change Workout Plan</h2>
        <p className="modal__subtitle">
          Adjust your training preferences. A new personalized plan will be generated.
        </p>

        {error && <div className="auth-error">{error}</div>}

        <div className="modal__field">
          <label className="modal__label">Fitness Goal</label>
          <select className="modal__select" value={goal} onChange={(e) => setGoal(e.target.value)}>
            <option value="Build Muscle">Build Muscle</option>
            <option value="Get Stronger">Get Stronger</option>
            <option value="General Fitness">General Fitness</option>
            <option value="Sports Performance">Sports Performance</option>
            <option value="Endurance">Endurance</option>
            <option value="Competition Prep">Competition Prep</option>
          </select>
        </div>

        <div className="modal__field">
          <label className="modal__label">Experience Level</label>
          <select className="modal__select" value={fitnessLevel} onChange={(e) => setFitnessLevel(e.target.value)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="modal__field">
          <label className="modal__label">Training Days per Week</label>
          <select className="modal__select" value={trainingDays} onChange={(e) => setTrainingDays(e.target.value)}>
            <option value="2">2 days</option>
            <option value="3">3 days</option>
            <option value="4">4 days</option>
            <option value="5">5 days</option>
            <option value="6">6 days</option>
          </select>
        </div>

        <div className="modal__field">
          <label className="modal__label">Workout Duration</label>
          <select className="modal__select" value={duration} onChange={(e) => setDuration(e.target.value)}>
            <option value="30">Around 30 minutes</option>
            <option value="45">Around 45 minutes</option>
            <option value="60">Around 60 minutes</option>
            <option value="90">90+ minutes</option>
          </select>
        </div>

        <div className="modal__field">
          <label className="modal__label">Training Location</label>
          <select className="modal__select" value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="gym">Gym</option>
            <option value="home">Home</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div className="modal__field">
          <label className="modal__label">Available Equipment</label>
          <select className="modal__select" value={equipment} onChange={(e) => setEquipment(e.target.value)}>
            <option value="bodyweight">Bodyweight only</option>
            <option value="minimal">Minimal equipment</option>
            <option value="home">Home gym</option>
            <option value="full">Full gym</option>
          </select>
        </div>

        <div className="modal__actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create New Plan'}
          </Button>
        </div>
      </div>
    </div>
  );
}
