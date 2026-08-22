export interface NutritionPreferences {
  id: string;
  user_id: string;
  occupation: string;
  diet: string;
  daily_budget_inr: number;
  allergies: string;
  foods_to_avoid: string;
  meals_per_day: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface NutritionPlan {
  id: string;
  user_id: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  target_fiber: number;
  estimated_cost_inr: number;
  budget_inr: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NutritionMeal {
  id: string;
  nutrition_plan_id: string;
  day_of_week: string;
  day_date: string;
  order_index: number;
}

export interface NutritionFood {
  id: string;
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
}

export interface NutritionMealWithFoods extends NutritionMeal {
  foods: NutritionFood[];
}

export interface NutritionPlanWithMeals extends NutritionPlan {
  meals: NutritionMealWithFoods[];
}

export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface FoodItem {
  name: string;
  category: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  priceInr: number;
  diet: string[];
}

export interface MealSlot {
  type: string;
  label: string;
  foods: FoodItem[];
}
