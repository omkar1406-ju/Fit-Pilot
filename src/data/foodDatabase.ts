import type { FoodItem } from '../types/nutrition';

const allDiets = ['vegetarian', 'non-vegetarian', 'eggitarian', 'vegan'];

export const foodDatabase: FoodItem[] = [
  // GRAINS & STAPLES
  { name: 'White Rice (cooked)', category: 'grain', servingSize: '1 cup (150g)', calories: 195, protein: 4, carbs: 43, fat: 0.4, fiber: 0.6, priceInr: 15, diet: allDiets },
  { name: 'Brown Rice (cooked)', category: 'grain', servingSize: '1 cup (150g)', calories: 170, protein: 4, carbs: 35, fat: 1.5, fiber: 2.5, priceInr: 20, diet: allDiets },
  { name: 'Whole Wheat Roti', category: 'grain', servingSize: '1 medium (40g)', calories: 120, protein: 4, carbs: 24, fat: 1.5, fiber: 3.5, priceInr: 8, diet: allDiets },
  { name: 'Oats (cooked)', category: 'grain', servingSize: '1 cup (240g)', calories: 150, protein: 5, carbs: 27, fat: 2.5, fiber: 4, priceInr: 18, diet: allDiets },
  { name: 'Ragi Porridge', category: 'grain', servingSize: '1 cup (200g)', calories: 140, protein: 4, carbs: 28, fat: 1.5, fiber: 3, priceInr: 15, diet: allDiets },
  { name: 'Bread (whole wheat)', category: 'grain', servingSize: '2 slices (60g)', calories: 150, protein: 5, carbs: 28, fat: 2, fiber: 3, priceInr: 10, diet: allDiets },
  { name: 'Poha (cooked)', category: 'grain', servingSize: '1 plate (200g)', calories: 180, protein: 4, carbs: 35, fat: 3, fiber: 2, priceInr: 18, diet: allDiets },
  { name: 'Upma', category: 'grain', servingSize: '1 plate (200g)', calories: 190, protein: 5, carbs: 32, fat: 5, fiber: 2, priceInr: 20, diet: allDiets },

  // PROTEIN - VEGETARIAN
  { name: 'Moong Dal (cooked)', category: 'protein', servingSize: '1 cup (200g)', calories: 210, protein: 14, carbs: 30, fat: 1, fiber: 8, priceInr: 22, diet: ['vegetarian', 'eggitarian', 'vegan'] },
  { name: 'Masoor Dal (cooked)', category: 'protein', servingSize: '1 cup (200g)', calories: 220, protein: 16, carbs: 32, fat: 1, fiber: 7, priceInr: 20, diet: ['vegetarian', 'eggitarian', 'vegan'] },
  { name: 'Toor Dal (cooked)', category: 'protein', servingSize: '1 cup (200g)', calories: 210, protein: 12, carbs: 30, fat: 1.5, fiber: 6, priceInr: 25, diet: ['vegetarian', 'eggitarian', 'vegan'] },
  { name: 'Chana Dal (cooked)', category: 'protein', servingSize: '1 cup (200g)', calories: 230, protein: 13, carbs: 35, fat: 2, fiber: 8, priceInr: 22, diet: ['vegetarian', 'eggitarian', 'vegan'] },
  { name: 'Rajma (cooked)', category: 'protein', servingSize: '1 cup (200g)', calories: 230, protein: 15, carbs: 35, fat: 1, fiber: 10, priceInr: 25, diet: ['vegetarian', 'eggitarian', 'vegan'] },
  { name: 'Chole (cooked)', category: 'protein', servingSize: '1 cup (200g)', calories: 250, protein: 14, carbs: 38, fat: 3, fiber: 10, priceInr: 28, diet: ['vegetarian', 'eggitarian', 'vegan'] },
  { name: 'Soy Chunks (cooked)', category: 'protein', servingSize: '1 cup (100g)', calories: 170, protein: 24, carbs: 8, fat: 5, fiber: 3, priceInr: 18, diet: ['vegetarian', 'eggitarian', 'vegan'] },
  { name: 'Paneer (cottage cheese)', category: 'protein', servingSize: '100g', calories: 265, protein: 18, carbs: 4, fat: 20, fiber: 0, priceInr: 45, diet: ['vegetarian', 'eggitarian'] },
  { name: 'Tofu', category: 'protein', servingSize: '100g', calories: 140, protein: 15, carbs: 3, fat: 8, fiber: 1, priceInr: 35, diet: ['vegan', 'vegetarian'] },
  { name: 'Peanuts', category: 'protein', servingSize: '30g', calories: 170, protein: 7, carbs: 6, fat: 14, fiber: 2, priceInr: 12, diet: allDiets },
  { name: 'Peanut Butter', category: 'protein', servingSize: '2 tbsp (32g)', calories: 190, protein: 8, carbs: 7, fat: 16, fiber: 2, priceInr: 15, diet: allDiets },
  { name: 'Milk (whole)', category: 'protein', servingSize: '1 glass (250ml)', calories: 150, protein: 8, carbs: 12, fat: 8, fiber: 0, priceInr: 18, diet: ['vegetarian', 'eggitarian'] },
  { name: 'Curd / Yogurt', category: 'protein', servingSize: '1 cup (200g)', calories: 120, protein: 8, carbs: 12, fat: 4, fiber: 0, priceInr: 15, diet: ['vegetarian', 'eggitarian'] },
  { name: 'Buttermilk (Chaas)', category: 'protein', servingSize: '1 glass (300ml)', calories: 60, protein: 3, carbs: 6, fat: 2, fiber: 0, priceInr: 10, diet: ['vegetarian', 'eggitarian'] },
  { name: 'Sprouted Moong', category: 'protein', servingSize: '1 cup (150g)', calories: 120, protein: 9, carbs: 16, fat: 0.5, fiber: 5, priceInr: 12, diet: ['vegetarian', 'eggitarian', 'vegan'] },
  { name: 'Boiled Chana (100g)', category: 'protein', servingSize: '1 cup (100g)', calories: 164, protein: 9, carbs: 27, fat: 2.6, fiber: 8, priceInr: 10, diet: ['vegetarian', 'eggitarian', 'vegan'] },
  { name: 'Soy Milk', category: 'protein', servingSize: '1 glass (250ml)', calories: 80, protein: 7, carbs: 4, fat: 4, fiber: 1, priceInr: 15, diet: ['vegan', 'vegetarian'] },
  { name: 'Egg White (4)', category: 'protein', servingSize: '4 whites (132g)', calories: 68, protein: 14, carbs: 1, fat: 0, fiber: 0, priceInr: 10, diet: ['non-vegetarian', 'eggitarian'] },

  // PROTEIN - NON-VEGETARIAN
  { name: 'Boiled Eggs', category: 'protein', servingSize: '2 eggs (100g)', calories: 155, protein: 13, carbs: 1, fat: 11, fiber: 0, priceInr: 14, diet: ['non-vegetarian', 'eggitarian'] },
  { name: 'Egg Omelette (2 eggs)', category: 'protein', servingSize: '1 omelette', calories: 180, protein: 13, carbs: 2, fat: 13, fiber: 0, priceInr: 15, diet: ['non-vegetarian', 'eggitarian'] },
  { name: 'Chicken Breast (grilled)', category: 'protein', servingSize: '100g', calories: 165, protein: 31, carbs: 0, fat: 4, fiber: 0, priceInr: 60, diet: ['non-vegetarian'] },
  { name: 'Chicken Curry (homestyle)', category: 'protein', servingSize: '1 serving (150g)', calories: 220, protein: 25, carbs: 5, fat: 10, fiber: 1, priceInr: 70, diet: ['non-vegetarian'] },
  { name: 'Fish (roasted)', category: 'protein', servingSize: '100g', calories: 140, protein: 26, carbs: 0, fat: 3, fiber: 0, priceInr: 80, diet: ['non-vegetarian'] },
  { name: 'Mutton Curry', category: 'protein', servingSize: '1 serving (150g)', calories: 280, protein: 24, carbs: 4, fat: 18, fiber: 0.5, priceInr: 120, diet: ['non-vegetarian'] },

  // VEGETABLES
  { name: 'Mixed Vegetable Sabzi', category: 'vegetable', servingSize: '1 cup (150g)', calories: 80, protein: 3, carbs: 12, fat: 2, fiber: 4, priceInr: 18, diet: ['vegetarian', 'eggitarian', 'vegan'] },
  { name: 'Palak (Spinach)', category: 'vegetable', servingSize: '1 cup (100g)', calories: 40, protein: 3, carbs: 5, fat: 1, fiber: 3, priceInr: 12, diet: ['vegetarian', 'eggitarian', 'vegan'] },
  { name: 'Broccoli', category: 'vegetable', servingSize: '1 cup (100g)', calories: 35, protein: 3, carbs: 5, fat: 0.5, fiber: 3, priceInr: 25, diet: allDiets },
  { name: 'Carrot (cooked)', category: 'vegetable', servingSize: '1 cup (100g)', calories: 40, protein: 1, carbs: 8, fat: 0.5, fiber: 3, priceInr: 10, diet: allDiets },
  { name: 'Cucumber', category: 'vegetable', servingSize: '1 medium (150g)', calories: 24, protein: 1, carbs: 5, fat: 0.2, fiber: 1, priceInr: 8, diet: allDiets },
  { name: 'Tomato (raw)', category: 'vegetable', servingSize: '1 medium (100g)', calories: 20, protein: 1, carbs: 4, fat: 0.2, fiber: 1, priceInr: 6, diet: allDiets },
  { name: 'Bottle Gourd (Lauki)', category: 'vegetable', servingSize: '1 cup (150g)', calories: 25, protein: 1, carbs: 5, fat: 0.2, fiber: 2, priceInr: 12, diet: allDiets },
  { name: 'Cauliflower', category: 'vegetable', servingSize: '1 cup (100g)', calories: 30, protein: 2, carbs: 5, fat: 0.5, fiber: 2, priceInr: 15, diet: allDiets },
  { name: 'Sweet Potato (boiled)', category: 'vegetable', servingSize: '1 medium (100g)', calories: 90, protein: 2, carbs: 20, fat: 0.2, fiber: 3, priceInr: 12, diet: allDiets },

  // FRUITS
  { name: 'Banana', category: 'fruit', servingSize: '1 medium (100g)', calories: 90, protein: 1, carbs: 23, fat: 0.3, fiber: 2.5, priceInr: 8, diet: allDiets },
  { name: 'Apple', category: 'fruit', servingSize: '1 medium (150g)', calories: 80, protein: 0.5, carbs: 20, fat: 0.3, fiber: 3, priceInr: 25, diet: allDiets },
  { name: 'Orange', category: 'fruit', servingSize: '1 medium (130g)', calories: 60, protein: 1, carbs: 14, fat: 0.2, fiber: 2, priceInr: 15, diet: allDiets },
  { name: 'Seasonal Fruit Mix', category: 'fruit', servingSize: '1 bowl (150g)', calories: 70, protein: 1, carbs: 16, fat: 0.3, fiber: 2, priceInr: 20, diet: allDiets },
  { name: 'Guava', category: 'fruit', servingSize: '1 medium (100g)', calories: 50, protein: 2, carbs: 12, fat: 0.5, fiber: 5, priceInr: 10, diet: allDiets },
  { name: 'Papaya', category: 'fruit', servingSize: '1 cup (150g)', calories: 60, protein: 1, carbs: 14, fat: 0.3, fiber: 2.5, priceInr: 15, diet: allDiets },

  // SNACKS & EXTRAS
  { name: 'Sprouts Salad', category: 'snack', servingSize: '1 bowl (150g)', calories: 100, protein: 7, carbs: 14, fat: 1, fiber: 5, priceInr: 15, diet: allDiets },
  { name: 'Makhana (Fox Nuts)', category: 'snack', servingSize: '1 cup (30g)', calories: 100, protein: 3, carbs: 12, fat: 5, fiber: 1, priceInr: 15, diet: allDiets },
  { name: 'Roasted Chana', category: 'snack', servingSize: '1/4 cup (30g)', calories: 120, protein: 6, carbs: 18, fat: 2, fiber: 4, priceInr: 8, diet: allDiets },
  { name: 'Banana Shake', category: 'snack', servingSize: '1 glass (250ml)', calories: 180, protein: 6, carbs: 30, fat: 4, fiber: 1, priceInr: 20, diet: ['vegetarian', 'eggitarian'] },
  { name: 'Masala Omelette', category: 'snack', servingSize: '2 eggs', calories: 195, protein: 14, carbs: 2, fat: 14, fiber: 0, priceInr: 18, diet: ['non-vegetarian', 'eggitarian'] },
  { name: 'Idli (2 pieces)', category: 'snack', servingSize: '2 idlis', calories: 130, protein: 4, carbs: 26, fat: 1, fiber: 2, priceInr: 15, diet: allDiets },
  { name: 'Dosa (plain)', category: 'snack', servingSize: '1 large', calories: 150, protein: 3, carbs: 28, fat: 3, fiber: 1, priceInr: 18, diet: allDiets },
  { name: 'Ragi Dosa', category: 'snack', servingSize: '1 large', calories: 140, protein: 4, carbs: 24, fat: 3, fiber: 3, priceInr: 20, diet: allDiets },
  { name: 'Peanut Chikki', category: 'snack', servingSize: '1 piece (30g)', calories: 140, protein: 5, carbs: 14, fat: 8, fiber: 1, priceInr: 10, diet: allDiets },
];

export const mealTypeLabels: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
};

export function getFoodsForDiet(diet: string): FoodItem[] {
  if (diet === 'non-vegetarian') {
    // Non-vegetarian users can eat everything (veg + non-veg)
    return foodDatabase;
  }
  const dietMap: Record<string, string> = {
    vegetarian: 'vegetarian',
    eggitarian: 'eggitarian',
    vegan: 'vegan',
    other: 'vegan',
  };
  const mappedDiet = dietMap[diet] || 'vegetarian';
  return foodDatabase.filter((f) => f.diet.includes(mappedDiet));
}

export function getFoodsByCategory(foods: FoodItem[], category: string): FoodItem[] {
  return foods.filter((f) => f.category === category);
}
