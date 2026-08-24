import { useState, useRef } from 'react';
import { foodDatabase } from '../data/foodDatabase';
import type { FoodItem } from '../types/nutrition';
import type { ScannedFoodTotals } from '../types/scannedMeal';
import {
  searchFoods,
  calculateItemNutrition,
  calculateMealTotals,
  getDefaultQuantity,
  saveScannedMeal,
} from '../lib/scannerService';
import Button from './Button';
import './MealScanner.css';

interface ScannedFoodEntry {
  id: string;
  food: FoodItem;
  quantityGrams: number;
}

interface MealScannerProps {
  userId: string;
  onSaved: () => void;
}

const mealTypeOptions = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'snack', label: 'Snack' },
  { value: 'dinner', label: 'Dinner' },
];

export default function MealScanner({ userId, onSaved }: MealScannerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [entries, setEntries] = useState<ScannedFoodEntry[]>([]);
  const [mealType, setMealType] = useState('lunch');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
      setAnalyzed(false);
      setEntries([]);
      setSaved(false);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
      setAnalyzed(false);
      setEntries([]);
      setSaved(false);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setAnalyzed(false);
    setEntries([]);
    setSaved(false);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = () => {
    setAnalyzed(true);
    if (entries.length === 0) {
      addNewEntry();
    }
  };

  const addNewEntry = () => {
    const newEntry: ScannedFoodEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      food: foodDatabase[0],
      quantityGrams: getDefaultQuantity(foodDatabase[0]),
    };
    setEntries((prev) => [...prev, newEntry]);
  };

  const updateEntryFood = (entryId: string, food: FoodItem) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? { ...e, food, quantityGrams: getDefaultQuantity(food) }
          : e,
      ),
    );
    setShowDropdown(null);
    setSearchQuery('');
  };

  const updateEntryQuantity = (entryId: string, qty: number) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, quantityGrams: qty } : e)),
    );
  };

  const removeEntry = (entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  };

  const handleSearch = (query: string, entryId: string) => {
    setSearchQuery(query);
    setShowDropdown(entryId);
    const results = searchFoods(query);
    setSearchResults(results.slice(0, 8));
  };

  const getTodayDate = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (entries.length === 0) return;
    setSaving(true);
    setError('');

    const { meal, error: saveError } = await saveScannedMeal(
      userId,
      mealType,
      getTodayDate(),
      entries.map((e) => ({ food: e.food, quantityGrams: e.quantityGrams })),
    );

    setSaving(false);

    if (saveError) {
      if (saveError === 'DATABASE_MISSING') {
        setError('Scanner tables not created yet. Please run the SQL migration in Supabase.');
      } else {
        setError('Failed to save. Please try again.');
      }
      return;
    }

    if (meal) {
      setSaved(true);
      onSaved();
    }
  };

  const totals: ScannedFoodTotals = calculateMealTotals(
    entries.map((e) => ({ food: e.food, quantityGrams: e.quantityGrams })),
  );

  return (
    <div className="scanner">
      <div className="scanner__header">
        <h3 className="scanner__title">Scan My Meal</h3>
        <p className="scanner__subtitle">
          Upload a photo of your meal, then add the foods manually for an instant nutrition estimate.
        </p>
      </div>

      {!imagePreview && (
        <div
          className="scanner__dropzone"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="scanner__dropzone-icon">📷</div>
          <p className="scanner__dropzone-text">Drop a meal photo here or click to upload</p>
          <p className="scanner__dropzone-hint">
            For a better estimate, upload a clear photo where most of the meal is visible.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="scanner__file-input"
            onChange={handleImageSelect}
          />
        </div>
      )}

      {imagePreview && (
        <div className="scanner__preview-area">
          <div className="scanner__preview-wrap">
            <img src={imagePreview} alt="Meal preview" className="scanner__preview-img" />
            <button className="scanner__preview-remove" onClick={handleRemoveImage} title="Remove photo">
              ✕
            </button>
          </div>

          {!analyzed && (
            <button className="scanner__analyze-btn" onClick={handleAnalyze}>
              Analyze Meal
            </button>
          )}
        </div>
      )}

      {analyzed && !saved && (
        <div className="scanner__results">
          <div className="scanner__notice">
            Image uploaded successfully. Automatic food recognition requires a vision model. You can add the foods manually below.
          </div>

          <div className="scanner__meal-type-row">
            <span className="scanner__meal-type-label">Meal type:</span>
            {mealTypeOptions.map((opt) => (
              <button
                key={opt.value}
                className={`scanner__meal-type-btn ${mealType === opt.value ? 'scanner__meal-type-btn--active' : ''}`}
                onClick={() => setMealType(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="scanner__foods-header">
            <span className="scanner__foods-title">Detected Foods</span>
            <span className="scanner__foods-sub">Edit quantities to get an accurate estimate</span>
          </div>

          <div className="scanner__entries">
            {entries.map((entry) => {
              const nutrition = calculateItemNutrition(entry.food, entry.quantityGrams);
              return (
                <div key={entry.id} className="scanner__entry">
                  <div className="scanner__entry-food">
                    <div className="scanner__search-wrap">
                      <input
                        className="scanner__search-input"
                        type="text"
                        value={showDropdown === entry.id ? searchQuery : entry.food.name}
                        onChange={(e) => handleSearch(e.target.value, entry.id)}
                        onFocus={() => {
                          setShowDropdown(entry.id);
                          setSearchQuery('');
                          setSearchResults(foodDatabase.slice(0, 8));
                        }}
                        placeholder="Search food..."
                      />
                      {showDropdown === entry.id && searchResults.length > 0 && (
                        <div className="scanner__dropdown">
                          {searchResults.map((f) => (
                            <button
                              key={f.name}
                              className="scanner__dropdown-item"
                              onClick={() => updateEntryFood(entry.id, f)}
                            >
                              <span className="scanner__dropdown-name">{f.name}</span>
                              <span className="scanner__dropdown-serving">{f.servingSize}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="scanner__entry-qty">
                    <input
                      className="scanner__qty-input"
                      type="number"
                      min="1"
                      max="2000"
                      value={entry.quantityGrams}
                      onChange={(e) => updateEntryQuantity(entry.id, parseInt(e.target.value) || 0)}
                    />
                    <span className="scanner__qty-unit">g</span>
                  </div>

                  <div className="scanner__entry-nutrition">
                    <span>{nutrition.calories} kcal</span>
                    <span>{nutrition.protein}g P</span>
                    <span>{nutrition.carbs}g C</span>
                    <span>{nutrition.fat}g F</span>
                  </div>

                  <button
                    className="scanner__entry-remove"
                    onClick={() => removeEntry(entry.id)}
                    title="Remove food"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>

          <button className="scanner__add-food-btn" onClick={addNewEntry}>
            + Add Food
          </button>

          {entries.length > 0 && (
            <div className="scanner__totals">
              <div className="scanner__totals-header">Estimated Meal Nutrition</div>
              <div className="scanner__totals-grid">
                <div className="scanner__total-item">
                  <span className="scanner__total-value">{totals.calories}</span>
                  <span className="scanner__total-label">kcal</span>
                </div>
                <div className="scanner__total-item">
                  <span className="scanner__total-value">{totals.protein}g</span>
                  <span className="scanner__total-label">Protein</span>
                </div>
                <div className="scanner__total-item">
                  <span className="scanner__total-value">{totals.carbs}g</span>
                  <span className="scanner__total-label">Carbs</span>
                </div>
                <div className="scanner__total-item">
                  <span className="scanner__total-value">{totals.fat}g</span>
                  <span className="scanner__total-label">Fat</span>
                </div>
                <div className="scanner__total-item">
                  <span className="scanner__total-value">{totals.fiber}g</span>
                  <span className="scanner__total-label">Fiber</span>
                </div>
              </div>
              <p className="scanner__disclaimer">
                These values are estimates based on standard nutrition data. Portion size, ingredients, and cooking methods can affect actual nutrition.
              </p>
            </div>
          )}

          {error && <div className="scanner__error">{error}</div>}

          <div className="scanner__actions">
            <Button
              onClick={handleSave}
              disabled={entries.length === 0 || saving}
            >
              {saving ? 'Saving...' : "Add to Today's Nutrition"}
            </Button>
          </div>
        </div>
      )}

      {saved && (
        <div className="scanner__saved">
          <div className="scanner__saved-icon">✅</div>
          <p className="scanner__saved-text">Meal saved to today's nutrition!</p>
          <button className="scanner__saved-link" onClick={() => {
            setImagePreview(null);
            setAnalyzed(false);
            setEntries([]);
            setSaved(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}>
            Scan another meal
          </button>
        </div>
      )}
    </div>
  );
}
