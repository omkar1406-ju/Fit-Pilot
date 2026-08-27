import type { FoodItem, NutritionTargets, MealSlot } from '../types/nutrition';
import { getFoodsForDiet, getFoodsByCategory } from '../data/foodDatabase';

interface ProfileData {
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

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const activityMultipliers: Record<string, number> = {
  low: 1.2,
  moderate: 1.55,
  high: 1.725,
};

const goalAdjustments: Record<string, { calMod: number; proteinPct: number; carbPct: number; fatPct: number }> = {
  'Build Muscle': { calMod: 300, proteinPct: 0.30, carbPct: 0.45, fatPct: 0.25 },
  'Get Stronger': { calMod: 200, proteinPct: 0.28, carbPct: 0.47, fatPct: 0.25 },
  'General Fitness': { calMod: 0, proteinPct: 0.25, carbPct: 0.50, fatPct: 0.25 },
  'Sports Performance': { calMod: 250, proteinPct: 0.28, carbPct: 0.47, fatPct: 0.25 },
  'Endurance': { calMod: 200, proteinPct: 0.22, carbPct: 0.55, fatPct: 0.23 },
  'Competition Prep': { calMod: -200, proteinPct: 0.35, carbPct: 0.40, fatPct: 0.25 },
};

export function calculateNutritionTargets(profile: ProfileData, _prefs: NutrientPrefs): NutritionTargets {
  const weight = profile.weight || 70;
  const age = profile.age || 25;
  const height = profile.height || 170;
  const goal = profile.goal || 'General Fitness';
  const activityLevel = profile.activity_level || 'moderate';

  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  const multiplier = activityMultipliers[activityLevel] || 1.55;
  let tdee = bmr * multiplier;

  const goalAdj = goalAdjustments[goal] || goalAdjustments['General Fitness'];
  tdee += goalAdj.calMod;

  const trainingDays = profile.training_days_per_week || 3;
  if (trainingDays >= 4) {
    tdee += 100;
  }

  const calories = Math.round(tdee / 50) * 50;
  const protein = Math.round((calories * goalAdj.proteinPct) / 4);
  const carbs = Math.round((calories * goalAdj.carbPct) / 4);
  const fat = Math.round((calories * goalAdj.fatPct) / 9);
  const fiber = Math.round(weight * 0.5);

  return { calories, protein, carbs, fat, fiber };
}

function parseList(text: string): string[] {
  return text
    .split(/[,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function isFoodAllowed(food: FoodItem, allergies: string[], foodsToAvoid: string[]): boolean {
  const foodNameLower = food.name.toLowerCase();
  for (const allergy of allergies) {
    if (foodNameLower.includes(allergy)) return false;
  }
  for (const avoid of foodsToAvoid) {
    if (foodNameLower.includes(avoid)) return false;
  }
  return true;
}

function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function filterFoods(
  foods: FoodItem[],
  category: string,
  allergies: string[],
  foodsToAvoid: string[],
  usedNames: Set<string>,
  maxPrice: number,
): FoodItem[] {
  return getFoodsByCategory(foods, category).filter(
    (f) =>
      isFoodAllowed(f, allergies, foodsToAvoid) &&
      !usedNames.has(f.name) &&
      f.priceInr <= maxPrice,
  );
}

function pickBestCarb(
  candidates: FoodItem[],
  targetCal: number,
  rng: () => number,
): FoodItem | null {
  if (candidates.length === 0) return null;
  const scored = candidates.map((f) => {
    const calFit = 1 - Math.min(Math.abs(f.calories - targetCal) / Math.max(targetCal, 1), 1);
    const calPerRupee = f.calories / Math.max(f.priceInr, 1);
    return { food: f, score: calFit * 6 + calPerRupee * 3 + rng() * 1.5 };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].food;
}

function pickBestVegFruit(
  candidates: FoodItem[],
  targetCal: number,
  rng: () => number,
): FoodItem | null {
  if (candidates.length === 0) return null;
  const scored = candidates.map((f) => {
    const calFit = 1 - Math.min(Math.abs(f.calories - targetCal) / Math.max(targetCal, 1), 1);
    const fiberPerRupee = f.fiber / Math.max(f.priceInr, 1);
    return { food: f, score: calFit * 4 + fiberPerRupee * 4 + rng() * 1.5 };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].food;
}

function pickBestExtra(
  candidates: FoodItem[],
  targetCal: number,
  rng: () => number,
): FoodItem | null {
  if (candidates.length === 0) return null;
  const scored = candidates.map((f) => {
    const calFit = 1 - Math.min(Math.abs(f.calories - targetCal) / Math.max(targetCal, 1), 1);
    return { food: f, score: calFit * 7 + rng() * 2.0 };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].food;
}

function pickMaxProtein(
  foods: FoodItem[],
  allergies: string[],
  foodsToAvoid: string[],
  usedNames: Set<string>,
  dailyBudget: number,
  spentSoFar: number,
  slotCalTarget: number,
  slotCalAlready: number,
  rng: () => number,
): FoodItem[] {
  const picked: FoodItem[] = [];
  let calBudget = slotCalTarget - slotCalAlready;
  let currentSpent = spentSoFar;
  const maxIterations = 15;

  for (let i = 0; i < maxIterations; i++) {
    if (calBudget <= 20) break;
    const remainingBudget = dailyBudget - currentSpent;
    if (remainingBudget <= 0) break;

    const candidates = filterFoods(foods, 'protein', allergies, foodsToAvoid, usedNames, remainingBudget).filter(
      (f) => f.calories <= calBudget + 50,
    );
    if (candidates.length === 0) break;

    const scored = candidates.map((f) => {
      const proteinPerRupee = f.protein / Math.max(f.priceInr, 1);
      const calFit = f.calories <= calBudget ? 1 : Math.max(0, 1 - (f.calories - calBudget) / 100);
      return { food: f, score: proteinPerRupee * 10 + calFit * 3 + rng() * 1.5 };
    });
    scored.sort((a, b) => b.score - a.score);

    const best = scored[0].food;
    picked.push(best);
    usedNames.add(best.name);
    currentSpent += best.priceInr;
    calBudget -= best.calories;
  }

  return picked;
}

function getMealDistribution(mealsPerDay: number): { type: string; label: string; calPct: number }[] {
  if (mealsPerDay === 3) {
    return [
      { type: 'breakfast', label: 'Breakfast', calPct: 0.30 },
      { type: 'lunch', label: 'Lunch', calPct: 0.40 },
      { type: 'dinner', label: 'Dinner', calPct: 0.30 },
    ];
  }
  if (mealsPerDay === 4) {
    return [
      { type: 'breakfast', label: 'Breakfast', calPct: 0.25 },
      { type: 'lunch', label: 'Lunch', calPct: 0.35 },
      { type: 'snack', label: 'Snack', calPct: 0.12 },
      { type: 'dinner', label: 'Dinner', calPct: 0.28 },
    ];
  }
  return [
    { type: 'breakfast', label: 'Breakfast', calPct: 0.22 },
    { type: 'snack', label: 'Mid-Morning Snack', calPct: 0.10 },
    { type: 'lunch', label: 'Lunch', calPct: 0.30 },
    { type: 'snack', label: 'Evening Snack', calPct: 0.13 },
    { type: 'dinner', label: 'Dinner', calPct: 0.25 },
  ];
}

function generateDayMeals(
  targets: NutritionTargets,
  prefs: NutrientPrefs,
  daySeed: number,
  excludedNames?: Set<string>,
): MealSlot[] {
  const foods = getFoodsForDiet(prefs.diet);
  const allergies = parseList(prefs.allergies);
  const foodsToAvoid = parseList(prefs.foods_to_avoid);
  const mealDistribution = getMealDistribution(prefs.meals_per_day);
  const usedNames = new Set<string>(excludedNames);
  const rng = mulberry32(daySeed);

  const dailyBudget = prefs.daily_budget_inr;
  let spentSoFar = 0;

  const meals: MealSlot[] = [];

  for (const slot of mealDistribution) {
    const targetCal = Math.round(targets.calories * slot.calPct);
    const remainingBudget = Math.max(0, dailyBudget - spentSoFar);
    const slotFoods: FoodItem[] = [];
    let slotCalFilled = 0;

    if (slot.type === 'breakfast') {
      const grain = pickBestCarb(
        filterFoods(foods, 'grain', allergies, foodsToAvoid, usedNames, remainingBudget),
        targetCal * 0.35,
        rng,
      );
      if (grain) {
        slotFoods.push(grain);
        usedNames.add(grain.name);
        spentSoFar += grain.priceInr;
        slotCalFilled += grain.calories;
      }

      const proteins = pickMaxProtein(foods, allergies, foodsToAvoid, usedNames, dailyBudget, spentSoFar, targetCal * 0.55, slotCalFilled, rng);
      for (const p of proteins) {
        slotFoods.push(p);
        spentSoFar += p.priceInr;
        slotCalFilled += p.calories;
      }

      const calRemaining = targetCal - slotCalFilled;
      const costRemaining = Math.max(0, dailyBudget - spentSoFar);
      if (calRemaining > 40 && costRemaining > 0) {
        const extra = pickBestExtra(
          filterFoods(foods, calRemaining > 80 ? 'fruit' : 'snack', allergies, foodsToAvoid, usedNames, costRemaining),
          calRemaining,
          rng,
        );
        if (extra) {
          slotFoods.push(extra);
          usedNames.add(extra.name);
          spentSoFar += extra.priceInr;
          slotCalFilled += extra.calories;
        }
      }

      const calStillLeft = targetCal - slotCalFilled;
      const costStillLeft = Math.max(0, dailyBudget - spentSoFar);
      if (calStillLeft > 30 && costStillLeft > 0) {
        const fruit = pickBestVegFruit(
          filterFoods(foods, 'fruit', allergies, foodsToAvoid, usedNames, costStillLeft),
          calStillLeft,
          rng,
        );
        if (fruit) {
          slotFoods.push(fruit);
          usedNames.add(fruit.name);
          spentSoFar += fruit.priceInr;
          slotCalFilled += fruit.calories;
        }
      }
    } else if (slot.type === 'lunch') {
      const grain = pickBestCarb(
        filterFoods(foods, 'grain', allergies, foodsToAvoid, usedNames, remainingBudget),
        targetCal * 0.30,
        rng,
      );
      if (grain) {
        slotFoods.push(grain);
        usedNames.add(grain.name);
        spentSoFar += grain.priceInr;
        slotCalFilled += grain.calories;
      }

      const proteins = pickMaxProtein(foods, allergies, foodsToAvoid, usedNames, dailyBudget, spentSoFar, targetCal * 0.50, slotCalFilled, rng);
      for (const p of proteins) {
        slotFoods.push(p);
        spentSoFar += p.priceInr;
        slotCalFilled += p.calories;
      }

      const afterProtein = Math.max(0, dailyBudget - spentSoFar);
      const calForVeg = targetCal - slotCalFilled;
      if (calForVeg > 20 && afterProtein > 0) {
        const veg = pickBestVegFruit(
          filterFoods(foods, 'vegetable', allergies, foodsToAvoid, usedNames, afterProtein),
          calForVeg * 0.6,
          rng,
        );
        if (veg) {
          slotFoods.push(veg);
          usedNames.add(veg.name);
          spentSoFar += veg.priceInr;
          slotCalFilled += veg.calories;
        }
      }

      const calRemaining = targetCal - slotCalFilled;
      const costRemaining = Math.max(0, dailyBudget - spentSoFar);
      if (calRemaining > 30 && costRemaining > 0) {
        const extra = pickBestVegFruit(
          filterFoods(foods, 'fruit', allergies, foodsToAvoid, usedNames, costRemaining),
          calRemaining,
          rng,
        );
        if (extra) {
          slotFoods.push(extra);
          usedNames.add(extra.name);
          spentSoFar += extra.priceInr;
          slotCalFilled += extra.calories;
        }
      }
    } else if (slot.type === 'snack') {
      const proteins = pickMaxProtein(foods, allergies, foodsToAvoid, usedNames, dailyBudget, spentSoFar, targetCal * 0.60, slotCalFilled, rng);
      for (const p of proteins) {
        slotFoods.push(p);
        spentSoFar += p.priceInr;
        slotCalFilled += p.calories;
      }

      const calRemaining = targetCal - slotCalFilled;
      const costRemaining = Math.max(0, dailyBudget - spentSoFar);
      if (calRemaining > 30 && costRemaining > 0) {
        const extra = pickBestExtra(
          filterFoods(foods, calRemaining > 60 ? 'fruit' : 'snack', allergies, foodsToAvoid, usedNames, costRemaining),
          calRemaining,
          rng,
        );
        if (extra) {
          slotFoods.push(extra);
          usedNames.add(extra.name);
          spentSoFar += extra.priceInr;
          slotCalFilled += extra.calories;
        }
      }

      const calStillLeft = targetCal - slotCalFilled;
      const costStillLeft = Math.max(0, dailyBudget - spentSoFar);
      if (calStillLeft > 20 && costStillLeft > 0) {
        const carb = pickBestCarb(
          filterFoods(foods, 'grain', allergies, foodsToAvoid, usedNames, costStillLeft),
          calStillLeft,
          rng,
        );
        if (carb) {
          slotFoods.push(carb);
          usedNames.add(carb.name);
          spentSoFar += carb.priceInr;
        }
      }
    } else if (slot.type === 'dinner') {
      const grain = pickBestCarb(
        filterFoods(foods, 'grain', allergies, foodsToAvoid, usedNames, remainingBudget),
        targetCal * 0.30,
        rng,
      );
      if (grain) {
        slotFoods.push(grain);
        usedNames.add(grain.name);
        spentSoFar += grain.priceInr;
        slotCalFilled += grain.calories;
      }

      const proteins = pickMaxProtein(foods, allergies, foodsToAvoid, usedNames, dailyBudget, spentSoFar, targetCal * 0.55, slotCalFilled, rng);
      for (const p of proteins) {
        slotFoods.push(p);
        spentSoFar += p.priceInr;
        slotCalFilled += p.calories;
      }

      const afterProtein = Math.max(0, dailyBudget - spentSoFar);
      const calForVeg = targetCal - slotCalFilled;
      if (calForVeg > 20 && afterProtein > 0) {
        const veg = pickBestVegFruit(
          filterFoods(foods, 'vegetable', allergies, foodsToAvoid, usedNames, afterProtein),
          calForVeg * 0.5,
          rng,
        );
        if (veg) {
          slotFoods.push(veg);
          usedNames.add(veg.name);
          spentSoFar += veg.priceInr;
          slotCalFilled += veg.calories;
        }
      }

      const calRemaining = targetCal - slotCalFilled;
      const costRemaining = Math.max(0, dailyBudget - spentSoFar);
      if (calRemaining > 30 && costRemaining > 0) {
        const extra = pickBestVegFruit(
          filterFoods(foods, 'fruit', allergies, foodsToAvoid, usedNames, costRemaining),
          calRemaining,
          rng,
        );
        if (extra) {
          slotFoods.push(extra);
          usedNames.add(extra.name);
          spentSoFar += extra.priceInr;
        }
      }
    }

    meals.push({
      type: slot.type,
      label: slot.label,
      foods: slotFoods,
    });
  }

  return meals;
}

function calculateMealCost(meals: MealSlot[]): number {
  let total = 0;
  for (const meal of meals) {
    for (const food of meal.foods) {
      total += food.priceInr;
    }
  }
  return total;
}

function calculateMealNutrition(meals: MealSlot[]): NutritionTargets {
  let calories = 0, protein = 0, carbs = 0, fat = 0, fiber = 0;
  for (const meal of meals) {
    for (const food of meal.foods) {
      calories += food.calories;
      protein += food.protein;
      carbs += food.carbs;
      fat += food.fat;
      fiber += food.fiber;
    }
  }
  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    fiber: Math.round(fiber),
  };
}

export interface GeneratedDayPlan {
  dayOfWeek: string;
  meals: MealSlot[];
  totals: NutritionTargets;
  cost: number;
}

export interface GeneratedWeekPlan {
  days: GeneratedDayPlan[];
  targets: NutritionTargets;
  avgCost: number;
  isBudgetTight: boolean;
}

export function generateWeeklyPlan(
  targets: NutritionTargets,
  prefs: NutrientPrefs,
): GeneratedWeekPlan {
  const days: GeneratedDayPlan[] = [];
  let totalCost = 0;

  for (let i = 0; i < 7; i++) {
    const daySeed = i * 15485863 + Math.floor(Date.now() / 60000);
    let meals = generateDayMeals(targets, prefs, daySeed);
    let totals = calculateMealNutrition(meals);
    let cost = calculateMealCost(meals);

    if (cost > prefs.daily_budget_inr && prefs.daily_budget_inr > 0) {
      const scale = prefs.daily_budget_inr / Math.max(cost, 1);
      const reducedTargets = {
        calories: Math.round(targets.calories * scale),
        protein: Math.round(targets.protein * scale),
        carbs: Math.round(targets.carbs * scale),
        fat: Math.round(targets.fat * scale),
        fiber: Math.round(targets.fiber * scale),
      };
      meals = generateDayMeals(reducedTargets, prefs, daySeed + 50000);
      totals = calculateMealNutrition(meals);
      cost = calculateMealCost(meals);
    }

    totalCost += cost;
    days.push({ dayOfWeek: DAYS_OF_WEEK[i], meals, totals, cost });
  }

  const avgCost = Math.round(totalCost / 7);
  const isBudgetTight = avgCost > prefs.daily_budget_inr;

  return { days, targets, avgCost, isBudgetTight };
}

export function generateDayAlternatives(
  targets: NutritionTargets,
  prefs: NutrientPrefs,
  dayIndex: number,
  count: number = 3,
): GeneratedDayPlan[] {
  const alternatives: GeneratedDayPlan[] = [];
  const dayOfWeek = DAYS_OF_WEEK[dayIndex];
  const usedAcrossAlts = new Set<string>();

  for (let alt = 0; alt < count; alt++) {
    const daySeed = dayIndex * 7919 + alt * 99731 + Math.floor(Date.now() / 60000);
    let meals = generateDayMeals(targets, prefs, daySeed, usedAcrossAlts);
    let totals = calculateMealNutrition(meals);
    let cost = calculateMealCost(meals);

    if (cost > prefs.daily_budget_inr && prefs.daily_budget_inr > 0) {
      const scale = prefs.daily_budget_inr / Math.max(cost, 1);
      const reducedTargets = {
        calories: Math.round(targets.calories * scale),
        protein: Math.round(targets.protein * scale),
        carbs: Math.round(targets.carbs * scale),
        fat: Math.round(targets.fat * scale),
        fiber: Math.round(targets.fiber * scale),
      };
      meals = generateDayMeals(reducedTargets, prefs, daySeed + 50000, usedAcrossAlts);
      totals = calculateMealNutrition(meals);
      cost = calculateMealCost(meals);
    }

    for (const meal of meals) {
      for (const food of meal.foods) {
        usedAcrossAlts.add(food.name);
      }
    }

    alternatives.push({ dayOfWeek, meals, totals, cost });
  }

  return alternatives;
}

export function getDayIndex(dayName: string): number {
  return DAYS_OF_WEEK.indexOf(dayName);
}
