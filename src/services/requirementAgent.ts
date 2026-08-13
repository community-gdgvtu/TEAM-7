import type { Language, ProductCategory, Requirement } from '../types';

/**
 * Agent 1 — Requirement Agent
 * Converts natural language customer requests (text or spoken in EN, HI, KN, UR)
 * into structured criteria.
 */
export function analyzeRequirement(input: string, lang: Language = 'en'): Requirement {
  const cleanInput = input.trim();
  const lower = cleanInput.toLowerCase();

  // 1. Budget extraction
  let budget = 0;
  // Match rupee symbols, k/lakh notations, or numbers
  const budgetMatch = lower.match(/(?:₹|rs\.?|inr|rupees?|budget|under|for)?\s*([\d,]+)\s*(k|thousand|lakh)?/i);
  
  // Specific regex for explicit numbers in string
  const numbersOnly = lower.match(/\b\d{3,6}\b/);
  
  if (budgetMatch && budgetMatch[1]) {
    let rawNum = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
    const suffix = (budgetMatch[2] || '').toLowerCase();
    if (suffix === 'k' || suffix === 'thousand') {
      rawNum *= 1000;
    } else if (suffix === 'lakh') {
      rawNum *= 100000;
    }
    budget = rawNum;
  } else if (numbersOnly) {
    budget = parseInt(numbersOnly[0], 10);
  }

  // Fallback default budgets based on keywords if none detected
  if (budget === 0) {
    if (lower.includes('laptop') || lower.includes('computer') || lower.includes('macbook')) budget = 60000;
    else if (lower.includes('samsung') || lower.includes('phone') || lower.includes('mobile')) budget = 18000;
    else if (lower.includes('rice') || lower.includes('grocer') || lower.includes('chawal') || lower.includes('akki')) budget = 400;
    else if (lower.includes('drill') || lower.includes('tool') || lower.includes('hardware')) budget = 2500;
    else if (lower.includes('shirt') || lower.includes('cloth')) budget = 1500;
    else budget = 10000;
  }

  // 2. Category extraction
  let category: ProductCategory = 'Electronics';
  if (lower.includes('laptop') || lower.includes('computer') || lower.includes('macbook') || lower.includes('pc') || lower.includes('coding')) {
    category = 'Computers';
  } else if (lower.includes('rice') || lower.includes('grocer') || lower.includes('chawal') || lower.includes('akki') || lower.includes('provisions') || lower.includes('oil') || lower.includes('dal')) {
    category = 'Groceries';
  } else if (lower.includes('drill') || lower.includes('tool') || lower.includes('hardware') || lower.includes('screw') || lower.includes('electrical')) {
    category = 'Hardware';
  } else if (lower.includes('shirt') || lower.includes('cloth') || lower.includes('pant') || lower.includes('garment') || lower.includes('suit')) {
    category = 'Clothing';
  } else {
    category = 'Electronics';
  }

  // 3. Product & Brand identification
  let product = 'Local Market Item';
  let brand = 'Standard Quality';
  
  if (category === 'Computers') {
    product = 'Coding Laptop (16GB RAM / SSD)';
    if (lower.includes('macbook') || lower.includes('apple')) brand = 'Apple';
    else if (lower.includes('asus')) brand = 'ASUS';
    else if (lower.includes('hp')) brand = 'HP';
    else brand = 'Asus / Lenovo / HP';
  } else if (category === 'Electronics') {
    if (lower.includes('samsung')) {
      product = 'Samsung Galaxy Smartphone (5G)';
      brand = 'Samsung';
    } else {
      product = '5G Smartphone';
      brand = 'Popular Brand';
    }
  } else if (category === 'Groceries') {
    product = 'Sona Masoori Rice Bag';
    brand = 'Premium Grain Mill';
  } else if (category === 'Hardware') {
    product = 'Impact Drill Machine (500W)';
    brand = 'Bosch / Standalone Power Tools';
  } else if (category === 'Clothing') {
    product = 'Pure Cotton Formal Shirts';
    brand = 'Raymond / Local Emporium';
  }

  // 4. Quantity & Location
  let quantity = '1 Unit';
  if (lower.includes('5kg') || lower.includes('5 kg')) quantity = '5 kg Bag';
  else if (lower.includes('2') || lower.includes('pair')) quantity = '2 Units';

  let location = 'Hulkoti Market / Gadag';
  if (lower.includes('gadag')) location = 'Gadag Market';
  else if (lower.includes('bengaluru') || lower.includes('bangalore')) location = 'Indiranagar, Bengaluru';

  // 5. Preferences
  const preferences: string[] = [
    'Official / Manufacturer Warranty',
    'Verified Local Merchant',
    'Immediate Stock Availability'
  ];

  if (category === 'Computers') {
    preferences.push('Min 16GB RAM for Development', 'Includes Charger & Bag');
  } else if (category === 'Electronics') {
    preferences.push('Brand Sealed Pack', '5G Network Support');
  } else if (category === 'Groceries') {
    preferences.push('Fresh Season Harvest', 'FSSAI Approved');
  }

  return {
    product,
    brand,
    category,
    quantity,
    budget,
    location,
    preferences,
    originalPrompt: input,
    language: lang
  };
}
