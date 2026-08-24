import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getNutritionPreferences,
  saveNutritionPreferences,
  getActiveNutritionPlan,
  createNutritionPlan,
  regenerateNutritionPlan,
  updateDayMeals,
  getDayAlternatives,
} from '../lib/nutritionService';
import type { NutritionPreferences, NutritionPlanWithMeals, NutritionFood } from '../types/nutrition';
import type { GeneratedDayPlan } from '../lib/nutritionCalculator';
import { mealTypeLabels } from '../data/foodDatabase';
import Button from '../components/Button';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import MealScanner from '../components/MealScanner';
import { getScannedMealsForDate, aggregateScannedTotals } from '../lib/scannerService';
import type { ScannedMealWithFoods } from '../types/scannedMeal';
import './Nutrition.css';

const QUOTES = [
  '"Small choices every day create big changes over time."',
  '"Take care of your body. It\'s the only place you have to live."',
  '"Good nutrition is the foundation of a healthy lifestyle."',
  '"Feed your body the fuel it deserves."',
  '"Eat well, feel well, live well."',
];

const occupationOptions = [
  { value: 'student', label: 'Student', budgetHint: '₹120–₹180/day' },
  { value: 'working-professional', label: 'Working Professional', budgetHint: '₹180–₹280/day' },
  { value: 'self-employed', label: 'Self-employed', budgetHint: '₹150–₹250/day' },
  { value: 'athlete', label: 'Athlete', budgetHint: '₹250–₹400/day' },
  { value: 'other', label: 'Other', budgetHint: '₹150–₹250/day' },
];

const dietOptions = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'non-vegetarian', label: 'Non-vegetarian' },
  { value: 'eggitarian', label: 'Eggitarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'other', label: 'Other' },
];

const mealOptions = [
  { value: 3, label: '3 meals' },
  { value: 4, label: '4 meals' },
  { value: 5, label: '5 meals' },
];

function getSuggestedBudget(occupation: string, _diet: string): string {
  const occ = occupationOptions.find((o) => o.value === occupation);
  return occ?.budgetHint || '₹150–₹250/day';
}

function getTodayName(): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
}

function DaySelector({
  days,
  selectedDay,
  onSelectDay,
}: {
  days: GeneratedDayPlan[];
  selectedDay: string;
  onSelectDay: (day: string) => void;
}) {
  const today = getTodayName();
  return (
    <div className="nutrition__day-selector">
      {days.map((d) => (
        <button
          key={d.dayOfWeek}
          className={`nutrition__day-btn ${selectedDay === d.dayOfWeek ? 'nutrition__day-btn--active' : ''} ${d.dayOfWeek === today ? 'nutrition__day-btn--today' : ''}`}
          onClick={() => onSelectDay(d.dayOfWeek)}
        >
          {d.dayOfWeek.slice(0, 3)}
          {d.dayOfWeek === today && <span className="nutrition__day-today-dot" />}
        </button>
      ))}
    </div>
  );
}

