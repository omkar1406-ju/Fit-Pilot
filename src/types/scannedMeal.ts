export interface ScannedMeal {
  id: string;
  user_id: string;
  scan_date: string;
  meal_type: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  created_at: string;
}

export interface ScannedFood {
  id: string;
  scanned_meal_id: string;
  food_name: string;
  quantity_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  order_index: number;
}

export interface ScannedMealWithFoods extends ScannedMeal {
  foods: ScannedFood[];
}

export interface ScannedFoodTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}
