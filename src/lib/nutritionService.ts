import { supabase } from './supabase';
import { generateWeeklyPlan, generateDayAlternatives, calculateNutritionTargets, getDayIndex } from './nutritionCalculator';
import type {
  NutritionPreferences,
  NutritionPlanWithMeals,
  NutritionMealWithFoods,
} from '../types/nutrition';
import type { GeneratedDayPlan } from './nutritionCalculator';

interface ProfileData {
  id: string;
  age: number | null;
  height: number | null;
  weight: number | null;
  goal: string | null;
  fitness_level: string | null;
  activity_level: string | null;
  training_days_per_week: number | null;
}

interface NutrientPrefs {
  occupation: string;
  diet: string;
  daily_budget_inr: number;
  allergies: string;
  foods_to_avoid: string;
  meals_per_day: number;
}

interface NutritionResult {
  plan: NutritionPlanWithMeals | null;
  error: string | null;
  isBudgetTight: boolean;
}

export async function getNutritionPreferences(userId: string): Promise<NutritionPreferences | null> {
  const { data, error } = await supabase
    .from('nutrition_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[NUTRITION] Error fetching preferences:', error.message, error.code);
    return null;
  }
  return data as NutritionPreferences | null;
}

export async function saveNutritionPreferences(
  userId: string,
  prefs: NutrientPrefs,
): Promise<{ data: NutritionPreferences | null; error: string | null }> {
  const { data, error } = await supabase
    .from('nutrition_preferences')
    .upsert({
      user_id: userId,
      occupation: prefs.occupation,
      diet: prefs.diet,
      daily_budget_inr: prefs.daily_budget_inr,
      allergies: prefs.allergies,
      foods_to_avoid: prefs.foods_to_avoid,
      meals_per_day: prefs.meals_per_day,
      completed: true,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[NUTRITION] Error saving preferences:', error.message, error.code, error.details, error.hint);
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return { data: null, error: 'DATABASE_MISSING' };
    }
    if (error.code === '42501') {
      return { data: null, error: 'RLS_BLOCKED' };
    }
    return { data: null, error: error.message };
  }
  return { data: data as NutritionPreferences, error: null };
}

export async function getActiveNutritionPlan(userId: string): Promise<NutritionResult> {
  const { data: plan, error: planError } = await supabase
    .from('nutrition_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planError) {
    console.error('[NUTRITION] Error fetching plan:', planError.message, planError.code);
    if (planError.code === '42P01' || planError.message?.includes('does not exist')) {
      return { plan: null, error: 'DATABASE_MISSING', isBudgetTight: false };
    }
    return { plan: null, error: null, isBudgetTight: false };
  }

  if (!plan) return { plan: null, error: null, isBudgetTight: false };

  const { data: meals, error: mealsError } = await supabase
    .from('nutrition_meals')
    .select('*')
    .eq('nutrition_plan_id', plan.id)
    .order('day_date');

  if (mealsError || !meals) {
    console.error('[NUTRITION] Error fetching meals:', mealsError?.message, mealsError?.code);
    return { plan: { ...plan, meals: [] }, error: null, isBudgetTight: false };
  }

  if (meals.length === 0) {
    return { plan: { ...plan, meals: [] }, error: null, isBudgetTight: false };
  }

  const mealIds = meals.map((m) => m.id);

  const { data: foods, error: foodsError } = await supabase
    .from('nutrition_foods')
    .select('*')
    .in('nutrition_meal_id', mealIds)
    .order('order_index');

  if (foodsError) {
    console.error('[NUTRITION] Error fetching foods:', foodsError.message, foodsError.code);
    return {
      plan: { ...plan, meals: meals.map((m) => ({ ...m, foods: [] })) },
      error: null,
      isBudgetTight: false,
    };
  }

  const foodsByMeal = new Map<string, typeof foods>();
  for (const f of foods || []) {
    const list = foodsByMeal.get(f.nutrition_meal_id) || [];
    list.push(f);
    foodsByMeal.set(f.nutrition_meal_id, list);
  }

  const mealsWithFoods: NutritionMealWithFoods[] = meals.map((m) => ({
    ...m,
    foods: foodsByMeal.get(m.id) || [],
  }));

  const isBudgetTight = (plan.estimated_cost_inr || 0) > (plan.budget_inr || 0);

  return { plan: { ...plan, meals: mealsWithFoods }, error: null, isBudgetTight };
}