function MacroBar({ label, value, unit, target }: { label: string; value: number; unit: string; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const color = pct >= 90 ? 'var(--color-success)' : pct >= 70 ? 'var(--color-warning)' : 'var(--color-primary)';
  const gap = target - value;
  const gapMsg = pct < 90 && gap > 0 ? `Gap: -${gap}${unit}` : '';
  return (
    <div className="nutrition__macro">
      <div className="nutrition__macro-header">
        <span className="nutrition__macro-label">{label}</span>
        <span className="nutrition__macro-value">
          {value}{unit} <span className="nutrition__macro-target">/ {target}{unit}</span>
          {gapMsg && <span className="nutrition__macro-gap">{gapMsg}</span>}
        </span>
      </div>
      <div className="nutrition__macro-bar">
        <div className="nutrition__macro-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function FoodItem({ food }: { food: { food_name?: string; name?: string; quantity?: string; servingSize?: string; calories: number; protein: number; carbs: number; fat: number; fiber: number } }) {
  const name = food.food_name || food.name || 'Food';
  const qty = food.quantity || food.servingSize || '';
  return (
    <div className="nutrition__food">
      <div className="nutrition__food-info">
        <span className="nutrition__food-name">{name}</span>
        <span className="nutrition__food-qty">{qty}</span>
      </div>
      <div className="nutrition__food-macros">
        <span>{food.calories} kcal</span>
        <span>{food.protein}g P</span>
        <span>{food.carbs}g C</span>
        <span>{food.fat}g F</span>
      </div>
    </div>
  );
}

function DayPlanView({ day, targets, budget, onChangePlan }: { day: GeneratedDayPlan; targets: { calories: number; protein: number; carbs: number; fat: number; fiber: number }; budget: number; onChangePlan?: (dayOfWeek: string) => void }) {
  return (
    <div className="nutrition__day-plan">
      <div className="nutrition__day-plan-header">
        <div className="nutrition__day-summary">
          <MacroBar label="Calories" value={day.totals.calories} unit=" kcal" target={targets.calories} />
          <MacroBar label="Protein" value={day.totals.protein} unit="g" target={targets.protein} />
          <MacroBar label="Carbs" value={day.totals.carbs} unit="g" target={targets.carbs} />
          <MacroBar label="Fat" value={day.totals.fat} unit="g" target={targets.fat} />
          <MacroBar label="Fiber" value={day.totals.fiber} unit="g" target={targets.fiber} />
        </div>

      <div className="nutrition__budget-bar">
        <span className="nutrition__budget-label">Estimated cost: {'\u20B9'}{day.cost}</span>
        <span className="nutrition__budget-label">Daily budget: {'\u20B9'}{budget}</span>
        <span className="nutrition__budget-label" style={{ color: day.cost <= budget ? 'var(--color-success)' : 'var(--color-error)' }}>
          Remaining: {'\u20B9'}{Math.max(0, budget - day.cost)}
        </span>
      </div>
      </div>

      <div className="nutrition__meals">
        {day.meals.map((meal, idx) => (
          <div key={idx} className="nutrition__meal-card">
            <h4 className="nutrition__meal-title">{mealTypeLabels[meal.type] || meal.label}</h4>
            {meal.foods.length === 0 ? (
              <p className="nutrition__meal-empty">No foods planned</p>
            ) : (
              <div className="nutrition__food-list">
                {meal.foods.map((food, fIdx) => (
                  <FoodItem key={fIdx} food={food} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {onChangePlan && (
        <button className="nutrition__change-day-btn" onClick={() => onChangePlan(day.dayOfWeek)}>
          Change My Plan
        </button>
      )}
    </div>
  );
}

export default function Nutrition() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<NutritionPreferences | null>(null);
  const [plan, setPlan] = useState<NutritionPlanWithMeals | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(getTodayName());
  const [budgetWarning, setBudgetWarning] = useState(false);
  const [showEditPrefs, setShowEditPrefs] = useState(false);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [alternatives, setAlternatives] = useState<GeneratedDayPlan[]>([]);
  const [changingDay, setChangingDay] = useState('');
  const [savingAlt, setSavingAlt] = useState(false);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedMeals, setScannedMeals] = useState<ScannedMealWithFoods[]>([]);

  const [formData, setFormData] = useState({
    occupation: '',
    diet: profile?.dietary_preference || '',
    daily_budget_inr: '',
    allergies: profile?.allergies || '',
    foods_to_avoid: '',
    meals_per_day: 4,
  });

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const loadPlan = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const existingPrefs = await getNutritionPreferences(user.id);
    setPrefs(existingPrefs);

    if (!existingPrefs || !existingPrefs.completed) {
      setShowOnboarding(true);
      setLoading(false);
      return;
    }

    const result = await getActiveNutritionPlan(user.id);
    if (result.error === 'DATABASE_MISSING') {
      setError('Nutrition tables not created yet. Please run the SQL migration in Supabase.');
      setLoading(false);
      return;
    }

    if (result.plan && result.plan.meals && result.plan.meals.length > 0) {
      setPlan(result.plan);
      setBudgetWarning(result.isBudgetTight);
    } else {
      // Plan exists but no meals - regenerate
      if (profile) {
        const recreateResult = await regenerateNutritionPlan(
          { id: user.id, age: profile.age, height: profile.height, weight: profile.weight, goal: profile.goal, fitness_level: profile.fitness_level, activity_level: profile.activity_level, training_days_per_week: profile.training_days_per_week },
          existingPrefs,
        );
        if (recreateResult.plan) {
          setPlan(recreateResult.plan);
          setBudgetWarning(recreateResult.isBudgetTight);
        }
      }
    }

    // Load scanned meals for today
    const todayDate = new Date().toISOString().split('T')[0];
    const { meals: todayScanned } = await getScannedMealsForDate(user.id, todayDate);
    setScannedMeals(todayScanned);

    setLoading(false);
  }, [user, profile]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const getSaveErrorMsg = (err: string | null): string => {
    if (!err) return 'Failed to save your preferences. Please try again.';
    if (err === 'DATABASE_MISSING') {
      return 'Nutrition tables not created yet. Please run this SQL in your Supabase Dashboard → SQL Editor:\n\n' +
        'Copy the contents of supabase/migrations/004_nutrition_tables.sql and execute it.';
    }
    if (err === 'RLS_BLOCKED') {
      return 'Permission denied. Row Level Security is blocking the save. Please ensure RLS policies are set up for nutrition tables.';
    }
    return `Failed to save: ${err}`;
  };

  const reloadScannedMeals = useCallback(async () => {
    if (!user) return;
    const todayDate = new Date().toISOString().split('T')[0];
    const { meals } = await getScannedMealsForDate(user.id, todayDate);
    setScannedMeals(meals);
  }, [user]);

  const handleOnboardingSubmit = async () => {
    if (!user || !profile) return;
    setError('');
    setCreating(true);

    const prefsData = {
      occupation: formData.occupation,
      diet: formData.diet,
      daily_budget_inr: parseFloat(formData.daily_budget_inr) || 200,
      allergies: formData.allergies,
      foods_to_avoid: formData.foods_to_avoid,
      meals_per_day: formData.meals_per_day,
    };

    const { data: savedPrefs, error: saveError } = await saveNutritionPreferences(user.id, prefsData);
    if (!savedPrefs) {
      setError(getSaveErrorMsg(saveError));
      setCreating(false);
      return;
    }

    setPrefs(savedPrefs);

    const result = await createNutritionPlan(
      { id: user.id, age: profile.age, height: profile.height, weight: profile.weight, goal: profile.goal, fitness_level: profile.fitness_level, activity_level: profile.activity_level, training_days_per_week: profile.training_days_per_week },
      prefsData,
    );

    setCreating(false);

    if (result.error) {
      if (result.error === 'DATABASE_MISSING') {
        setError('Nutrition tables not created yet. Please run the SQL migration in Supabase.');
      } else {
        setError('We couldn\'t create your nutrition plan right now. Please try again.');
      }
      return;
    }

    if (result.plan) {
      setPlan(result.plan);
      setBudgetWarning(result.isBudgetTight);
      setShowOnboarding(false);
    }
  };

  const handleEditPrefs = async () => {
    if (!user || !profile) return;
    setError('');
    setCreating(true);

    const prefsData = {
      occupation: formData.occupation,
      diet: formData.diet,
      daily_budget_inr: parseFloat(formData.daily_budget_inr) || 200,
      allergies: formData.allergies,
      foods_to_avoid: formData.foods_to_avoid,
      meals_per_day: formData.meals_per_day,
    };

    const { data: savedPrefs, error: saveError } = await saveNutritionPreferences(user.id, prefsData);
    if (!savedPrefs) {
      setError(getSaveErrorMsg(saveError));
      setCreating(false);
      return;
    }
    setPrefs(savedPrefs);

    const result = await regenerateNutritionPlan(
      { id: user.id, age: profile.age, height: profile.height, weight: profile.weight, goal: profile.goal, fitness_level: profile.fitness_level, activity_level: profile.activity_level, training_days_per_week: profile.training_days_per_week },
      prefsData,
    );

    setCreating(false);
    setShowEditPrefs(false);

    if (result.plan) {
      setPlan(result.plan);
      setBudgetWarning(result.isBudgetTight);
    }
  };

  const handleNewPlan = async () => {
    if (!user || !profile || !prefs) return;
    setCreating(true);
    setError('');

    const prefsData = {
      occupation: prefs.occupation,
      diet: prefs.diet,
      daily_budget_inr: prefs.daily_budget_inr,
      allergies: prefs.allergies,
      foods_to_avoid: prefs.foods_to_avoid,
      meals_per_day: prefs.meals_per_day,
    };

    const result = await regenerateNutritionPlan(
      { id: user.id, age: profile.age, height: profile.height, weight: profile.weight, goal: profile.goal, fitness_level: profile.fitness_level, activity_level: profile.activity_level, training_days_per_week: profile.training_days_per_week },
      prefsData,
    );

    setCreating(false);
    if (result.plan) {
      setPlan(result.plan);
      setBudgetWarning(result.isBudgetTight);
    }
  };

  const handleChangeDayPlan = (dayOfWeek: string) => {
    if (!prefs) return;
    setChangingDay(dayOfWeek);
    const alts = getDayAlternatives(targets, {
      occupation: prefs.occupation,
      diet: prefs.diet,
      daily_budget_inr: prefs.daily_budget_inr,
      allergies: prefs.allergies,
      foods_to_avoid: prefs.foods_to_avoid,
      meals_per_day: prefs.meals_per_day,
    }, dayOfWeek);
    setAlternatives(alts);
    setShowChangePlan(true);
  };

  const handleUseAlternative = async (alt: GeneratedDayPlan) => {
    if (!plan) return;
    setSavingAlt(true);
    const result = await updateDayMeals(plan.id, changingDay, alt);
    setSavingAlt(false);

    if (result.success) {
      // Reload plan from database
      const refreshed = await getActiveNutritionPlan(plan.user_id);
      if (refreshed.plan) {
        setPlan(refreshed.plan);
      }
    } else {
      setError(result.error || 'Failed to update day plan.');
    }
    setShowChangePlan(false);
    setAlternatives([]);
    setChangingDay('');
  };

  // Build weekly plan from saved data for display
  const buildWeeklyFromPlan = useCallback((): GeneratedDayPlan[] | null => {
    if (!plan || !plan.meals || plan.meals.length === 0) return null;

    const days: GeneratedDayPlan[] = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const todayName = getTodayName();

    for (const dayName of dayNames) {
      const dayMeals = plan.meals.filter((pm) => pm.day_of_week === dayName);
      if (dayMeals.length === 0) continue;

      // Group foods by meal_type across all meals for this day
      const mealTypeMap = new Map<string, NutritionFood[]>();
      for (const pm of dayMeals) {
        for (const food of pm.foods) {
          const type = food.meal_type || 'meal';
          if (!mealTypeMap.has(type)) mealTypeMap.set(type, []);
          mealTypeMap.get(type)!.push(food);
        }
      }

      // Add scanned meals as a separate "Scanned" group for today
      if (dayName === todayName && scannedMeals.length > 0) {
        const scannedFoodsFlat = scannedMeals.flatMap((sm) =>
          sm.foods.map((f) => ({
            id: f.id,
            nutrition_meal_id: sm.id,
            food_name: f.food_name,
            quantity: `${f.quantity_grams}g`,
            calories: f.calories,
            protein: f.protein,
            carbs: f.carbs,
            fat: f.fat,
            fiber: f.fiber,
            meal_type: 'scanned',
            order_index: f.order_index,
          })),
        );
        mealTypeMap.set('scanned', scannedFoodsFlat as unknown as NutritionFood[]);
      }

      const groupedMeals = Array.from(mealTypeMap.entries()).map(([mealType, foods]) => ({
        type: mealType,
        label: mealType === 'scanned' ? 'Scanned Meals' : (mealTypeLabels[mealType] || mealType),
        foods: foods as unknown as import('../types/nutrition').FoodItem[],
      }));

      const allFoods = dayMeals.flatMap((pm) => pm.foods);
      const planTotals = {
        calories: Math.round(allFoods.reduce((s, f) => s + f.calories, 0)),
        protein: Math.round(allFoods.reduce((s, f) => s + f.protein, 0)),
        carbs: Math.round(allFoods.reduce((s, f) => s + f.carbs, 0)),
        fat: Math.round(allFoods.reduce((s, f) => s + f.fat, 0)),
        fiber: Math.round(allFoods.reduce((s, f) => s + f.fiber, 0)),
      };

      // Add scanned meal totals for today
      let totals = planTotals;
      if (dayName === todayName && scannedMeals.length > 0) {
        const scannedTotals = aggregateScannedTotals(scannedMeals);
        totals = {
          calories: planTotals.calories + scannedTotals.calories,
          protein: Math.round((planTotals.protein + scannedTotals.protein) * 10) / 10,
          carbs: Math.round((planTotals.carbs + scannedTotals.carbs) * 10) / 10,
          fat: Math.round((planTotals.fat + scannedTotals.fat) * 10) / 10,
          fiber: Math.round((planTotals.fiber + scannedTotals.fiber) * 10) / 10,
        };
      }

      days.push({
        dayOfWeek: dayName,
        meals: groupedMeals,
        totals,
        cost: Math.round(plan.estimated_cost_inr || 0),
      });
    }

    return days.length > 0 ? days : null;
  }, [plan, scannedMeals]);

  const weeklyDays = buildWeeklyFromPlan();
  const selectedDayData = weeklyDays?.find((d) => d.dayOfWeek === selectedDay);
  const targets = plan
    ? { calories: plan.target_calories, protein: plan.target_protein, carbs: plan.target_carbs, fat: plan.target_fat, fiber: plan.target_fiber }
    : { calories: 2000, protein: 100, carbs: 250, fat: 65, fiber: 30 };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <DashboardSidebar />
        <div className="dashboard-layout__main">
          <DashboardHeader />
          <div className="dashboard-layout__content">
            <div className="nutrition__loading">
              <div className="nutrition__spinner" />
              <p>Loading your nutrition plan...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="dashboard-layout">
        <DashboardSidebar />
        <div className="dashboard-layout__main">
          <DashboardHeader />
          <div className="dashboard-layout__content">
            <div className="nutrition__onboarding">
              <div className="nutrition__quote">{quote}</div>

              {creating ? (
                <div className="nutrition__creating">
                  <div className="nutrition__spinner" />
                  <p className="nutrition__creating-text">Building your personalized nutrition plan...</p>
                </div>
              ) : (
                <>
                  {error && <div className="nutrition__error">{error}</div>}

                  {onboardingStep === 0 && (
                    <div className="nutrition__onboard-step">
                      <h2 className="nutrition__onboard-title">Nutrition Setup</h2>
                      <p className="nutrition__onboard-sub">Tell us a bit about yourself so we can create the right plan for you.</p>

                      <div className="nutrition__field">
                        <label className="nutrition__label">What's your occupation?</label>
                        <div className="nutrition__options">
                          {occupationOptions.map((opt) => (
                            <button
                              key={opt.value}
                              className={`nutrition__option ${formData.occupation === opt.value ? 'nutrition__option--selected' : ''}`}
                              onClick={() => updateField('occupation', opt.value)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="nutrition__field">
                        <label className="nutrition__label">What's your diet?</label>
                        <div className="nutrition__options">
                          {dietOptions.map((opt) => (
                            <button
                              key={opt.value}
                              className={`nutrition__option ${formData.diet === opt.value ? 'nutrition__option--selected' : ''}`}
                              onClick={() => updateField('diet', opt.value)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="nutrition__field">
                        <label className="nutrition__label">Daily food budget (INR)</label>
                        <p className="nutrition__hint">
                          Suggested starting budget: {getSuggestedBudget(formData.occupation, formData.diet)}
                        </p>
                        <div className="nutrition__budget-input-wrap">
                          <span className="nutrition__rupee">₹</span>
                          <input
                            className="nutrition__input"
                            type="number"
                            placeholder="e.g. 200"
                            value={formData.daily_budget_inr}
                            onChange={(e) => updateField('daily_budget_inr', e.target.value)}
                          />
                          <span className="nutrition__budget-suffix">/day</span>
                        </div>
                      </div>

                      <div className="nutrition__onboard-actions">
                        <Button onClick={() => navigate('/dashboard')} variant="secondary">Back to Dashboard</Button>
                        <Button
                          onClick={() => setOnboardingStep(1)}
                          disabled={!formData.occupation || !formData.diet}
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  )}

                  {onboardingStep === 1 && (
                    <div className="nutrition__onboard-step">
                      <h2 className="nutrition__onboard-title">Food Preferences</h2>
                      <p className="nutrition__onboard-sub">Help us avoid foods that don't work for you.</p>

                      <div className="nutrition__field">
                        <label className="nutrition__label">Food allergies or intolerances</label>
                        <input
                          className="nutrition__input"
                          type="text"
                          placeholder="e.g. Peanuts, Gluten, Lactose (or leave empty)"
                          value={formData.allergies}
                          onChange={(e) => updateField('allergies', e.target.value)}
                        />
                      </div>

                      <div className="nutrition__field">
                        <label className="nutrition__label">Foods you don't eat or dislike</label>
                        <input
                          className="nutrition__input"
                          type="text"
                          placeholder="e.g. Bitter gourd, Liver (or leave empty)"
                          value={formData.foods_to_avoid}
                          onChange={(e) => updateField('foods_to_avoid', e.target.value)}
                        />
                      </div>

                      <div className="nutrition__field">
                        <label className="nutrition__label">How many meals per day?</label>
                        <div className="nutrition__options nutrition__options--row">
                          {mealOptions.map((opt) => (
                            <button
                              key={opt.value}
                              className={`nutrition__option ${formData.meals_per_day === opt.value ? 'nutrition__option--selected' : ''}`}
                              onClick={() => updateField('meals_per_day', opt.value)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="nutrition__onboard-actions">
                        <Button onClick={() => setOnboardingStep(0)} variant="secondary">Back</Button>
                        <Button onClick={handleOnboardingSubmit}>
                          Create My Plan
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <div className="dashboard-layout__main">
        <DashboardHeader />
        <div className="dashboard-layout__content">
          <div className="nutrition__header">
            <div>
              <h2 className="nutrition__page-title">Today's Nutrition</h2>
              <p className="nutrition__page-sub">Your personalized daily diet plan</p>
            </div>
            <div className="nutrition__header-actions">
              <button className="nutrition__scan-btn" onClick={() => setShowScanner((prev) => !prev)}>
                {showScanner ? 'Close Scanner' : '📷 Scan My Meal'}
              </button>
              <button className="nutrition__edit-btn" onClick={() => {
                setFormData({
                  occupation: prefs?.occupation || '',
                  diet: prefs?.diet || '',
                  daily_budget_inr: String(prefs?.daily_budget_inr || 200),
                  allergies: prefs?.allergies || '',
                  foods_to_avoid: prefs?.foods_to_avoid || '',
                  meals_per_day: prefs?.meals_per_day || 4,
                });
                setShowEditPrefs(true);
              }}>
                Edit Preferences
              </button>
              <button className="nutrition__regen-btn" onClick={handleNewPlan} disabled={creating}>
                {creating ? 'Regenerating...' : 'New Plan'}
              </button>
            </div>
          </div>

          {creating && (
            <div className="nutrition__creating">
              <div className="nutrition__spinner" />
              <p className="nutrition__creating-text">Building your personalized nutrition plan...</p>
            </div>
          )}

          {error && <div className="nutrition__error">{error}</div>}

          {budgetWarning && (
            <div className="nutrition__budget-warning">
              <strong>Your budget is tight.</strong> Your current budget makes the full nutrition target difficult to reach.
              We've optimized the plan for the best nutritional value possible within your budget, prioritizing protein-rich foods.
              To improve your results, consider increasing your daily budget or reducing your meal count.
            </div>
          )}

          {showScanner && user && (
            <div className="nutrition__scanner-wrap">
              <MealScanner userId={user.id} onSaved={reloadScannedMeals} />
            </div>
          )}

          {weeklyDays && selectedDayData && !creating && (
            <>
              <DaySelector days={weeklyDays} selectedDay={selectedDay} onSelectDay={setSelectedDay} />

              {selectedDay === getTodayName() && (
                <div className="nutrition__today-badge">Today's Plan</div>
              )}

              <DayPlanView day={selectedDayData} targets={targets} budget={prefs?.daily_budget_inr || 200} onChangePlan={handleChangeDayPlan} />

              <div className="nutrition__micronutrients">
                <span className="nutrition__micro-label">Key micronutrients:</span>
                <span className="nutrition__micro-status">Well covered through varied food selection</span>
              </div>
            </>
          )}

          {!weeklyDays && !creating && !error && (
            <div className="nutrition__empty">
              <p>No nutrition plan found. Set up your preferences to get started.</p>
              <Button onClick={() => setShowOnboarding(true)}>Set Up Nutrition</Button>
            </div>
          )}

          {showEditPrefs && (
            <div className="nutrition__modal-overlay" onClick={() => setShowEditPrefs(false)}>
              <div className="nutrition__modal" onClick={(e) => e.stopPropagation()}>
                <h3 className="nutrition__modal-title">Edit Nutrition Preferences</h3>

                {creating && (
                  <div className="nutrition__creating">
                    <div className="nutrition__spinner" />
                    <p className="nutrition__creating-text">Updating your plan...</p>
                  </div>
                )}

                {!creating && (
                  <>
                    <div className="nutrition__field">
                      <label className="nutrition__label">Occupation</label>
                      <div className="nutrition__options">
                        {occupationOptions.map((opt) => (
                          <button
                            key={opt.value}
                            className={`nutrition__option ${formData.occupation === opt.value ? 'nutrition__option--selected' : ''}`}
                            onClick={() => updateField('occupation', opt.value)}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="nutrition__field">
                      <label className="nutrition__label">Diet</label>
                      <div className="nutrition__options">
                        {dietOptions.map((opt) => (
                          <button
                            key={opt.value}
                            className={`nutrition__option ${formData.diet === opt.value ? 'nutrition__option--selected' : ''}`}
                            onClick={() => updateField('diet', opt.value)}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="nutrition__field">
                      <label className="nutrition__label">Daily budget (INR)</label>
                      <div className="nutrition__budget-input-wrap">
                        <span className="nutrition__rupee">₹</span>
                        <input
                          className="nutrition__input"
                          type="number"
                          value={formData.daily_budget_inr}
                          onChange={(e) => updateField('daily_budget_inr', e.target.value)}
                        />
                        <span className="nutrition__budget-suffix">/day</span>
                      </div>
                    </div>

                    <div className="nutrition__field">
                      <label className="nutrition__label">Allergies</label>
                      <input
                        className="nutrition__input"
                        type="text"
                        value={formData.allergies}
                        onChange={(e) => updateField('allergies', e.target.value)}
                      />
                    </div>

                    <div className="nutrition__field">
                      <label className="nutrition__label">Foods to avoid</label>
                      <input
                        className="nutrition__input"
                        type="text"
                        value={formData.foods_to_avoid}
                        onChange={(e) => updateField('foods_to_avoid', e.target.value)}
                      />
                    </div>

                    <div className="nutrition__field">
                      <label className="nutrition__label">Meals per day</label>
                      <div className="nutrition__options nutrition__options--row">
                        {mealOptions.map((opt) => (
                          <button
                            key={opt.value}
                            className={`nutrition__option ${formData.meals_per_day === opt.value ? 'nutrition__option--selected' : ''}`}
                            onClick={() => updateField('meals_per_day', opt.value)}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="nutrition__modal-actions">
                      <Button variant="secondary" onClick={() => setShowEditPrefs(false)}>Cancel</Button>
                      <Button onClick={handleEditPrefs}>Save & Regenerate</Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {showChangePlan && (
            <div className="nutrition__modal-overlay" onClick={() => { setShowChangePlan(false); setAlternatives([]); setChangingDay(''); }}>
              <div className="nutrition__modal nutrition__modal--wide" onClick={(e) => e.stopPropagation()}>
                <h3 className="nutrition__modal-title">Change Plan for {changingDay}</h3>
                <p className="nutrition__onboard-sub">Choose a different meal plan for this day. Only this day will change.</p>

                {savingAlt && (
                  <div className="nutrition__creating">
                    <div className="nutrition__spinner" />
                    <p className="nutrition__creating-text">Saving your new plan...</p>
                  </div>
                )}

                {!savingAlt && (
                  <div className="nutrition__alternatives">
                    {alternatives.map((alt, idx) => (
                      <div key={idx} className="nutrition__alt-card">
                        <div className="nutrition__alt-header">
                          <h4 className="nutrition__alt-title">Option {idx + 1}</h4>
                          <div className="nutrition__alt-stats">
                            <span>{alt.totals.calories} kcal</span>
                            <span>{alt.totals.protein}g protein</span>
                            <span>{'\u20B9'}{alt.cost}</span>
                          </div>
                        </div>

                        <div className="nutrition__alt-meals">
                          {alt.meals.map((meal, mIdx) => (
                            <div key={mIdx} className="nutrition__alt-meal">
                              <span className="nutrition__alt-meal-type">{mealTypeLabels[meal.type] || meal.label}:</span>
                              <span className="nutrition__alt-meal-foods">
                                {meal.foods.map((f) => f.name).join(' + ')}
                              </span>
                            </div>
                          ))}
                        </div>

                        <button className="nutrition__alt-use-btn" onClick={() => handleUseAlternative(alt)}>
                          Use This Plan
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="nutrition__modal-actions" style={{ marginTop: '16px' }}>
                  <Button variant="secondary" onClick={() => { setShowChangePlan(false); setAlternatives([]); setChangingDay(''); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
