import { supabase } from './supabase';
import { foodDatabase } from '../data/foodDatabase';
import type { FoodItem } from '../types/nutrition';
import type { ScannedMealWithFoods, ScannedFood, ScannedFoodTotals } from '../types/scannedMeal';

export interface ScannedFoodItem {
  food: FoodItem;
  quantityGrams: number;
}

function calculateNutrition(food: FoodItem, quantityGrams: number): ScannedFoodTotals {
  const servingGrams = parseServingGrams(food.servingSize);
  if (servingGrams === 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  }
  const multiplier = quantityGrams / servingGrams;
  return {
    calories: Math.round(food.calories * multiplier),
    protein: Math.round(food.protein * multiplier * 10) / 10,
    carbs: Math.round(food.carbs * multiplier * 10) / 10,
    fat: Math.round(food.fat * multiplier * 10) / 10,
    fiber: Math.round(food.fiber * multiplier * 10) / 10,
  };
}

function parseServingGrams(servingSize: string): number {
  const match = servingSize.match(/\((\d+)g\)/);
  if (match) return parseInt(match[1], 10);
  const numMatch = servingSize.match(/(\d+)\s*g/i);
  if (numMatch) return parseInt(numMatch[1], 10);
  if (servingSize.includes('egg')) return 100;
  if (servingSize.includes('slice')) return 30;
  if (servingSize.includes('medium')) return 150;
  if (servingSize.includes('large')) return 150;
  return 100;
}

export function searchFoods(query: string): FoodItem[] {
  if (!query.trim()) return foodDatabase;
  const lower = query.toLowerCase();
  return foodDatabase.filter(
    (f) =>
      f.name.toLowerCase().includes(lower) ||
      f.category.toLowerCase().includes(lower),
  );
}

export function calculateMealTotals(items: ScannedFoodItem[]): ScannedFoodTotals {
  return items.reduce(
    (acc, item) => {
      const n = calculateNutrition(item.food, item.quantityGrams);
      return {
        calories: acc.calories + n.calories,
        protein: Math.round((acc.protein + n.protein) * 10) / 10,
        carbs: Math.round((acc.carbs + n.carbs) * 10) / 10,
        fat: Math.round((acc.fat + n.fat) * 10) / 10,
        fiber: Math.round((acc.fiber + n.fiber) * 10) / 10,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );
}

export function calculateItemNutrition(food: FoodItem, quantityGrams: number): ScannedFoodTotals {
  return calculateNutrition(food, quantityGrams);
}

export function getDefaultQuantity(food: FoodItem): number {
  const grams = parseServingGrams(food.servingSize);
  return grams > 0 ? grams : 100;
}

export async function saveScannedMeal(
  userId: string,
  mealType: string,
  scanDate: string,
  items: ScannedFoodItem[],
): Promise<{ meal: ScannedMealWithFoods | null; error: string | null }> {
  const totals = calculateMealTotals(items);

  const { data: meal, error: mealError } = await supabase
    .from('scanned_meals')
    .insert({
      user_id: userId,
      scan_date: scanDate,
      meal_type: mealType,
      total_calories: totals.calories,
      total_protein: totals.protein,
      total_carbs: totals.carbs,
      total_fat: totals.fat,
      total_fiber: totals.fiber,
    })
    .select()
    .single();

  if (mealError || !meal) {
    console.error('[SCANNER] Error saving scanned meal:', mealError?.message, mealError?.code);
    if (mealError?.code === '42P01' || mealError?.message?.includes('does not exist')) {
      return { meal: null, error: 'DATABASE_MISSING' };
    }
    return { meal: null, error: mealError?.message || 'Failed to save scanned meal.' };
  }

  if (items.length > 0) {
    const foodInserts = items.map((item, idx) => {
      const n = calculateNutrition(item.food, item.quantityGrams);
      return {
        scanned_meal_id: meal.id,
        food_name: item.food.name,
        quantity_grams: item.quantityGrams,
        calories: n.calories,
        protein: n.protein,
        carbs: n.carbs,
        fat: n.fat,
        fiber: n.fiber,
        order_index: idx,
      };
    });

    const { error: foodsError } = await supabase.from('scanned_foods').insert(foodInserts);

    if (foodsError) {
      console.error('[SCANNER] Error saving scanned foods:', foodsError.message);
    }
  }

  return {
    meal: { ...meal, foods: [] },
    error: null,
  };
}

export async function getScannedMealsForDate(
  userId: string,
  date: string,
): Promise<{ meals: ScannedMealWithFoods[]; error: string | null }> {
  const { data: meals, error: mealsError } = await supabase
    .from('scanned_meals')
    .select('*')
    .eq('user_id', userId)
    .eq('scan_date', date)
    .order('created_at', { ascending: true });

  if (mealsError) {
    console.error('[SCANNER] Error fetching scanned meals:', mealsError.message, mealsError.code);
    if (mealsError.code === '42P01' || mealsError.message?.includes('does not exist')) {
      return { meals: [], error: 'DATABASE_MISSING' };
    }
    return { meals: [], error: mealsError.message };
  }

  if (!meals || meals.length === 0) {
    return { meals: [], error: null };
  }

  const mealIds = meals.map((m) => m.id);

  const { data: foods, error: foodsError } = await supabase
    .from('scanned_foods')
    .select('*')
    .in('scanned_meal_id', mealIds)
    .order('order_index');

  if (foodsError) {
    console.error('[SCANNER] Error fetching scanned foods:', foodsError.message);
    return {
      meals: meals.map((m) => ({ ...m, foods: [] })),
      error: null,
    };
  }

  const foodsByMeal = new Map<string, ScannedFood[]>();
  for (const f of foods || []) {
    const list = foodsByMeal.get(f.scanned_meal_id) || [];
    list.push(f);
    foodsByMeal.set(f.scanned_meal_id, list);
  }

  const mealsWithFoods: ScannedMealWithFoods[] = meals.map((m) => ({
    ...m,
    foods: foodsByMeal.get(m.id) || [],
  }));

  return { meals: mealsWithFoods, error: null };
}

export async function deleteScannedMeal(mealId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('scanned_meals').delete().eq('id', mealId);
  if (error) {
    console.error('[SCANNER] Error deleting scanned meal:', error.message);
    return { error: error.message };
  }
  return { error: null };
}

export function aggregateScannedTotals(meals: ScannedMealWithFoods[]): ScannedFoodTotals {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.total_calories,
      protein: Math.round((acc.protein + meal.total_protein) * 10) / 10,
      carbs: Math.round((acc.carbs + meal.total_carbs) * 10) / 10,
      fat: Math.round((acc.fat + meal.total_fat) * 10) / 10,
      fiber: Math.round((acc.fiber + meal.total_fiber) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );
}