export async function createNutritionPlan(
  profile: ProfileData,
  prefs: NutrientPrefs,
): Promise<NutritionResult> {
  // Calculate targets
  const targets = calculateNutritionTargets(profile, prefs);

  // Check if budget is very low (under ₹100/day)
  if (prefs.daily_budget_inr < 100) {
    // Still generate but flag as tight
  }

  // Generate weekly plan
  const weekPlan = generateWeeklyPlan(targets, prefs);

  // Deactivate any existing active plans
  await supabase
    .from('nutrition_plans')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('user_id', profile.id)
    .eq('active', true);

  // Insert plan
  const { data: plan, error: planError } = await supabase
    .from('nutrition_plans')
    .insert({
      user_id: profile.id,
      target_calories: targets.calories,
      target_protein: targets.protein,
      target_carbs: targets.carbs,
      target_fat: targets.fat,
      target_fiber: targets.fiber,
      estimated_cost_inr: weekPlan.avgCost,
      budget_inr: prefs.daily_budget_inr,
      active: true,
    })
    .select()
    .single();

  if (planError || !plan) {
    console.error('[NUTRITION] Error creating plan:', planError?.message, planError?.code);
    if (planError?.code === '42P01' || planError?.message?.includes('does not exist')) {
      return { plan: null, error: 'DATABASE_MISSING', isBudgetTight: false };
    }
    return { plan: null, error: planError?.message || 'Failed to create nutrition plan.', isBudgetTight: false };
  }

  // Get today's date (Monday-based week start)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  // Insert meals for each day
  const mealInserts = weekPlan.days.map((day, idx) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + idx);
    return {
      nutrition_plan_id: plan.id,
      day_of_week: day.dayOfWeek,
      day_date: date.toISOString().split('T')[0],
      order_index: idx,
    };
  });

  const { data: savedMeals, error: mealsError } = await supabase
    .from('nutrition_meals')
    .insert(mealInserts)
    .select();

  if (mealsError || !savedMeals) {
    console.error('[NUTRITION] Error creating meals:', mealsError?.message, mealsError?.code);
    return { plan: { ...plan, meals: [] }, error: mealsError?.message || 'Failed to create meals.', isBudgetTight: weekPlan.isBudgetTight };
  }

  // Insert foods for each meal
  for (let i = 0; i < savedMeals.length; i++) {
    const savedMeal = savedMeals[i];
    const dayPlan = weekPlan.days[i];

    const foodInserts: Array<{
      nutrition_meal_id: string;
      food_name: string;
      quantity: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      meal_type: string;
      order_index: number;
    }> = [];

    let orderIdx = 0;
    for (const slot of dayPlan.meals) {
      for (const food of slot.foods) {
        foodInserts.push({
          nutrition_meal_id: savedMeal.id,
          food_name: food.name,
          quantity: food.servingSize,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          fiber: food.fiber,
          meal_type: slot.type,
          order_index: orderIdx++,
        });
      }
    }

    if (foodInserts.length > 0) {
      const { error: foodsError } = await supabase
        .from('nutrition_foods')
        .insert(foodInserts);

      if (foodsError) {
        console.error('[NUTRITION] Error creating foods for meal:', savedMeal.id, foodsError.message);
      }
    }
  }

  // Re-fetch the full plan
  return getActiveNutritionPlan(profile.id);
}

export async function regenerateNutritionPlan(
  profile: ProfileData,
  prefs: NutrientPrefs,
): Promise<NutritionResult> {
  // Delete existing active plan data
  const { data: existingPlan } = await supabase
    .from('nutrition_plans')
    .select('id')
    .eq('user_id', profile.id)
    .eq('active', true)
    .maybeSingle();

  if (existingPlan) {
    // Delete foods first
    const { data: meals } = await supabase
      .from('nutrition_meals')
      .select('id')
      .eq('nutrition_plan_id', existingPlan.id);

    if (meals && meals.length > 0) {
      const mealIds = meals.map((m) => m.id);
      await supabase.from('nutrition_foods').delete().in('nutrition_meal_id', mealIds);
      await supabase.from('nutrition_meals').delete().eq('nutrition_plan_id', existingPlan.id);
    }
    await supabase.from('nutrition_plans').delete().eq('id', existingPlan.id);
  }

  return createNutritionPlan(profile, prefs);
}

export async function updateDayMeals(
  planId: string,
  dayOfWeek: string,
  newMeals: GeneratedDayPlan,
): Promise<{ success: boolean; error: string | null }> {
  // Find the meal record for this day
  const { data: mealRecord, error: mealFindError } = await supabase
    .from('nutrition_meals')
    .select('id')
    .eq('nutrition_plan_id', planId)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle();

  if (mealFindError || !mealRecord) {
    console.error('[NUTRITION] Error finding meal for day:', dayOfWeek, mealFindError?.message);
    return { success: false, error: 'Could not find meal record for this day.' };
  }

  // Delete existing foods for this meal
  await supabase
    .from('nutrition_foods')
    .delete()
    .eq('nutrition_meal_id', mealRecord.id);

  // Insert new foods
  const foodInserts: Array<{
    nutrition_meal_id: string;
    food_name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    meal_type: string;
    order_index: number;
  }> = [];

  let orderIdx = 0;
  for (const slot of newMeals.meals) {
    for (const food of slot.foods) {
      foodInserts.push({
        nutrition_meal_id: mealRecord.id,
        food_name: food.name,
        quantity: food.servingSize,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber,
        meal_type: slot.type,
        order_index: orderIdx++,
      });
    }
  }

  if (foodInserts.length > 0) {
    const { error: foodsError } = await supabase
      .from('nutrition_foods')
      .insert(foodInserts);

    if (foodsError) {
      console.error('[NUTRITION] Error inserting new foods:', foodsError.message);
      return { success: false, error: foodsError.message };
    }
  }

  return { success: true, error: null };
}

export function getDayAlternatives(
  targets: { calories: number; protein: number; carbs: number; fat: number; fiber: number },
  prefs: {
    occupation: string;
    diet: string;
    daily_budget_inr: number;
    allergies: string;
    foods_to_avoid: string;
    meals_per_day: number;
  },
  dayOfWeek: string,
): GeneratedDayPlan[] {
  const dayIndex = getDayIndex(dayOfWeek);
  if (dayIndex === -1) return [];
  return generateDayAlternatives(targets, prefs, dayIndex, 3);
}
