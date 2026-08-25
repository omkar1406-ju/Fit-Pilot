import { supabase } from './supabase';
import { foodDatabase } from '../data/foodDatabase';
import type { FoodItem } from '../types/nutrition';
import type { ScannedMealWithFoods, ScannedFood, ScannedFoodTotals } from '../types/scannedMeal';
import { analyzeMealImage } from './groqService';

export interface ScannedFoodItem {
  food: FoodItem;
  quantityGrams: number;
}

export interface MatchedFood {
  food: FoodItem;
  quantityGrams: number;
  confidence: 'matched' | 'unmatched';
  aiDetectedName: string;
}

function matchFoodToDatabase(aiName: string): FoodItem | null {
  const lower = aiName.toLowerCase().trim();

  const exact = foodDatabase.find((f) => f.name.toLowerCase() === lower);
  if (exact) return exact;

  const contains = foodDatabase.find((f) => f.name.toLowerCase().includes(lower));
  if (contains) return contains;

  const reverseContains = foodDatabase.find((f) => lower.includes(f.name.toLowerCase().replace(/\s*\(.*\)\s*/g, '')));
  if (reverseContains) return reverseContains;

  const keywords: Record<string, string> = {
    // Grains & staples
    'rice': 'White Rice (cooked)',
    'roti': 'Whole Wheat Roti',
    'chapati': 'Whole Wheat Roti',
    'naan': 'Whole Wheat Roti',
    'bread': 'Bread (whole wheat)',
    'toast': 'Bread (whole wheat)',
    'sandwich': 'Bread (whole wheat)',
    'wrap': 'Bread (whole wheat)',
    'pita': 'Whole Wheat Roti',
    'tortilla': 'Whole Wheat Roti',
    'oats': 'Oats (cooked)',
    'oat': 'Oats (cooked)',
    'oatmeal': 'Oats (cooked)',
    'granola': 'Oats (cooked)',
    'muesli': 'Oats (cooked)',
    'cereal': 'Oats (cooked)',
    'cornflakes': 'Oats (cooked)',
    'muffin': 'Bread (whole wheat)',
    'pancake': 'Dosa (plain)',
    'waffle': 'Dosa (plain)',
    'idli': 'Idli (2 pieces)',
    'dosa': 'Dosa (plain)',
    'poha': 'Poha (cooked)',
    'upma': 'Upma',
    'ragi': 'Ragi Porridge',

    // Protein - vegetarian
    'dal': 'Moong Dal (cooked)',
    'lentil': 'Moong Dal (cooked)',
    'moong': 'Moong Dal (cooked)',
    'masoor': 'Masoor Dal (cooked)',
    'toor': 'Toor Dal (cooked)',
    'chana dal': 'Chana Dal (cooked)',
    'rajma': 'Rajma (cooked)',
    'kidney bean': 'Rajma (cooked)',
    'black bean': 'Rajma (cooked)',
    'chole': 'Chole (cooked)',
    'chickpea': 'Chole (cooked)',
    'chana': 'Boiled Chana (100g)',
    'paneer': 'Paneer (cottage cheese)',
    'cottage cheese': 'Paneer (cottage cheese)',
    'tofu': 'Tofu',
    'peanut': 'Peanuts',
    'peanut butter': 'Peanut Butter',
    'milk': 'Milk (whole)',
    'curd': 'Curd / Yogurt',
    'yogurt': 'Curd / Yogurt',
    'buttermilk': 'Buttermilk (Chaas)',
    'chaas': 'Buttermilk (Chaas)',
    'sprout': 'Sprouts Salad',
    'sprouted': 'Sprouted Moong',
    'soy milk': 'Soy Milk',
    'soymilk': 'Soy Milk',
    'soy': 'Soy Chunks (cooked)',
    'soya': 'Soy Chunks (cooked)',

    // Protein - non-vegetarian
    'egg': 'Boiled Eggs',
    'boiled egg': 'Boiled Eggs',
    'fried egg': 'Egg Omelette (2 eggs)',
    'scrambled egg': 'Boiled Eggs',
    'omelette': 'Egg Omelette (2 eggs)',
    'omelet': 'Egg Omelette (2 eggs)',
    'french toast': 'Egg Omelette (2 eggs)',
    'chicken': 'Chicken Breast (grilled)',
    'chicken curry': 'Chicken Curry (homestyle)',
    'chicken breast': 'Chicken Breast (grilled)',
    'chicken wing': 'Chicken Breast (grilled)',
    'fish': 'Fish (roasted)',
    'salmon': 'Fish (roasted)',
    'tuna': 'Fish (roasted)',
    'shrimp': 'Fish (roasted)',
    'prawn': 'Fish (roasted)',
    'mutton': 'Mutton Curry',
    'lamb': 'Mutton Curry',
    'beef': 'Mutton Curry',

    // Vegetables
    'arugula': 'Palak (Spinach)',
    'lettuce': 'Palak (Spinach)',
    'rocket': 'Palak (Spinach)',
    'spinach': 'Palak (Spinach)',
    'palak': 'Palak (Spinach)',
    'kale': 'Palak (Spinach)',
    'broccoli': 'Broccoli',
    'cauliflower': 'Cauliflower',
    'carrot': 'Carrot (cooked)',
    'cucumber': 'Cucumber',
    'tomato': 'Tomato (raw)',
    'onion': 'Tomato (raw)',
    'bell pepper': 'Mixed Vegetable Sabzi',
    'capsicum': 'Mixed Vegetable Sabzi',
    'mushroom': 'Mixed Vegetable Sabzi',
    'potato': 'Sweet Potato (boiled)',
    'sweet potato': 'Sweet Potato (boiled)',
    'mixed vegetable': 'Mixed Vegetable Sabzi',
    'stir fry': 'Mixed Vegetable Sabzi',
    'sabzi': 'Mixed Vegetable Sabzi',
    'beans': 'Mixed Vegetable Sabzi',
    'corn': 'Mixed Vegetable Sabzi',

    // Fruits
    'banana': 'Banana',
    'apple': 'Apple',
    'orange': 'Orange',
    'guava': 'Guava',
    'papaya': 'Papaya',
    'fruit': 'Seasonal Fruit Mix',
    'mango': 'Seasonal Fruit Mix',
    'berry': 'Seasonal Fruit Mix',
    'strawberry': 'Seasonal Fruit Mix',

    // Snacks & extras
    'salad': 'Sprouts Salad',
    'sprouts salad': 'Sprouts Salad',
    'makhana': 'Makhana (Fox Nuts)',
    'fox nut': 'Makhana (Fox Nuts)',
    'roasted chana': 'Roasted Chana',
    'chikki': 'Peanut Chikki',
    'masala omelette': 'Masala Omelette',
    'biryani': 'White Rice (cooked)',
    'fried rice': 'White Rice (cooked)',
    'curry': 'Chicken Curry (homestyle)',
    'shake': 'Banana Shake',
    'smoothie': 'Banana Shake',
    'banana shake': 'Banana Shake',
  };

  for (const [key, dbName] of Object.entries(keywords)) {
    if (lower.includes(key)) {
      const found = foodDatabase.find((f) => f.name === dbName);
      if (found) return found;
    }
  }

  return null;
}

export async function analyzeImageWithGroq(
  base64DataUrl: string,
): Promise<{ matched: MatchedFood[]; unmatched: string[]; error: string | null }> {
  try {
    const result = await analyzeMealImage(base64DataUrl);

    if (result.foods.length === 0) {
      return { matched: [], unmatched: [], error: 'No food items detected in the image. Try a clearer photo.' };
    }

    const matched: MatchedFood[] = [];
    const unmatched: string[] = [];

    for (const detected of result.foods) {
      const dbFood = matchFoodToDatabase(detected.food);
      if (dbFood) {
        matched.push({
          food: dbFood,
          quantityGrams: detected.estimated_grams,
          confidence: 'matched',
          aiDetectedName: detected.food,
        });
      } else {
        unmatched.push(detected.food);
      }
    }

    return { matched, unmatched, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[SCANNER] Vision analysis failed:', message);
    return { matched: [], unmatched: [], error: `Couldn't analyze this meal. Please try a clearer photo. (${message})` };
  }
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
